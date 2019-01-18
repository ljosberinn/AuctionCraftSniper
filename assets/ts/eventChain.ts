import * as distanceInWordsStrict from 'date-fns/distance_in_words_strict';
import * as distanceInWordsToNow from 'date-fns/distance_in_words_to_now';
import * as Tablesort from 'tablesort';

import {
  clearLocalStorage,
  cloneOrigin,
  copyOnClick,
  currencyContainer,
  getTUJBaseURL,
  showHint,
  showLocalStorage,
  sortByProfit,
  toggleSearchLoadingState,
  toggleUserInputs,
  updateState,
  getWoWheadURL
} from './helper';
import { ACS, setACSLocalStorage } from './localStorage';
import { AuctionCraftSniper } from './types';

import {
  createBlackListTD,
  createMaterialTD,
  createMissingProfitsHintTR,
  createProductBuyoutTD,
  createProductNameTD,
  createProfitTD,
  createRecipeHintTR,
  createWinMarginTD,
  getCurrencyElements,
  initiateTHead
} from './elementBuilder';

const ALCHEMY_PROC_RATE: number = 1.4;

// extension of Tablesort since it's currently impossible to import it via modules
(() => {
  const cleanNumber = i => i.replace(/[^\-?0-9.]/g, '');

  const compareNumber = (a, b) => {
    a = parseFloat(a);
    b = parseFloat(b);

    a = isNaN(a) ? 0 : a;
    b = isNaN(b) ? 0 : b;

    return a - b;
  };

  Tablesort.extend(
    'number',
    item =>
      item.match(/^[-+]?[£\x24Û¢´€]?\d+\s*([,\.]\d{0,2})/) || // Prefixed currency
      item.match(/^[-+]?\d+\s*([,\.]\d{0,2})?[£\x24Û¢´€]/) || // Suffixed currency
      item.match(/^[-+]?(\d)*-?([,\.]){0,1}-?(\d)+([E,e][\-+][\d]+)?%?$/), // Number

    (a, b) => {
      a = cleanNumber(a);
      b = cleanNumber(b);

      return compareNumber(b, a);
    }
  );
})();

/**
 * @var {number} REFRESHER_INTERVAL
 * @description  [the interval in which the automatic check for updates will be made]
 */
const REFRESHER_INTERVAL = 60000; // 1 * 1000 * 60

const buildTSMString = (queryElement: HTMLElement | Document, selector: string): string => {
  let exportString = '';

  queryElement.querySelectorAll(selector).forEach((td: HTMLTableCellElement) => (exportString += `i:${parseInt(td.dataset.recipe, 10)},`));

  return exportString.slice(0, -1);
};

const generalTSMExportListener = (): void => copyOnClick(buildTSMString(document, '#auction-craft-sniper td.recipe-is-visible[data-recipe]'));

export const TSMListener = (el: HTMLTableCellElement, target: string): void => {
  const previousTable = el.closest('table');
  const tbodySpecifics = target === '.lossy-recipes' ? target : ':first-of-type';

  copyOnClick(buildTSMString(previousTable, `tbody${tbodySpecifics} td.recipe-is-visible[data-recipe]`));
};

const professionsEventListener = function(e: Event): void {
  const { value, checked } = this as HTMLInputElement;
  const index = ACS.professions.indexOf(parseInt(value, 10));

  this.previousElementSibling.classList.toggle('icon-disabled');

  if (checked && index === -1) {
    ACS.professions.push(parseInt(value, 10));
  } else {
    ACS.professions.splice(index, 1);
  }

  setACSLocalStorage({ professions: ACS.professions });
};

const expansionLevelListener = (expansionLevel: number): void => setACSLocalStorage({ expansionLevel });

const settingEvent = function(): void {
  const THIS = this as HTMLInputElement;
  const payload = {};

  let value;

  switch (THIS.type) {
    case 'checkbox':
      value = THIS.checked;
      break;
    case 'number':
      const tempVal = parseFloat(THIS.value);
      value = !isNaN(tempVal) ? tempVal : 0;
      break;
  }

  payload[THIS.id] = value;

  setACSLocalStorage({ settings: payload });
};

