import { AuctionCraftSniper } from './types';
import { searchListener } from './eventChain';

export const ACS: AuctionCraftSniper.localStorageObj = {
  houseID: 0,
  professions: [],
  expansionLevel: 8,
  settings: {
    blacklistedRecipes: [],
    alwaysShowLossyRecipes: false,
    fetchOnLoad: false,
    pushNotificationsAllowed: false,
  },
};

/**
 *
 * @param {AuctionCraftSniper.localStorageObj} data
 */
export const setACSLocalStorage = (data: AuctionCraftSniper.localStorageObj) => {
  Object.entries(data).forEach(entry => {
    const [key, value] = entry;

    // prevent overwriting of settings via obj destructuring through setACSLocalStorage({ settings: payload })
    if (key === 'settings') {
      Object.entries(value).forEach(settingsEntry => {
        const [setting, settingsValue] = settingsEntry;

        ACS.settings[setting] = settingsValue;
      });
    } else {
      ACS[key] = value;
    }
  });

  localStorage.ACS = JSON.stringify(ACS);
};

export const getACSLocalStorage = () => {
  if (localStorage.ACS) {
    const tempACS: AuctionCraftSniper.localStorageObj = JSON.parse(localStorage.ACS);

    setACSLocalStorage(tempACS);

    const realm = <HTMLOptionElement>document.querySelector(`#realms [data-house-id="${tempACS.houseID}"]`);
    if (realm !== null) {
      (<HTMLInputElement>document.getElementById('realm')).value = realm.value;
    }

    ACS.professions.forEach(professionID => {
      const checkbox = <HTMLInputElement>document.querySelector(`input[type="checkbox"][value="${professionID}"]`);
      checkbox.checked = true;
      checkbox.previousElementSibling.classList.toggle('icon-disabled');
    });

    (<HTMLSelectElement>document.getElementById('expansion-level')).selectedIndex = ACS.expansionLevel;

    setSettingCheckboxes();

    if (ACS.settings.fetchOnLoad) {
      searchListener();
    }
  }
};

const setSettingCheckboxes = () => {
  Object.entries(ACS.settings).forEach(entry => {
    const [settingName, value] = entry;

    if (typeof value !== 'object') {
      (<HTMLInputElement>document.getElementById(settingName)).checked = value;
    }
  });
};
