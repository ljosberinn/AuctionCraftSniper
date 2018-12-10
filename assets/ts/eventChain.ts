import * as distanceInWordsStrict from 'date-fns/distance_in_words_strict';

import { setACSLocalStorage, ACS } from './localStorage';
import {
  updateState,
  sortByProfit,
  getTUJBaseURL,
  cloneOrigin,
  toggleSearchLoadingState,
  showHint,
  copyOnClick,
  showLocalStorage,
  clearLocalStorage,
  toggleProgressBar,
  toggleUserInputs,
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
  createLossyRecipeHintTR,
  createWinMarginTD,
} from './elementBuilder';

// minutes to milliseconds
const REFRESHER_INTERVAL = 30000; // 0.5 * 1000 * 60

/**
 *
 * @param {any} queryElement
 * @param {string} selector
 * @returns {string}
 */
const buildTSMString = (queryElement: any, selector: string): string => {
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
  e.stopPropagation();

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

let refreshInterval;

const refreshData = (): void => {
  if (new Date().getTime() - ACS.lastUpdate > ACS.houseUpdateInterval) {
    console.log('Refresher triggered - searching for data...');
    setACSLocalStorage({ currentTab: (<HTMLUListElement>document.querySelector('li.is-active')).dataset.professionTab });
    // since we're using the stored data, skip searchListener() & validateRegionRealm()
    console.group(`starting search for houseID ${ACS.houseID} with profession ${ACS.professions.toString()} at expansionLevel ${ACS.expansionLevel}`);
    console.time('search');
    toggleUserInputs();
    toggleSearchLoadingState();
    checkHouseAge(true);
  } else {
    console.log('Refresher triggered - update currently impossible.');
    insertLastUpdate(ACS.lastUpdate);
  }
};

export const searchListener = () => {
  const value = (<HTMLInputElement>document.getElementById('realm')).value.split('-');

  if (value.length !== 2) {
    showHint('region-realm');
    return false;
  }

  if (ACS.professions.length === 0) {
    showHint('professions');
    return false;
  }

  console.group(`starting search for houseID ${ACS.houseID} with profession ${ACS.professions.toString()} at expansionLevel ${ACS.expansionLevel}`);
  console.time('search');

  document.getElementById('auction-craft-sniper').classList.add('visible');
  document.getElementById('description').classList.remove('visible');
  document.getElementById('house-unavailable-disclaimer').classList.remove('visible');

  toggleUserInputs();
  toggleSearchLoadingState();
  validateRegionRealm(value);

  // initiate refresher, updating every 60 seconds
  if (typeof refreshInterval === 'undefined') {
    refreshInterval = setInterval(refreshData, REFRESHER_INTERVAL);
  }
};

/**
 *
 * @param {string} value
 */
const validateRegionRealm = async (value: string[]) => {
  const [region, realm] = value;

  updateState('validating region & realm');

  const data = await fetch(`api/validateRegionRealm.php?region=${region}&realm=${realm}`, {
    method: 'GET',
    credentials: 'same-origin',
    mode: 'same-origin',
  });

  const json: AuctionCraftSniper.validateRegionRealmJSON = await data.json();

  // only proceed when input is valid REGION-REALM pair and server responded with houseID
  if (json.houseID) {
    setACSLocalStorage({ houseID: json.houseID, houseUpdateInterval: json.updateInterval });
    checkHouseAge();
  } else {
    showHouseUnavailabilityError();
  }
};

/**
 *
 * @param {boolean} triggeredByRefresher
 */
const checkHouseAge = async (triggeredByRefresher: boolean = false) => {
  const { houseID, expansionLevel } = ACS;

  if (houseID !== undefined) {
    updateState('validating data age');

    const data = await fetch(`api/checkHouseAge.php?houseID=${houseID}&expansionLevel=${expansionLevel}`, {
      method: 'GET',
      credentials: 'same-origin',
      mode: 'same-origin',
    });

    const json: AuctionCraftSniper.checkHouseAgeJSON = await data.json();

    if (json.lastUpdate !== 0) {
      insertLastUpdate(json.lastUpdate);
      setACSLocalStorage({ lastUpdate: json.lastUpdate });
    }

    switch (json.callback) {
      case 'houseRequiresUpdate':
        getAuctionHouseData();
        if (ACS.settings.pushNotificationsAllowed) {
          // eventual Push notification implementation
        }
        break;
      case 'getProfessionTables':
        // only fetch professionData if current data isnt already up to date
        if (!triggeredByRefresher) {
          getProfessionTables();
        } else {
          toggleUserInputs(false);
          updateState('idling');
          toggleSearchLoadingState();
          toggleProgressBar(false);

          console.timeEnd('search');
          console.groupEnd();
        }
        break;
      default:
        showHouseUnavailabilityError();
        break;
    }
  } else {
    console.warn(`Insufficient params - professions: house: ${houseID}`);
  }
};

const showHouseUnavailabilityError = (): void => {
  console.warn('house unavailable');
  toggleUserInputs(false);
  toggleSearchLoadingState();
  document.getElementById('auction-craft-sniper').classList.remove('visible');
  document.getElementById('house-unavailable-disclaimer').classList.add('visible');
};

/**
 *
 * @param {number} step
 * @param {object} itemIDs
 */
const parseAuctionData = async (step = 0, itemIDs = {}) => {
  const payload: AuctionCraftSniper.parseAuctionDataPayload = {
    houseID: ACS.houseID,
    itemIDs,
    expansionLevel: ACS.expansionLevel,
  };

  if (step > 0) {
    payload.step = step;
  }

  updateState('parsing data');

  const data = await fetch('api/parseAuctionData.php', {
    method: 'POST',
    body: JSON.stringify(payload),
    mode: 'same-origin',
    credentials: 'same-origin',
  });

  const json: AuctionCraftSniper.parseAuctionDataResponseJSON = await data.json();

  const progressBar = <HTMLProgressElement>document.getElementById('progress-bar');

  if (json.err) {
    showHouseUnavailabilityError();
    throw new Error(json.err);
  } else {
    progressBar.value = Math.round(json.percentDone);
  }

  if (json.step < json.reqSteps) {
    parseAuctionData(json.step, json.itemIDs);
  } else if (json.reqSteps === json.step && json.callback === 'getProfessionTables') {
    getProfessionTables();
  }
};

const getAuctionHouseData = async () => {
  updateState('retrieving data from Blizzard - this can take up to a minute, please be patient!');

  const data = await fetch(`api/getAuctionHouseData.php?houseID=${ACS.houseID}`, {
    method: 'GET',
    credentials: 'same-origin',
    mode: 'same-origin',
  });

  const json = await data.json();

  switch (json.callback) {
    case 'parseAuctionData':
      parseAuctionData();
      break;
    default:
      showHouseUnavailabilityError();
  }
};

const getProfessionTables = async () => {
  updateState('fetching results');

  const { houseID, expansionLevel, professions } = ACS;

  const data = await fetch(`api/getProfessionTables.php?houseID=${houseID}&expansionLevel=${expansionLevel}&professions=${professions.toString()}`, {
    method: 'GET',
    credentials: 'same-origin',
    mode: 'same-origin',
  });

  const json: AuctionCraftSniper.outerProfessionDataJSON = await data.json();

  if (json.callback) {
    showHouseUnavailabilityError();
  } else {
    fillProfessionTables(json);

    toggleProgressBar(false);
  }
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

const hideProfessionTabs = () => {
  document.querySelectorAll('[data-profession-tab]').forEach((li: HTMLUListElement) => li.classList.remove('is-active', 'visible'));
};

const hideProfessionTables = () => {
  document.querySelectorAll('#auction-craft-sniper table').forEach((table: HTMLTableElement) => (table.style.display = 'none'));
};

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
const fillProfessionTables = (json: AuctionCraftSniper.outerProfessionDataJSON = {}) => {
  console.group(`filling profession tables for ${ACS.professions.length} professions`);
  console.time('fillProfessionTables');

  const TUJLink = getTUJBaseURL();

  let subNavHasActiveIndicator = false;

  hideProfessionTabs();
  hideProfessionTables();
  emptyProfessionTables();

  Object.entries(json).forEach(entry => {
    let professionName: string;
    let recipes: AuctionCraftSniper.innerProfessionDataJSON[];
    [professionName, recipes] = entry;

    console.time(professionName);

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

    const [positiveTbody, negativeTbody] = [cloneOrigin.tbody.cloneNode(), <HTMLTableSectionElement>cloneOrigin.tbody.cloneNode()];
    negativeTbody.classList.add('lossy-recipes');

    sortByProfit(recipes).forEach(recipe => {
      const isBlacklisted = ACS.settings.blacklistedRecipes.includes(recipe.product.item);

      if ((!ACS.settings.hideBlacklistedRecipes && isBlacklisted) || !isBlacklisted) {
        const tr = <HTMLTableRowElement>fillRecipeTR(recipe, TUJLink, isBlacklisted);

        if (recipe.profit > 0 || ACS.settings.alwaysShowLossyRecipes) {
          positiveTbody.appendChild(tr);
        } else {
          negativeTbody.appendChild(tr);
        }
      }
    });

    // add hint in case entire profession is making loss
    if (!positiveTbody.hasChildNodes()) {
      positiveTbody.appendChild(createMissingProfitsHintTR());
    }

    // add hint in case at least some professions are lossy
    if (negativeTbody.hasChildNodes()) {
      positiveTbody.appendChild(createLossyRecipeHintTR());
    }

    [initiateTHead(), positiveTbody, negativeTbody].forEach(tbody => professionTable.appendChild(tbody));

    console.timeEnd(professionName);
  });

  toggleUserInputs(false);
  updateState('idling');
  toggleSearchLoadingState();
  eval('$WowheadPower.init();');

  console.groupEnd();
  console.timeEnd('fillProfessionTables');
  console.timeEnd('search');
  console.groupEnd();
};

export const toggleLossyRecipes = function () {
  const target = <HTMLTableSectionElement> this.closest('tbody').nextElementSibling;
  const isVisible = target.style.display === 'table-row-group';

  let newText: string;

  if (isVisible) {
    target.style.display = 'none';
    newText = 'show lossy recipes';
  } else {
    target.style.display = 'table-row-group';
    newText = 'hide lossy recipes';
  }

  this.innerText = newText;
};

const subNavEventListener = function () {
  if (!this.classList.contains('is-active')) {
    this.parentElement.querySelectorAll('li[data-profession-tab]').forEach((li: HTMLUListElement) => li.classList[li === this ? 'add' : 'remove']('is-active'));

    document.querySelectorAll('#auction-craft-sniper table').forEach((table: HTMLTableElement) => (table.style.display = table.id !== this.dataset.professionTab ? 'none' : 'table'));

    setACSLocalStorage({ currentTab: this.dataset.professionTab });
  }
};

const toggleSettingsModal = () => {
  document.getElementById('settings-modal').classList.toggle('visible');
};

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
const insertLastUpdate = (lastUpdate: number) => {
  const lastUpdateSpan = <HTMLSpanElement>document.getElementById('last-update');

  lastUpdateSpan.parentElement.classList.add('visible');

  const date = new Date(lastUpdate);

  lastUpdateSpan.innerText = `${distanceInWordsStrict(new Date(), lastUpdate, { addSuffix: true })} (${date.toLocaleDateString()} - ${date.toLocaleTimeString()})`;
};