const settingListener = (): void => {
  document.querySelectorAll('#settings-modal input[type="checkbox"]').forEach(checkbox => {
    checkbox.addEventListener('change', settingEvent);
  });

  document.querySelectorAll('#settings-modal input[type="number"]').forEach(inputNumber => {
    inputNumber.addEventListener('input', settingEvent);
  });
};

const killRefreshInterval = () => {
  if (typeof refreshInterval === 'number') {
    clearInterval(refreshInterval);
    refreshInterval = void 0;
  }
};

const initiateRefreshInterval = (interval: number = REFRESHER_INTERVAL) => {
  if (typeof refreshInterval === 'undefined') {
    refreshInterval = setInterval(() => {
      refreshData(interval);
    }, interval);
  }
};

let refreshInterval;

const refreshData = (interval: number = REFRESHER_INTERVAL): void => {
  // sentry #802811501 - deactivate refresher if user unmarked all professions
  if (ACS.professions.length > 0) {
    if (new Date().getTime() - ACS.lastUpdate > ACS.houseUpdateInterval || interval !== REFRESHER_INTERVAL) {
      console.log(`Refresher: updating houseID ${ACS.houseID}`);

      // sentry #802520384
      const currentTab = document.querySelector('li.is-active') as HTMLUListElement;
      if (currentTab !== null) {
        setACSLocalStorage({ currentTab: currentTab.dataset.professionTab });
      }

      // since we're using the stored data, skip searchListener() & validateRegionRealm()
      toggleUserInputs();
      toggleSearchLoadingState();
      checkHouseAge({ triggeredByRefresher: true, retry: 0 });
      return;
    }

    insertUpdateInformation();

    return;
  }

  const hintMissingProfessions = document.getElementById('hint-missing-professions') as HTMLParagraphElement;
  hintMissingProfessions.classList.add('visible');

  setTimeout(() => {
    hintMissingProfessions.classList.remove('visible');
  }, 15000);

  killRefreshInterval();
};

export const hideIntroduction = () => {
  document.getElementById('auction-craft-sniper').classList.add('visible');
  document.getElementById('description').classList.remove('visible');
  document.getElementById('house-unavailable-disclaimer').classList.remove('visible');
};

export const searchListener = () => {
  const value = (document.getElementById('realm') as HTMLInputElement).value.split('-');

  if (value.length < 2) {
    showHint('region-realm');
    return;
  }

  if (ACS.professions.length === 0) {
    showHint('professions');
    return;
  }

  hideIntroduction();

  toggleUserInputs();
  toggleSearchLoadingState();
  validateRegionRealm({ value, retry: 0 });
};

const validateRegionRealm = async (args: AuctionCraftSniper.RealmRegionParamsInterface = { value: [], retry: 0 }) => {
  const [region, ...realm] = args.value;

  updateState('validating region & realm');

  let json: AuctionCraftSniper.ValidateRegionRealmJSONInterface = { houseID: 0, updateInterval: 0 };

  try {
    const data = await fetch(`api/validateRegionRealm.php?region=${region}&realm=${realm.join('-')}`, {
      credentials: 'same-origin',
      method: 'GET',
      mode: 'same-origin'
    });

    json = await data.json();
  } catch (err) {
    if (args.retry <= 2) {
      retryOnError(validateRegionRealm, args);
      return;
    }
  }

  // only proceed when input is valid REGION-REALM pair and server responded with houseID
  if (json.houseID > 0) {
    setACSLocalStorage({ houseID: json.houseID, houseUpdateInterval: json.updateInterval });
    checkHouseAge();
    return;
  }

  if (args.retry > 2) {
    showHouseUnavailabilityError();
  }
};

const retryOnError = (callbackFn, params) => {
  params.retry += 1;

  updateState(`retrying ${params.retry}/3`);

  setTimeout(() => {
    callbackFn(...params);
  }, params.retry * 5000);
};

