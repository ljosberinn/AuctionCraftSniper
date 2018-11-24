import * as Raven from 'raven-js';

interface parseAuctionDataPayload {
  itemIDs?: object;
  step?: number;
  houseID: number;
  expansionLevel: number;
}

interface parseAuctionDataResponseJSON {
  itemIDs: number[];
  percentDone: number;
  reqSteps: number;
  step: number;

  err?: string;
  callback?: string;
}

interface ACSLocalStorageObj {
  houseID?: undefined | number;
  professions?: number[];
  expansionLevel?: number;
}

interface materialJSON {
  baseBuyPrice: number;
  buyout: number;
  itemName: string;
  rank: number;
  requiredAmount: number;
  requiredItemID: number;
}

interface productJSON {
  buyout: number;
  item: number;
  itemName: string;
}

interface innerProfessionDataJSON {
  materials: materialJSON[];
  product: productJSON;
  profit: number;
}

interface outerProfessionDataJSON {
  Alchemy?: innerProfessionDataJSON[];
  Blacksmithing?: innerProfessionDataJSON[];
  Cooking?: innerProfessionDataJSON[];
  Enchanting?: innerProfessionDataJSON[];
  Engineering?: innerProfessionDataJSON[];
  Inscription?: innerProfessionDataJSON[];
  Jewelcrafting?: innerProfessionDataJSON[];
  Leatherworking?: innerProfessionDataJSON[];
  Tailoring?: innerProfessionDataJSON[];
}

const updateState = (state: string) => {
  let stateDescription: string;

  switch (state) {
    case 'parseAuctionData':
      stateDescription = 'parsing data';
      break;
    case 'getProfessionTables':
      stateDescription = 'fetching results';
      break;
    case 'getAuctionHouseData':
      stateDescription = 'retrieving data from Blizzard';
      break;
    case 'checkHouseAge':
      stateDescription = 'validating data age';
      break;
    default:
      stateDescription = 'idling';
      break;
  }

  document.getElementById('progress-state').innerText = stateDescription;
};

const toggleUserInputs = (state: boolean) => {
  Array.from(document.querySelectorAll('input')).forEach(input => (input.type === 'checkbox' ? (input.disabled = state) : (input.readOnly = state)));
  [<HTMLInputElement>document.getElementById('search'), <HTMLSelectElement>document.getElementById('expansion-level')].forEach(el => (el.disabled = state));
};

const ACS: ACSLocalStorageObj = {
  houseID: undefined,
  professions: [],
  expansionLevel: 8,
};

const setACSLocalStorage = (data: ACSLocalStorageObj) => {
  if (data.houseID) {
    ACS.houseID = data.houseID;
  }

  if (data.professions) {
    ACS.professions = data.professions;
  }

  if (data.expansionLevel) {
    ACS.expansionLevel = data.expansionLevel;
  }

  localStorage.ACS = JSON.stringify(ACS);
};

const getACSLocalStorage = () => {
  if (localStorage.ACS) {
    const tempACS: ACSLocalStorageObj = JSON.parse(localStorage.ACS);

    ACS.houseID = tempACS.houseID;
    ACS.professions = tempACS.professions;
    ACS.expansionLevel = tempACS.expansionLevel;

    ACS.professions.forEach(professionID => {
      const checkbox = <HTMLInputElement>document.querySelector(`input[type="checkbox"][value="${professionID}"]`);
      checkbox.checked = true;
      checkbox.previousElementSibling.classList.toggle('icon-disabled');
    });

    (<HTMLSelectElement>document.getElementById('expansion-level')).selectedIndex = ACS.expansionLevel;
  }
};

const formatCurrency = value => {
  const minus = value < 0 ? '-' : '';

  if (minus === '-') {
    value *= -1;
  }

  if (value < 100) {
    return `${minus}${value}<i class="currency-copper"></i>`;
  }

  if (value < 10000) {
    const silver = Math.floor(value / 100);
    const copper = value - silver * 100;
    return `${minus}${silver}<i class="currency-silver"></i> ${copper}<i class="currency-copper"></i>`;
  }

  const gold = Math.floor(value / 100 / 100);
  const silver = Math.floor((value - gold * 100 * 100) / 100);
  const copper = Math.floor(value - gold * 100 * 100 - silver * 100);

  return `${minus}${gold}<i class="currency-gold"></i> ${silver}<i class="currency-silver"></i> ${copper}<i class="currency-copper"></i>`;
};

const sortByProfit = (innerProfessionData: innerProfessionDataJSON[]) => innerProfessionData.sort((objA, objB) => objB.profit - objA.profit);

const getTUJBaseURL = () => {
  const [region, realm] = (<HTMLInputElement>document.getElementById('realm')).value.split('-');

  return `https://theunderminejournal.com/#${region}/${realm}/item/`;
};

const getWoWheadURL = itemID => `https://wowhead.com/?item=${itemID}`;

