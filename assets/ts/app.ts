import * as Raven from 'raven-js';

// Raven.config('https://ca22106a81d147b586d31169dddfbfe4@sentry.io/1232788').install();

const ACS: ACSLocalStorageObj = {
  house: undefined,
  professions: [],
};

const setACSLocalStorage = (data: ACSLocalStorageObj) => {
  if (data.house) {
    ACS.house = data.house;
  }

  if (data.professions) {
    ACS.professions = data.professions;
  }

  if (typeof ACS.house !== 'undefined' && ACS.professions.length > 0) {
    localStorage.ACS = JSON.stringify(ACS);
  }
};

const getACSLocalStorage = () => {
  if (localStorage.ACS) {
    const tempACS: ACSLocalStorageObj = JSON.parse(localStorage.ACS);

    ACS.house = tempACS.house;
    ACS.professions = tempACS.professions;
  }
};

const checkboxEventListener = function (e) {
  e.stopPropagation();

  const { value, checked } = this;
  const index = ACS.professions.indexOf(value);

  if (checked && index === -1) {
    ACS.professions.push(value);
  } else {
    ACS.professions.splice(index, 1);
  }

  getProfessionTables();
};

const getProfessionTables = () => {
  updateState('getProfessionTables');
  toggleUserInputs(false);
};

const toggleUserInputs = (state: boolean) => {
  Array.from(document.querySelectorAll('input')).forEach(input => (input.type === 'checkbox' ? (input.disabled = state) : (input.readOnly = state)));
  (<HTMLInputElement>document.getElementById('search')).disabled = state;
};

const realmInputEventListener = () => {
  (<HTMLInputElement>document.getElementById('search')).addEventListener('click', () => {
    const value = (<HTMLInputElement>document.getElementById('realm')).value.split('-');

    if (value.length === 2) {
      toggleUserInputs(true);

      validateRegionRealm(value);
    }
  });
};

interface parseAuctionDataPayload {
  itemIDs?: object;
  step?: number;
  auctionValues?: object;
  house: number;
}

interface parseAuctionDataResponseJSON {
  auctionValues: object;
  itemIDs: number[];
  percentDone: number;
  reqSteps: number;
  step: number;

  err?: string;
  callback?: string;
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

const parseAuctionData = async (step = 0, auctionValues = {}, itemIDs = {}) => {
  const payload: parseAuctionDataPayload = {
    house: ACS.house,
    itemIDs,
    auctionValues,
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
    parseAuctionData(json.step, json.auctionValues, json.itemIDs);
  } else if (json.reqSteps === json.step && json.callback === 'getProfessionTables') {
    document.getElementById('result').innerText = JSON.stringify(json.auctionValues);
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
      break;
  }
};

const checkHouseAge = async () => {
  const { house } = ACS;

  if (house !== undefined) {
    updateState('checkHouseAge');

    const data = await fetch(`api/checkHouseAge.php?house=${house}`);
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

const addEventListeners = () => {
  Array.from(document.querySelectorAll('input[type="checkbox"]')).forEach((checkbox: HTMLInputElement) => checkbox.addEventListener('click', checkboxEventListener));
  realmInputEventListener();
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

interface ObjectConstructor {
  assign(target: any, ...sources: any[]): Object;
}

interface ACSLocalStorageObj {
  house?: undefined | number;
  professions?: number[];
}