const handleHouseAgeResponse = (args: AuctionCraftSniper.CheckHouseAgeArgsInterface, json: AuctionCraftSniper.CheckHouseAgeJSONInterface): void => {
  switch (json.callback) {
    case 'waitForParseTimeout':
      updateState('waiting for someone elses parse to finish - please stand by');
      // kill usual interval to restart with a smaller interval (5s)
      killRefreshInterval();
      initiateRefreshInterval(5000);
      break;
    case 'houseRequiresUpdate':
      // kill here since its not supposed to re-fetch whilst downloading
      killRefreshInterval();
      getAuctionHouseData();
      if (ACS.settings.pushNotificationsAllowed) {
        // eventual Push notification implementation
      }
      break;
    case 'getProfessionTables':
      /* fetch data if:
       * - new data should be there via refresherInterval
       * - or profession selection has changed
       */
      args.retry = 0;
      getProfessionTables(args);

      break;
    default:
      if (args.retry > 2) {
        showHouseUnavailabilityError();
      }
      break;
  }
};

const hasProfessionSelectionChanged = (): boolean => {
  const tabs = document.querySelectorAll('[data-profession-tab]');
  const professionCheckboxes = document.querySelectorAll('i + input[type="checkbox"]');

  let selectionIsChanged = false;

  for (let i = 0; i < document.querySelectorAll('[data-profession-tab]').length; i += 1) {
    const isChecked = (professionCheckboxes[i] as HTMLInputElement).checked;
    const isVisible = tabs[i].classList.contains('visible');

    if ((!selectionIsChanged && (isChecked && !isVisible)) || (!isChecked && isVisible)) {
      selectionIsChanged = true;
    }
  }

  return selectionIsChanged;
};

const checkHouseAge = async (args: AuctionCraftSniper.CheckHouseAgeArgsInterface = { triggeredByRefresher: false, retry: 0 }) => {
  const { houseID, expansionLevel } = ACS;

  updateState('validating data age');

  let json: AuctionCraftSniper.CheckHouseAgeJSONInterface = { callback: '', lastUpdate: 0 };

  try {
    const data = await fetch(`api/checkHouseAge.php?houseID=${houseID}&expansionLevel=${expansionLevel}`, {
      credentials: 'same-origin',
      method: 'GET',
      mode: 'same-origin'
    });

    json = await data.json();
  } catch (err) {
    // kill refresher to prevent another fetch whilst in catch-loop in here or further down
    killRefreshInterval();
    if (args.retry <= 2) {
      retryOnError(checkHouseAge, args);
    }
  }

  if (json.lastUpdate !== 0) {
    setACSLocalStorage({ lastUpdate: json.lastUpdate });
    insertUpdateInformation();
  }

  handleHouseAgeResponse(args, json);
};

const showHouseUnavailabilityError = (): void => {
  toggleUserInputs(false);
  toggleSearchLoadingState();

  document.getElementById('auction-craft-sniper').classList.remove('visible');
  document.getElementById('house-unavailable-disclaimer').classList.add('visible');
};

const parseAuctionData = async (args = { retry: 0 }) => {
  const payload: AuctionCraftSniper.ParseAuctionDataPayloadInterface = {
    expansionLevel: ACS.expansionLevel,
    houseID: ACS.houseID
  };

  updateState('parsing data');

  let json: AuctionCraftSniper.ParseAuctionDataResponseJSONInterface = {};

  try {
    const data = await fetch('api/parseAuctionData.php', {
      body: JSON.stringify(payload),
      credentials: 'same-origin',
      method: 'POST',
      mode: 'same-origin'
    });

    json = await data.json();
  } catch (err) {
    if (args.retry <= 2) {
      retryOnError(parseAuctionData, args);
    }
  }

  if (json.err || args.retry > 2) {
    showHouseUnavailabilityError();
  }

  if (json.callback === 'getProfessionTables') {
    (document.getElementById('progress-bar') as HTMLProgressElement).value = 100;
    getProfessionTables();
  }
};

