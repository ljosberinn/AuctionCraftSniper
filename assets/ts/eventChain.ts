import * as distanceInWordsStrict from 'date-fns/distance_in_words_strict';
import tippy from 'tippy.js';

import { setACSLocalStorage, ACS } from './localStorage';
import {
  updateState, sortByProfit, getTUJBaseURL, cloneOrigin,
} from './helper';
import { AuctionCraftSniper } from './types';

import {
  initiateTHead, createBlackListTD, createProfitTD, createMissingProfitsHintTR, createProductNameTD, createMaterialTD, createProductBuyoutTD, getCurrencyElements,
} from './elementBuilder';

const professionsEventListener = function (e: Event) {
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

const expansionLevelListener = (expansionLevel: number) => setACSLocalStorage({ expansionLevel });

const settingListener = () => {
  document.querySelectorAll('#settings-modal input[type="checkbox"]').forEach(checkbox => {
    checkbox.addEventListener('change', function () {
      const payload = {};
      payload[this.id] = this.checked;

      setACSLocalStorage({ settings: payload });
    });
  });
};

export const searchListener = () => {
  const value = (<HTMLInputElement>document.getElementById('realm')).value.split('-');

  if (value.length === 2) {
    console.time('search');
    toggleUserInputs(true);
    validateRegionRealm(value);
  }
};

const toggleUserInputs = (state: boolean) => {
  document.querySelectorAll('input').forEach(input => (input.type === 'checkbox' ? (input.disabled = state) : (input.readOnly = state)));
  [<HTMLInputElement>document.getElementById('search'), <HTMLSelectElement>document.getElementById('expansion-level')].forEach(el => (el.disabled = state));
};

const validateRegionRealm = async (value: string[]) => {
  const region: string = value[0];
  const realm: string = value[1];

  updateState('validateRegionRealm');

  await fetch(`api/validateRegionRealm.php?region=${region}&realm=${realm}`, {
    method: 'GET',
    credentials: 'same-origin',
    mode: 'same-origin',
  })
    .then(response => response.json())
    .then(json => {
      // only proceed when input is valid REGION-REALM pair and server responded with house ID
      if (json.houseID) {
        setACSLocalStorage({ houseID: json.houseID });
        checkHouseAge();
      }
    })
    .catch(err => {
      console.error(`Error validating region and/or realm: ${err}`);
    });
};

const checkHouseAge = async () => {
  const { houseID, expansionLevel } = ACS;

  if (houseID !== undefined) {
    updateState('checkHouseAge');

    const data = await fetch(`api/checkHouseAge.php?houseID=${houseID}&expansionLevel=${expansionLevel}`, {
      method: 'GET',
      credentials: 'same-origin',
      mode: 'same-origin',
    });

    const json: AuctionCraftSniper.checkHouseAgeJSON = await data.json();

    if (json.lastUpdate !== 0) {
      insertLastUpdate(json.lastUpdate);
    }

    switch (json.callback) {
      case 'houseRequiresUpdate':
        getAuctionHouseData();
        if (ACS.settings.pushNotificationsAllowed) {
          // eventual Push notification implementation
        }
        break;
      case 'getProfessionTables':
        getProfessionTables();
        break;
      default:
        showHouseUnavailabilityError();
        break;
    }
  } else {
    console.warn(`Insufficient params - professions: house: ${houseID}`);
  }
};

const showHouseUnavailabilityError = () => {
  console.warn('house unavailable');
};

const parseAuctionData = async (step = 0, itemIDs = {}) => {
  const payload: AuctionCraftSniper.parseAuctionDataPayload = {
    houseID: ACS.houseID,
    itemIDs,
    expansionLevel: ACS.expansionLevel,
  };

  if (step > 0) {
    payload.step = step;
  }

  updateState('parseAuctionData');

  const data = await fetch('api/parseAuctionData.php', {
    method: 'POST',
    body: JSON.stringify(payload),
    mode: 'same-origin',
    credentials: 'same-origin',
  });

  const json: AuctionCraftSniper.parseAuctionDataResponseJSON = await data.json();

  if (json.err) {
    throw new Error(json.err);
  } else {
    (<HTMLProgressElement>document.getElementById('progress-bar')).value = Math.round(json.percentDone);
  }

  if (json.step < json.reqSteps) {
    parseAuctionData(json.step, json.itemIDs);
  } else if (json.reqSteps === json.step && json.callback === 'getProfessionTables') {
    getProfessionTables();
  }
};

const getAuctionHouseData = async () => {
  updateState('getAuctionHouseData');

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
      throw new Error('invalid callback');
  }
};