const createProfessionTables = (json: outerProfessionDataJSON = {}) => {
  console.time('createProfessionTables');
  const wrap = <HTMLDivElement>document.getElementById('auction-craft-sniper');

  const TUJLink = getTUJBaseURL();

  /* while (wrap.lastChild) {
      wrap.removeChild(wrap.lastChild);
    } */

  const thTexts = ['itemName', 'materialInfo', 'productBuyout', 'profit'];

  const fragment = document.createDocumentFragment();

  Object.entries(json).forEach(entry => {
    let professionName: string;
    let recipes: innerProfessionDataJSON[];
    [professionName, recipes] = entry;
    console.time(professionName);

    const table = document.createElement('table');
    const thead = document.createElement('thead');
    const theadRow = document.createElement('tr');

    thTexts.forEach(thText => {
      const th = document.createElement('th');
      th.innerText = thText;
      theadRow.appendChild(th);
    });
    thead.appendChild(theadRow);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');

    sortByProfit(recipes).forEach(recipe => {
      const tr = document.createElement('tr');
      tr.dataset.recipe = recipe.product.item.toString();

      const productNameTD = document.createElement('td');
      productNameTD.innerHTML = `<a href="${getWoWheadURL(recipe.product.item)}">${recipe.product.itemName}</a>`;

      const materialInfoTD = document.createElement('td');
      let materialSum = 0;
      materialInfoTD.dataset.dataTippy = '';

      recipe.materials.forEach(material => {
        materialInfoTD.dataset.dataTippy += `<a href="${getWoWheadURL(material.requiredItemID)}">${material.itemName}</a>`;
        materialSum += material.buyout * material.requiredAmount;
      });
      materialInfoTD.innerHTML = formatCurrency(materialSum);

      const productBuyoutTD = document.createElement('td');
      productBuyoutTD.innerHTML = `
      <a class="tuj" target="_blank" href="${TUJLink}${recipe.product.item}" data-tippy-content="The Undermine Journal - ${recipe.product.itemName}"></a>
      ${formatCurrency(recipe.product.buyout)}`;

      const profitTD = document.createElement('td');
      profitTD.innerHTML = formatCurrency(recipe.profit);

      const tds = [productNameTD, materialInfoTD, productBuyoutTD, profitTD];

      const previousTR = document.querySelector(`[data-recipe="${recipe.product.item}"]`);

      if (previousTR !== null) {
        while (previousTR.lastChild) {
          previousTR.removeChild(previousTR.lastChild);
        }
        tds.forEach(td => previousTR.appendChild(td));
      } else {
        tds.forEach(td => tr.appendChild(td));
        tbody.appendChild(tr);
      }
    });

    table.appendChild(tbody);
    fragment.appendChild(table);
    console.timeEnd(professionName);
  });

  wrap.appendChild(fragment);

  toggleUserInputs(false);
  updateState('default');
  eval('tippy("a");');
  console.timeEnd('createProfessionTables');
  console.timeEnd('search');
};

const getProfessionTables = async () => {
  updateState('getProfessionTables');

  const { houseID, expansionLevel, professions } = ACS;

  const data = await fetch(`api/getProfessionTables.php?houseID=${houseID}&expansionLevel=${expansionLevel}&professions=${professions.toString()}`, {
    method: 'GET',
    credentials: 'same-origin',
    mode: 'same-origin',
  });

  const json: outerProfessionDataJSON = await data.json();

  createProfessionTables(json);
};

const parseAuctionData = async (step = 0, itemIDs = {}) => {
  const payload: parseAuctionDataPayload = {
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

  const json: parseAuctionDataResponseJSON = await data.json();

  if (json.err) {
    throw new Error(json.err);
  } else {
    document.getElementById('progress-bar').style.width = `${json.percentDone}%`;
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

const checkboxEventListener = function (e) {
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

const expansionLevelListener = expansionLevel => setACSLocalStorage({ expansionLevel });

const addEventListeners = () => {
  Array.from(document.querySelectorAll('input[type="checkbox"]')).forEach((checkbox: HTMLInputElement) => checkbox.addEventListener('click', checkboxEventListener));
  (<HTMLInputElement>document.getElementById('search')).addEventListener('click', searchListener);

  const expansionLevelSelect = <HTMLSelectElement>document.getElementById('expansion-level');
  expansionLevelSelect.addEventListener('change', () => expansionLevelListener(parseInt(expansionLevelSelect.value)));
};

const searchListener = () => {
  const value = (<HTMLInputElement>document.getElementById('realm')).value.split('-');

  if (value.length === 2) {
    console.time('search');
    toggleUserInputs(true);
    validateRegionRealm(value);
  }
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

    const json = await data.json();

    switch (json.callback) {
      case 'houseRequiresUpdate':
        getAuctionHouseData();
        break;
      case 'getProfessionTables':
        getProfessionTables();
        break;
      default:
        throw new Error('invalid callback');
    }
  } else {
    console.warn(`Insufficient params - professions: house: ${houseID}`);
  }
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

// Raven.config('https://a14f918eaf6544eea696ad35340f68a5@sentry.io/1329859').install();

// Raven.context(() => {
document.onreadystatechange = () => {
  if (document.readyState === 'complete') {
    console.warn("Stop! This is a browser functionality for developers. If anyone tells you top copy and paste anything in here, it's very likely to be a scam.");
    addEventListeners();
    getACSLocalStorage();
  }
};
// });