const getAuctionHouseData = async (args = { retry: 0 }) => {
  updateState('retrieving data from Blizzard - this can take up to a minute, please stand by');

  let json = { callback: '' };

  try {
    const data = await fetch(`api/getAuctionHouseData.php?houseID=${ACS.houseID}`, {
      credentials: 'same-origin',
      method: 'GET',
      mode: 'same-origin'
    });

    json = await data.json();
  } catch (err) {
    if (args.retry <= 2) {
      retryOnError(getAuctionHouseData, { args });
    }
  }

  switch (json.callback) {
    case 'parseAuctionData':
      parseAuctionData({ retry: 0 });
      break;
    case 'waitForParseTimeout':
      updateState('waiting for someone elses parse to finish - please stand by');
      // dont kill interval here since file existence can also just mean someone started downloading, hence regular interval applies
      break;
    default:
      if (args.retry > 2) {
        showHouseUnavailabilityError();
      }
  }
};

export const getProfessionTables = async (args = { triggeredByRefresher: false, retry: 0 }) => {
  updateState('fetching results');

  /*  kill interval to prevent collision if errors occur and fetching is delayed by retrying
   *  or kill shorter interval during waitForParseTimeout callback
   */
  killRefreshInterval();

  const { houseID, expansionLevel, professions } = ACS;

  let json: AuctionCraftSniper.OuterProfessionDataJSONInterface = { callback: 'throwHouseUnavailabilityError' };

  try {
    const data = await fetch(`api/getProfessionTables.php?houseID=${houseID}&expansionLevel=${expansionLevel}&professions=${professions.toString()}`, {
      credentials: 'same-origin',
      method: 'GET',
      mode: 'same-origin'
    });

    json = await data.json();
  } catch (err) {
    if (args.retry <= 2) {
      retryOnError(getProfessionTables, args);
      return;
    }
  }

  if (json.callback) {
    showHouseUnavailabilityError();
    return;
  }

  manageProfessionTables(json, args.triggeredByRefresher);
};

export const toggleBlacklistEntry = function() {
  const blacklistedRecipes = ACS.settings.blacklistedRecipes;
  const recipe = parseInt(this.dataset.recipe, 10);

  let search = '';
  let replace = '';

  if (blacklistedRecipes.includes(recipe)) {
    blacklistedRecipes.splice(blacklistedRecipes.indexOf(recipe), 1);
    [search, replace] = ['recipe-is-invisible', 'recipe-is-visible'];
  } else {
    blacklistedRecipes.push(recipe);
    if (ACS.settings.hideBlacklistedRecipes) {
      this.parentElement.remove();
      setACSLocalStorage({ settings: { blacklistedRecipes } });
      return;
    }
    [search, replace] = ['recipe-is-visible', 'recipe-is-invisible'];
  }

  this.classList.replace(search, replace);

  setACSLocalStorage({ settings: { blacklistedRecipes } });

  this.parentElement.classList.toggle('blacklisted');
};

const fillRecipeTR = (recipe: AuctionCraftSniper.InnerProfessionDataJSONInterface, TUJLink: string, isBlacklisted: boolean) => {
  const tr = cloneOrigin.tr.cloneNode() as HTMLTableRowElement;

  if (isBlacklisted) {
    tr.classList.add('blacklisted');
  }

  const productNameTD = createProductNameTD(recipe.product);
  const materialTD = createMaterialTD(recipe);
  const productBuyoutTD = createProductBuyoutTD(recipe, TUJLink);
  const profitTD = createProfitTD(recipe.profit);
  const winMarginTD = createWinMarginTD(recipe.margin);
  const blackListTD = createBlackListTD(recipe.product.item, isBlacklisted);

  [productNameTD, materialTD, productBuyoutTD, profitTD, winMarginTD, blackListTD].forEach(td => tr.appendChild(td));

  return tr;
};

const hideProfessionTabs = () => document.querySelectorAll('#auction-craft-sniper li').forEach((li: HTMLUListElement) => li.classList.remove('is-active', 'visible'));

const hideProfessionTables = () => document.querySelectorAll('#auction-craft-sniper table').forEach((table: HTMLTableElement) => (table.style.display = 'none'));

const getProfessionTabListElement = (professionName: string) => document.querySelector(`[data-profession-tab="${professionName}"]`);

const emptyProfessionTables = () => {
  document.querySelectorAll('#auction-craft-sniper table').forEach((table: HTMLTableElement) => {
    emptyElement(table);
  });
};

