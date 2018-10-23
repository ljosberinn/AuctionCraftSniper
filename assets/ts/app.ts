import * as Raven from 'raven-js';

Raven.config('https://ca22106a81d147b586d31169dddfbfe4@sentry.io/1232788').install();

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

const realmInputEventListener = () => {
  let searchTimeout;
  (<HTMLInputElement>document.getElementById('realm')).addEventListener('input', function () {
    const value = this.value.split('-');

    if (value.length === 2) {
      if (searchTimeout !== undefined) {
        clearTimeout(searchTimeout);
      }

      searchTimeout = setTimeout(() => {
        validateRegionRealm(value);
      }, 350);
    }
  });
};

const getProfessionTables = async () => {
  const { house, professions } = ACS;
  if (professions.length > 0 && house !== undefined) {
    const data = await fetch(`api/professionTables.php?house=${house}&professions=${professions}`);
    const json = await data.json();

    console.log(json);
  } else {
    console.warn(`Insufficient params - professions: ${professions.length} | house: ${house}`);
  }
};

const validateRegionRealm = async (value: string[]) => {
  const region: string = value[0];
  const realm: string = value[1];

  await fetch(`api/validateRegionRealm.php?region=${region}&realm=${realm}`)
    .then(response => response.json())
    .then(json => {
      // only proceed when input is valid REGION-REALM pair and server responded with house ID
      if (json.house) {
        setACSLocalStorage({ house: json.house });
        getProfessionTables();
      }
    })
    .catch(err => {
      console.error(`Error validating region and/or realm: ${err}`);
    });
};

const addEventListeners = () => {
  [...document.querySelectorAll('input[type="checkbox"]')].forEach((checkbox: HTMLInputElement) => checkbox.addEventListener('click', checkboxEventListener));
  realmInputEventListener();
};

Raven.context(() => {
  document.onreadystatechange = () => {
    if (document.readyState === 'complete') {
      console.warn("Stop! This is a browser functionality for developers. If anyone tells you top copy and paste anything in here, it's very likely to be a scam.");
      addEventListeners();
      getACSLocalStorage();
    }
  };
});
