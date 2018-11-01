import * as Raven from 'raven-js';

interface parseAuctionDataPayload {
  recipeIDs?: object;
  step?: number;
    houseID: number;
  expansionLevel: number;
}

interface parseAuctionDataResponseJSON {
  recipeIDs: number[];
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

// Raven.config('https://ca22106a81d147b586d31169dddfbfe4@sentry.io/1232788').install();

const getProfessionTables = () => {
  updateState('getProfessionTables');
  toggleUserInputs(false);
  updateState('default');
};

const parseAuctionData = async (step = 0, recipeIDs = {}) => {
  const payload: parseAuctionDataPayload = {
      houseID: ACS.houseID,
    recipeIDs,
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
    parseAuctionData(json.step, json.recipeIDs);
  } else if (json.reqSteps === json.step && json.callback === 'getProfessionTables') {
    document.getElementById('result').innerText = JSON.stringify(json.recipeIDs);
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
    toggleUserInputs(true);
    validateRegionRealm(value);
  }
};

const checkHouseAge = async () => {
    const {houseID, expansionLevel} = ACS;

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
            setACSLocalStorage({houseID: json.houseID});
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