const emptyElement = (element: HTMLElement) => {
  while (element.firstChild) {
    element.removeChild(element.lastChild);
  }
};

const belongsToPositiveTBody = (recipe: AuctionCraftSniper.InnerProfessionDataJSONInterface) => {
  const isNegativeButVisible = recipe.profit < 0 && ACS.settings.alwaysShowLossyRecipes;
  const isNeutralButVisible = recipe.profit === 0 && ACS.settings.alwaysShowUnlistedRecipes;

  // is positive && above % threshold && above profitThresholdValue
  const hasPositivePercentageThreshold = recipe.margin > ACS.settings.marginThresholdPercent && recipe.profit > ACS.settings.profitThresholdValue * 100 * 100;

  // user has a value set && above profitThresholdValue
  const hasPositiveProfitThreshold = ACS.settings.profitThresholdValue > 0 && recipe.profit > ACS.settings.profitThresholdValue * 100 * 100;

  /*
   * a recipe is visible if:
   * - setting 'alwaysShowLossyRecipes' is set
   * - OR setting 'alwaysShowUnlistedRecipes' is set
   * - OR recipe is profitable
   * - AND is above user defined % profit threshold
   * - OR is above user defined absolute gold value threshold
   */
  return isNeutralButVisible || isNegativeButVisible || (recipe.profit > 0 && (hasPositivePercentageThreshold || hasPositiveProfitThreshold));
};

const adjustExpulsomProfits = (recipes: AuctionCraftSniper.InnerProfessionDataJSONInterface[], worth: number) => {
  recipes.forEach(recipe => {
    recipe.materials.forEach(material => {
      if (material.itemID === 152668) {
        const sum = worth * material.amount;
        recipe.profit -= sum;
        recipe.materialCostSum += sum;

        material.buyout = worth;
      }
    });
  });

  return recipes;
};

const adjustAlchemyProfits = (alchemyRecipes: AuctionCraftSniper.InnerProfessionDataJSONInterface[]) => {
  alchemyRecipes.forEach(recipe => {
    if (recipe.product.mayProcMultiple) {
      recipe.margin = parseFloat((((recipe.product.buyout * ALCHEMY_PROC_RATE) / recipe.materialCostSum - 1) * 100).toFixed(2));
      recipe.profit = recipe.product.buyout * ALCHEMY_PROC_RATE - recipe.materialCostSum;
    }
  });

  return alchemyRecipes;
};

const insertExpulsomData = (expulsomData: AuctionCraftSniper.ExpulsomWorthObjInterface) => {
  const p = document.getElementById('expulsom-data');
  emptyElement(p);

  const fragment = document.createDocumentFragment();

  Object.entries(expulsomData).forEach(entry => {
    const [key, value] = entry;

    const span = document.createElement('span');
    let content;

    switch (key) {
      case 'cheapestItem':
        span.innerText = 'Cheapest scrapping item: ';
        content = cloneOrigin.a.cloneNode();
        content.href = getWoWheadURL(value);
        content.innerText = value;
        break;
      case 'estimatedWorth':
        span.innerText = 'Est. Expulsom price: ';
        content = formatCurrency(value);
        break;
      case 'adjustedWorth':
        span.innerText = 'Adj. Expulsom price: ';
        content = formatCurrency(value);
        break;
    }

    [span, content, document.createElement('br')].forEach(element => fragment.appendChild(element));
  });

  p.appendChild(fragment);
};