const getProfessionTables = async () => {
  updateState('getProfessionTables');

  const { houseID, expansionLevel, professions } = ACS;

  const data = await fetch(`api/getProfessionTables.php?houseID=${houseID}&expansionLevel=${expansionLevel}&professions=${professions.toString()}`, {
    method: 'GET',
    credentials: 'same-origin',
    mode: 'same-origin',
  });

  const json: AuctionCraftSniper.outerProfessionDataJSON = await data.json();

  fillProfessionTables(json);
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
    [search, replace] = ['recipe-is-visible', 'recipe-is-invisible'];
  }

  this.classList.replace(search, replace);

  setACSLocalStorage({ settings: { blacklistedRecipes } });

  this.parentElement.classList.toggle('blacklisted');
};

const fillProfessionTables = (json: AuctionCraftSniper.outerProfessionDataJSON = {}) => {
  console.time('fillProfessionTables');

  const TUJLink = getTUJBaseURL();

  Object.entries(json).forEach(entry => {
    let professionName: string;
    let recipes: AuctionCraftSniper.innerProfessionDataJSON[];
    [professionName, recipes] = entry;

    console.time(professionName);

    const professionTable = <HTMLTableElement>document.getElementById(professionName.toLowerCase());

    const [positiveTbody, negativeTbody] = [cloneOrigin.tbody.cloneNode(), <HTMLTableSectionElement>cloneOrigin.tbody.cloneNode()];
    negativeTbody.classList.add('lossy-recipes');

    sortByProfit(recipes).forEach(recipe => {
      const tr = <HTMLTableRowElement>cloneOrigin.tr.cloneNode();

      const isBlacklisted = ACS.settings.blacklistedRecipes.includes(recipe.product.item);

      if (isBlacklisted) {
        tr.classList.add('blacklisted');
      }

      const productNameTD = createProductNameTD(recipe.product.item, recipe.product.name);

      const [materialTD, materialSum] = createMaterialTD(recipe);

      const productBuyoutTD = <HTMLTableCellElement>createProductBuyoutTD(recipe, TUJLink);

      const profitTD = <HTMLTableCellElement>createProfitTD(recipe.profit);

      const blackListTD = createBlackListTD(recipe.product.item, isBlacklisted);

      /*
      const percentageProfit = Math.round(recipe.product.buyout / materialSum) * 100 - 100;
      tippy(profitTD, { content: `${percentageProfit > 0 ? '' : '-'}${percentageProfit.toPrecision(2)}'%` });
      */

      [productNameTD, materialTD, productBuyoutTD, profitTD, blackListTD].forEach(td => tr.appendChild(td));

      if (recipe.profit > 0 || ACS.settings.alwaysShowLossyRecipes) {
        positiveTbody.appendChild(tr);
      } else {
        negativeTbody.appendChild(tr);
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

    const tableSectionElements = [<HTMLTableSectionElement>initiateTHead(), positiveTbody, negativeTbody];

    while (professionTable.firstChild) {
      professionTable.removeChild(professionTable.lastChild);
    }

    tableSectionElements.forEach(tbody => professionTable.appendChild(tbody));

    console.timeEnd(professionName);
  });

  toggleUserInputs(false);
  updateState('default');
  eval('$WowheadPower.init();');

  console.timeEnd('fillProfessionTables');
  console.timeEnd('search');
};

const toggleLossyRecipes = function () {
  const target = <HTMLTableSectionElement> this.parentElement.nextElementSibling;
  const innerTD = this.querySelector('td');

  const isVisible = target.style.display === 'table-row-group';

  if (isVisible) {
    target.style.display = 'none';
    innerTD.innerText = 'show lossy recipes';
  } else {
    target.style.display = 'table-row-group';
    innerTD.innerText = 'hide lossy recipes';
  }
};

const createLossyRecipeHintTR = () => {
  const hintTR = cloneOrigin.tr.cloneNode();
  hintTR.addEventListener('click', toggleLossyRecipes);

  const hintTD = <HTMLTableCellElement>cloneOrigin.td.cloneNode();
  hintTD.classList.add('lossy-recipes-hint');
  hintTD.colSpan = 5;
  hintTD.innerText = 'show lossy recipes';

  hintTR.appendChild(hintTD);
  return hintTR;
};

export const addEventListeners = () => {
  document.querySelectorAll('#professions input[type="checkbox"]').forEach((checkbox: HTMLInputElement) => checkbox.addEventListener('click', professionsEventListener));
  (<HTMLInputElement>document.getElementById('search')).addEventListener('click', searchListener);

  const expansionLevelSelect = <HTMLSelectElement>document.getElementById('expansion-level');
  expansionLevelSelect.addEventListener('change', () => expansionLevelListener(parseInt(expansionLevelSelect.value)));

  settingListener();
};

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

const insertLastUpdate = (lastUpdate: number) => {
  const date = new Date(lastUpdate);

  const target = document.getElementById('last-update');

  target.innerText = distanceInWordsStrict(new Date(), lastUpdate, { addSuffix: true });

  tippy('#last-update', { content: `${date.toLocaleDateString()} - ${date.toLocaleTimeString()}` });
};
