import * as Raven from 'raven-js';

interface parseAuctionDataPayload {
  itemIDs?: object;
  step?: number;
  house: number;
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
  house?: undefined | number;
  professions?: number[];
  expansionLevel?: number;
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
  house: undefined,
  professions: [],
  expansionLevel: 8,
};

const setACSLocalStorage = (data: ACSLocalStorageObj) => {
  if (data.house) {
    ACS.house = data.house;
  }

  if (data.professions) {
    ACS.professions = data.professions;
  }

  if (data.expansionLevel) {
    ACS.expansionLevel = data.expansionLevel;
  }

  if (typeof ACS.house !== 'undefined' && ACS.professions.length > 0 && typeof ACS.expansionLevel === 'number') {
    localStorage.ACS = JSON.stringify(ACS);
  }
};

const getACSLocalStorage = () => {
  if (localStorage.ACS) {
    const tempACS: ACSLocalStorageObj = JSON.parse(localStorage.ACS);

    ACS.house = tempACS.house;
    ACS.professions = tempACS.professions;
    ACS.expansionLevel = tempACS.expansionLevel;
  }
};

// Raven.config('https://ca22106a81d147b586d31169dddfbfe4@sentry.io/1232788').install();

const getProfessionTables = () => {
  updateState('getProfessionTables');
  toggleUserInputs(false);
  updateState('default');
};

const parseAuctionData = async (step = 0, itemIDs = {}) => {
  const payload: parseAuctionDataPayload = {
    house: ACS.house,
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
    document.getElementById('result').innerText = JSON.stringify(json.itemIDs);
    getProfessionTables();
  }
};

const getAuctionHouseData = async () => {
  updateState('getAuctionHouseData');

  const data = await fetch(`api/getAuctionHouseData.php?house=${ACS.house}`);
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

  const { value, checked } = this;
  const index = ACS.professions.indexOf(value);

  if (checked && index === -1) {
    ACS.professions.push(parseInt(value));
  } else {
    ACS.professions.splice(index, 1);
  }
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
    toggleUserInputs(true);
    validateRegionRealm(value);
  }
};

const checkHouseAge = async () => {
  const { house, expansionLevel } = ACS;

  if (house !== undefined) {
    updateState('checkHouseAge');

    const data = await fetch(`api/checkHouseAge.php?house=${house}&expansionLevel=${expansionLevel}`);
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
    console.warn(`Insufficient params - professions: house: ${house}`);
  }
};

const validateRegionRealm = async (value: string[]) => {
  const region: string = value[0];
  const realm: string = value[1];

  updateState('validateRegionRealm');

  await fetch(`api/validateRegionRealm.php?region=${region}&realm=${realm}`)
    .then(response => response.json())
    .then(json => {
      // only proceed when input is valid REGION-REALM pair and server responded with house ID
      if (json.house) {
        setACSLocalStorage({ house: json.house });
        checkHouseAge();
      }
    })
    .catch(err => {
      console.error(`Error validating region and/or realm: ${err}`);
    });
};

// Raven.context(() => {
document.onreadystatechange = () => {
  if (document.readyState === 'complete') {
    console.warn("Stop! This is a browser functionality for developers. If anyone tells you top copy and paste anything in here, it's very likely to be a scam.");
    addEventListeners();
    getACSLocalStorage();
  }
};
// });