const fillProfessionTable = (json: AuctionCraftSniper.OuterProfessionDataJSONInterface = {}): void => {
  const TUJLink = getTUJBaseURL();
  console.time('fillProfessionTable');

  let subNavHasActiveIndicator = false;

  const { expulsomData, ...tables } = json;

  insertExpulsomData(expulsomData);

  Object.entries(tables).forEach(entry => {
    let professionName: string;
    let recipes: AuctionCraftSniper.InnerProfessionDataJSONInterface[];
    [professionName, recipes] = entry;

    const professionTable = document.getElementById(professionName) as HTMLTableElement;

    const professionTabListElement = getProfessionTabListElement(professionName) as HTMLUListElement;
    professionTabListElement.classList.add('visible');

    if (!subNavHasActiveIndicator) {
      if (ACS.currentTab === undefined) {
        ACS.currentTab = professionName;
      }

      if (ACS.currentTab === professionName) {
        professionTabListElement.classList.add('is-active');

        professionTable.style.display = 'table';
        subNavHasActiveIndicator = true;
      }
    }

    const [positiveTbody, negativeTbody, unlistedTbody] = [
      cloneOrigin.tbody.cloneNode(),
      cloneOrigin.tbody.cloneNode() as HTMLTableSectionElement,
      cloneOrigin.tbody.cloneNode() as HTMLTableSectionElement
    ];

    negativeTbody.classList.add('lossy-recipes');
    unlistedTbody.classList.add('unlisted-recipes');

    if (ACS.settings.useAssumedAlchemyProcRate && professionName === 'alchemy') {
      recipes = adjustAlchemyProfits(recipes);
    }

    if (ACS.settings.useAdjustedExpulsomWorth || ACS.settings.useEstimatedExpulsomWorth) {
      const worth = expulsomData[ACS.settings.useAdjustedExpulsomWorth ? 'adjustedWorth' : 'estimatedWorth'];

      if (worth > 0) {
        recipes = adjustExpulsomProfits(recipes, worth);
      }
    }

    sortByProfit(recipes).forEach(recipe => {
      const isBlacklisted = ACS.settings.blacklistedRecipes.includes(recipe.product.item);

      // only proceed if user opts to not entirely hide blacklisted recipes OR recipe is not blacklisted
      if ((!ACS.settings.hideBlacklistedRecipes && isBlacklisted) || !isBlacklisted) {
        const tr = fillRecipeTR(recipe, TUJLink, isBlacklisted) as HTMLTableRowElement;

        if (belongsToPositiveTBody(recipe)) {
          positiveTbody.appendChild(tr);
        } else if (recipe.profit !== 0) {
          negativeTbody.appendChild(tr);
        } else {
          unlistedTbody.appendChild(tr);
        }
      }
    });

    // add hint in case entire profession is making loss
    if (!positiveTbody.hasChildNodes()) {
      positiveTbody.appendChild(createMissingProfitsHintTR());
    }
    const appendix = [initiateTHead(), positiveTbody];

    // add hint in case at least some professions are lossy
    if (negativeTbody.hasChildNodes()) {
      appendix.push(createRecipeHintTR('lossy-recipes'));
    }
    appendix.push(negativeTbody);

    // add hint in case some recipes are currently unlisted
    if (unlistedTbody.hasChildNodes()) {
      appendix.push(createRecipeHintTR('unlisted-recipes'));
    }
    appendix.push(unlistedTbody);

    const tbodiesFragment = document.createDocumentFragment();
    appendix.forEach(tbody => tbodiesFragment.appendChild(tbody));

    professionTable.appendChild(tbodiesFragment);

    Tablesort(professionTable);
  });

  console.timeEnd('fillProfessionTable');
};

const manageProfessionTables = (json: AuctionCraftSniper.OuterProfessionDataJSONInterface = {}, isShorthanded: boolean = false) => {
  hideProfessionTabs();
  hideProfessionTables();
  emptyProfessionTables();

  fillProfessionTable(json);

  document.getElementById('general-tsm-export').classList.add('visible');

  // sentry #803194334
  eval('"$WowheadPower" in window ? $WowheadPower.init() : void 0;');

  // when switching professions entirely and searching anew
  if (document.querySelector('li[data-profession-tab].is-active') === null) {
    (document.querySelector('li[data-profession-tab].visible') as HTMLUListElement).click();
  }

  initiateRefreshInterval();

  toggleUserInputs(false);
  toggleSearchLoadingState();

  if (isShorthanded) {
    insertUpdateInformation();
    return;
  }

  updateState('idling');
};

