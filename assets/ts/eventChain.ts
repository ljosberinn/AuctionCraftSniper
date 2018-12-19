import * as distanceInWordsStrict from 'date-fns/distance_in_words_strict';
import * as distanceInWordsToNow from 'date-fns/distance_in_words_to_now';
import * as Tablesort from 'tablesort';

import { setACSLocalStorage, ACS } from './localStorage';
import {
  updateState, sortByProfit, getTUJBaseURL, cloneOrigin, toggleSearchLoadingState, showHint, copyOnClick, showLocalStorage, clearLocalStorage, toggleUserInputs,
} from './helper';
import { AuctionCraftSniper } from './types';

import {
  initiateTHead,
  createBlackListTD,
  createProfitTD,
  createMissingProfitsHintTR,
  createProductNameTD,
  createMaterialTD,
  createProductBuyoutTD,
  getCurrencyElements,
  createRecipeHintTR,
  createWinMarginTD,
} from './elementBuilder';

// extension of Tablesort since it's currently impossible to import it via modules
(function () {
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
    item => item.match(/^[-+]?[£\x24Û¢´€]?\d+\s*([,\.]\d{0,2})/) // Prefixed currency
      || item.match(/^[-+]?\d+\s*([,\.]\d{0,2})?[£\x24Û¢´€]/) // Suffixed currency
      || item.match(/^[-+]?(\d)*-?([,\.]){0,1}-?(\d)+([E,e][\-+][\d]+)?%?$/), // Number

    (a, b) => {
      a = cleanNumber(a);
      b = cleanNumber(b);

      return compareNumber(b, a);
    },
  );
}());

/**
 * @var {number} REFRESHER_INTERVAL
 * @description  [the interval in which the automatic check for updates will be made]
 */
const REFRESHER_INTERVAL = 60000; // 1 * 1000 * 60

/**
 *
 * @param {any} queryElement
 * @param {string} selector
 *
 * @returns {string}
 */
const buildTSMString = (queryElement: HTMLElement | Document, selector: string): string => {
  let exportString = '';

  queryElement.querySelectorAll(selector).forEach((td: HTMLTableCellElement) => (exportString += `i:${parseInt(td.dataset.recipe)},`));

  return exportString.slice(0, -1);
};

const generalTSMExportListener = (): void => copyOnClick(buildTSMString(document, '#auction-craft-sniper td.recipe-is-visible[data-recipe]'));

/**
 *
 * @param {string} target
 */
export const TSMListener = (el: HTMLTableCellElement, target: string): void => {
  const previousTable = el.closest('table');
  const tbodySpecifics = target === '.lossy-recipes' ? target : ':first-of-type';

  copyOnClick(buildTSMString(previousTable, `tbody${tbodySpecifics} td.recipe-is-visible[data-recipe]`));
};

/**
 *
 * @param {Event} e
 */
const professionsEventListener = function (e: Event): void {
  const { value, checked } = <HTMLInputElement> this;
  const index = ACS.professions.indexOf(parseInt(value));

  this.previousElementSibling.classList.toggle('icon-disabled');

  if (checked && index === -1) {
    ACS.professions.push(parseInt(value));
  } else {
    ACS.professions.splice(index, 1);
  }

  setACSLocalStorage({ professions: ACS.professions });
};

const expansionLevelListener = (expansionLevel: number): void => setACSLocalStorage({ expansionLevel });

const requestNotificationPermission = (): void => {
  // if user is requested for the first time || user revoked rights at some point
  if (!ACS.settings.pushNotificationsAllowed && 'Notification' in window) {
    Notification.requestPermission().then(result => {
      setACSLocalStorage({ settings: { pushNotificationsAllowed: result === 'granted' } });
    });
  } else {
    setACSLocalStorage({ settings: { pushNotificationsAllowed: false } });
  }
};

const settingEvent = function (): void {
  const payload = {};
  payload[this.id] = this.checked;

  setACSLocalStorage({ settings: payload });
};