export const toggleTBody = function() {
  const targetClass = this.classList[0].replace('-hint', '');

  const target = this.closest('table').querySelector(`.${targetClass}`) as HTMLTableSectionElement;
  const isCurrentlyVisible = target.style.display === 'table-row-group';

  let newText: string;

  switch (targetClass) {
    case 'lossy-recipes':
      newText = `${isCurrentlyVisible ? 'show' : 'hide'} lossy recipes`;
      break;
    case 'unlisted-recipes':
      newText = `${isCurrentlyVisible ? 'show' : 'hide'} unlisted recipes`;
      break;
  }

  target.style.display = isCurrentlyVisible ? 'none' : 'table-row-group';

  this.innerText = newText;
};

const subNavEventListener = function() {
  if (!this.classList.contains('is-active')) {
    this.parentElement.querySelectorAll('li[data-profession-tab]').forEach((li: HTMLUListElement) => li.classList[li === this ? 'add' : 'remove']('is-active'));

    document.querySelectorAll('#auction-craft-sniper table').forEach((table: HTMLTableElement) => (table.style.display = table.id !== this.dataset.professionTab ? 'none' : 'table'));

    setACSLocalStorage({ currentTab: this.dataset.professionTab });
  }
};

const toggleSettingsModal = () => document.getElementById('settings-modal').classList.toggle('visible');

export const addEventListeners = () => {
  document.querySelectorAll('#professions input[type="checkbox"]').forEach((checkbox: HTMLInputElement) => checkbox.addEventListener('click', professionsEventListener));
  (document.getElementById('search') as HTMLInputElement).addEventListener('click', searchListener);

  const expansionLevelSelect = document.getElementById('expansion-level') as HTMLSelectElement;
  expansionLevelSelect.addEventListener('change', () => expansionLevelListener(parseInt(expansionLevelSelect.value, 10)));

  document.querySelectorAll('li[data-profession-tab]').forEach(listElement => listElement.addEventListener('click', subNavEventListener));

  settingListener();

  Object.entries({
    clearLocalStorage,
    'general-tsm-export': generalTSMExportListener,
    settings: toggleSettingsModal,
    showLocalStorage
  }).forEach(entry => {
    const [el, fn] = entry;
    document.getElementById(el).addEventListener('click', fn);
  });
};

export const formatCurrency = (value: number) => {
  const valueObj = { ...currencyContainer };

  let isNegative = false;

  if (value < 0) {
    value *= -1;
    isNegative = true;
  }

  valueObj.isNegative = isNegative;

  if (value < 100) {
    valueObj.copper = value;
    return getCurrencyElements(valueObj);
  }

  if (value < 10000) {
    valueObj.silver = Math.floor(value / 100);
    valueObj.copper = value - valueObj.silver * 100;

    return getCurrencyElements(valueObj);
  }

  valueObj.gold = Math.floor(value / 100 / 100);
  valueObj.silver = Math.floor((value - valueObj.gold * 100 * 100) / 100);
  valueObj.copper = Math.floor(value - valueObj.gold * 100 * 100 - valueObj.silver * 100);

  return getCurrencyElements(valueObj);
};

const insertUpdateInformation = () => {
  const dateFnSuffix = { addSuffix: true };

  const now = new Date();

  const nextUpdate = new Date(ACS.lastUpdate + ACS.houseUpdateInterval);
  const lastUpdate = new Date(ACS.lastUpdate);

  const lastUpdateSpan = document.getElementById('last-update') as HTMLSpanElement;
  lastUpdateSpan.parentElement.classList.add('visible');
  lastUpdateSpan.innerText = `${distanceInWordsStrict(now, lastUpdate, dateFnSuffix)} (${lastUpdate.toLocaleDateString()} - ${lastUpdate.toLocaleTimeString()})`;

  const nextUpdateSpan = document.getElementById('next-update') as HTMLSpanElement;
  nextUpdateSpan.parentElement.classList.add('visible');

  // next update was supposed to be in the past, but the API hasn't updated
  let nextUpdateText = nextUpdate.getTime() < now.getTime() ? `supposedly ${distanceInWordsStrict(now, nextUpdate, dateFnSuffix)}` : `in ${distanceInWordsToNow(nextUpdate)}`;

  nextUpdateText += ` (${nextUpdate.toLocaleDateString()} - ${nextUpdate.toLocaleTimeString()})`;

  nextUpdateSpan.innerText = nextUpdateText;
};