const settingListener = (): void => {
  document.querySelectorAll('#settings-modal input[type="checkbox"]').forEach(checkbox => {
    if (checkbox.id === 'pushNotificationsAllowed') {
      checkbox.addEventListener('change', requestNotificationPermission);
    } else {
      checkbox.addEventListener('change', settingEvent);
    }
  });
};

const killRefreshInterval = () => {
  if (typeof refreshInterval === 'number') {
    clearInterval(refreshInterval);
    refreshInterval = void 0;
  }
};

/**
 *
 * @param {number} interval
 */
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
      const currentTab = <HTMLUListElement>document.querySelector('li.is-active');
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

  const hintMissingProfessions = <HTMLParagraphElement>document.getElementById('hint-missing-professions');
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
  const value = (<HTMLInputElement>document.getElementById('realm')).value.split('-');

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

/**
 *
 * @param { AuctionCraftSniper.realmRegionParams} args
 */
const validateRegionRealm = async (args: AuctionCraftSniper.realmRegionParams = { value: [], retry: 0 }) => {
  const [region, ...realm] = args.value;

  updateState('validating region & realm');

  let json: AuctionCraftSniper.validateRegionRealmJSON = { houseID: 0, updateInterval: 0 };

  try {
    const data = await fetch(`api/validateRegionRealm.php?region=${region}&realm=${realm.join('-')}`, {
      method: 'GET',
      credentials: 'same-origin',
      mode: 'same-origin',
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

/**
 *
 * @param {AuctionCraftSniper.checkHouseAgeArgs} args
 * @param {AuctionCraftSniper.checkHouseAgeJSON} json
 */
const handleHouseAgeResponse = (args: AuctionCraftSniper.checkHouseAgeArgs, json: AuctionCraftSniper.checkHouseAgeJSON): void => {
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
      if (args.triggeredByRefresher || hasProfessionSelectionChanged()) {
        args.retry = 0;
        getProfessionTables(args);
        return;
      }

      toggleUserInputs(false);
      updateState('idling');
      toggleSearchLoadingState();
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

  for (let i = 0; i <= 8; i += 1) {
    const isChecked = (<HTMLInputElement>professionCheckboxes[i]).checked;
    const isVisible = tabs[i].classList.contains('visible');

    if ((!selectionIsChanged && (isChecked && !isVisible)) || (!isChecked && isVisible)) {
      selectionIsChanged = true;
    }
  }

  return selectionIsChanged;
};

/**
 *
 * @param {AuctionCraftSniper.checkHouseAgeArgs} args
 */
const checkHouseAge = async (args: AuctionCraftSniper.checkHouseAgeArgs = { triggeredByRefresher: false, retry: 0 }) => {
  const { houseID, expansionLevel } = ACS;

  updateState('validating data age');

  let json: AuctionCraftSniper.checkHouseAgeJSON = { callback: '', lastUpdate: 0 };

  try {
    const data = await fetch(`api/checkHouseAge.php?houseID=${houseID}&expansionLevel=${expansionLevel}`, {
      method: 'GET',
      credentials: 'same-origin',
      mode: 'same-origin',
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

/**
 * @param args
 */
const parseAuctionData = async (args = { retry: 0 }) => {
  const payload: AuctionCraftSniper.parseAuctionDataPayload = {
    houseID: ACS.houseID,
    expansionLevel: ACS.expansionLevel,
  };

  updateState('parsing data');

  let json: AuctionCraftSniper.parseAuctionDataResponseJSON = {};

  try {
    const data = await fetch('api/parseAuctionData.php', {
      method: 'POST',
      body: JSON.stringify(payload),
      mode: 'same-origin',
      credentials: 'same-origin',
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
    (<HTMLProgressElement>document.getElementById('progress-bar')).value = 100;
    getProfessionTables();
  }
};

/**
 * @param args
 */
const getAuctionHouseData = async (args = { retry: 0 }) => {
  updateState('retrieving data from Blizzard - this can take up to a minute, please stand by');

  let json = { callback: '' };

  try {
    const data = await fetch(`api/getAuctionHouseData.php?houseID=${ACS.houseID}`, {
      method: 'GET',
      credentials: 'same-origin',
      mode: 'same-origin',
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

/**
 * @param args
 */
export const getProfessionTables = async (args = { triggeredByRefresher: false, retry: 0 }) => {
  updateState('fetching results');

  /*  kill interval to prevent collision if errors occur and fetching is delayed by retrying
   *  or kill shorter interval during waitForParseTimeout callback
   */
  killRefreshInterval();

  const { houseID, expansionLevel, professions } = ACS;

  let json: AuctionCraftSniper.outerProfessionDataJSON = { callback: 'throwHouseUnavailabilityError' };

  try {
    const data = await fetch(`api/getProfessionTables.php?houseID=${houseID}&expansionLevel=${expansionLevel}&professions=${professions.toString()}`, {
      method: 'GET',
      credentials: 'same-origin',
      mode: 'same-origin',
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

export const toggleBlacklistEntry = function () {
  const blacklistedRecipes = ACS.settings.blacklistedRecipes;
  const recipe = parseInt(this.dataset.recipe);

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

/**
 *
 * @param {number} recipe
 * @param {string} TUJLink
 */
const fillRecipeTR = (recipe: AuctionCraftSniper.innerProfessionDataJSON, TUJLink: string, isBlacklisted: boolean) => {
  const tr = <HTMLTableRowElement>cloneOrigin.tr.cloneNode();

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

/**
 *
 * @param {string} professionName
 */
const getProfessionTabListElement = (professionName: string) => document.querySelector(`[data-profession-tab="${professionName}"]`);

const emptyProfessionTables = () => {
  document.querySelectorAll('#auction-craft-sniper table').forEach((table: HTMLTableElement) => {
    while (table.firstChild) {
      table.removeChild(table.lastChild);
    }
  });
};

/**
 *
 * @param {AuctionCraftSniper.outerProfessionDataJSON} json
 */
const fillProfessionTable = (json: AuctionCraftSniper.outerProfessionDataJSON = {}): void => {
  const TUJLink = getTUJBaseURL();
  console.time('fillProfessionTable');

  let subNavHasActiveIndicator = false;

  Object.entries(json).forEach(entry => {
    let professionName: string;
    let recipes: AuctionCraftSniper.innerProfessionDataJSON[];
    [professionName, recipes] = entry;

    const professionTable = <HTMLTableElement>document.getElementById(professionName);

    const professionTabListElement = <HTMLUListElement>getProfessionTabListElement(professionName);
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
      <HTMLTableSectionElement>cloneOrigin.tbody.cloneNode(),
      <HTMLTableSectionElement>cloneOrigin.tbody.cloneNode(),
    ];
    negativeTbody.classList.add('lossy-recipes');
    unlistedTbody.classList.add('unlisted-recipes');

    sortByProfit(recipes).forEach(recipe => {
      const isBlacklisted = ACS.settings.blacklistedRecipes.includes(recipe.product.item);

      // only prceed if user opts to not entirely hide blacklisted recipes OR recipe is not blacklisted
      if ((!ACS.settings.hideBlacklistedRecipes && isBlacklisted) || !isBlacklisted) {
        const tr = <HTMLTableRowElement>fillRecipeTR(recipe, TUJLink, isBlacklisted);

        if (recipe.profit > 0 || (recipe.profit < 0 && ACS.settings.alwaysShowLossyRecipes) || (recipe.profit === 0 && ACS.settings.alwaysShowUnlistedRecipes)) {
          positiveTbody.appendChild(tr);
        } else if (recipe.profit < 0) {
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

/**
 *
 * @param {AuctionCraftSniper.outerProfessionDataJSON} json
 * @param {boolean} isShorthanded
 */
const manageProfessionTables = (json: AuctionCraftSniper.outerProfessionDataJSON = {}, isShorthanded: boolean = false) => {
  hideProfessionTabs();
  hideProfessionTables();
  emptyProfessionTables();

  fillProfessionTable(json);

  document.getElementById('general-tsm-export').classList.add('visible');

  // sentry #803194334
  eval('"$WowheadPower" in window ? $WowheadPower.init() : void 0;');

  // when switching professions entirely and searching anew
  if (document.querySelector('li[data-profession-tab].is-active') === null) {
    (<HTMLUListElement>document.querySelector('li[data-profession-tab].visible')).click();
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

export const toggleTBody = function () {
  const targetClass = this.classList[0].replace('-hint', '');

  const target = <HTMLTableSectionElement> this.closest('table').querySelector(`.${targetClass}`);
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

const subNavEventListener = function () {
  if (!this.classList.contains('is-active')) {
    this.parentElement.querySelectorAll('li[data-profession-tab]').forEach((li: HTMLUListElement) => li.classList[li === this ? 'add' : 'remove']('is-active'));

    document.querySelectorAll('#auction-craft-sniper table').forEach((table: HTMLTableElement) => (table.style.display = table.id !== this.dataset.professionTab ? 'none' : 'table'));

    setACSLocalStorage({ currentTab: this.dataset.professionTab });
  }
};

const toggleSettingsModal = () => document.getElementById('settings-modal').classList.toggle('visible');

export const addEventListeners = () => {
  document.querySelectorAll('#professions input[type="checkbox"]').forEach((checkbox: HTMLInputElement) => checkbox.addEventListener('click', professionsEventListener));
  (<HTMLInputElement>document.getElementById('search')).addEventListener('click', searchListener);

  const expansionLevelSelect = <HTMLSelectElement>document.getElementById('expansion-level');
  expansionLevelSelect.addEventListener('change', () => expansionLevelListener(parseInt(expansionLevelSelect.value)));

  document.querySelectorAll('li[data-profession-tab]').forEach(listElement => listElement.addEventListener('click', subNavEventListener));

  settingListener();

  Object.entries({
    'general-tsm-export': generalTSMExportListener,
    settings: toggleSettingsModal,
    showLocalStorage,
    clearLocalStorage,
  }).forEach(entry => {
    const [el, fn] = entry;
    document.getElementById(el).addEventListener('click', fn);
  });
};

/**
 *
 * @param {number} value
 */
export const formatCurrency = (value: number) => {
  let isNegative = false;

  if (value < 0) {
    value *= -1;
    isNegative = true;
  }

  const valueObj: AuctionCraftSniper.valueObj = {
    isNegative,
    gold: 0,
    silver: 0,
    copper: 0,
  };

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

/**
 *
 * @param {number} lastUpdate
 */
const insertUpdateInformation = () => {
  const dateFnSuffix = { addSuffix: true };

  const now = new Date();

  const nextUpdate = new Date(ACS.lastUpdate + ACS.houseUpdateInterval);
  const lastUpdate = new Date(ACS.lastUpdate);

  const lastUpdateSpan = <HTMLSpanElement>document.getElementById('last-update');
  lastUpdateSpan.parentElement.classList.add('visible');
  lastUpdateSpan.innerText = `${distanceInWordsStrict(now, lastUpdate, dateFnSuffix)} (${lastUpdate.toLocaleDateString()} - ${lastUpdate.toLocaleTimeString()})`;

  const nextUpdateSpan = <HTMLSpanElement>document.getElementById('next-update');
  nextUpdateSpan.parentElement.classList.add('visible');

  // next update was supposed to be in the past, but the API hasn't updated
  let nextUpdateText;

  if (nextUpdate.getTime() < now.getTime()) {
    nextUpdateText = `supposedly ${distanceInWordsStrict(now, nextUpdate, dateFnSuffix)}`;
  } else {
    nextUpdateText = `in ${distanceInWordsToNow(nextUpdate)}`;
  }

  nextUpdateText += ` (${nextUpdate.toLocaleDateString()} - ${nextUpdate.toLocaleTimeString()})`;

  nextUpdateSpan.innerText = nextUpdateText;
};
