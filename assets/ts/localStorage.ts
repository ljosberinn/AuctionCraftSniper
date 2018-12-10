import { AuctionCraftSniper } from './types';
import { searchListener, getProfessionTables, hideIntroduction } from './eventChain';

export const ACS: AuctionCraftSniper.localStorageObj = {
  houseID: 0,
  professions: [],
  expansionLevel: 8,
  lastUpdate: 0,
  houseUpdateInterval: 3300000, // 55 as default value
  currentTab: undefined,
  settings: {
    blacklistedRecipes: [],
    alwaysShowLossyRecipes: false,
    fetchOnLoad: false,
    pushNotificationsAllowed: false,
    hideBlacklistedRecipes: false,
  },
};

/**
 *
 * @param {AuctionCraftSniper.localStorageObj} data
 */
export const setACSLocalStorage = (data: AuctionCraftSniper.localStorageObj): void => {
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

export const getACSLocalStorage = (): void => {
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
      // circumvent API potentially not answering although most recent data is up to date anyways
      if (new Date().getTime() + ACS.houseUpdateInterval > ACS.lastUpdate + ACS.houseUpdateInterval) {
        hideIntroduction();
        getProfessionTables(true);
        return;
      }

      searchListener();
    }
  }
};

const setSettingCheckboxes = (): void => {
  Object.entries(ACS.settings).forEach(entry => {
    const [settingName, value] = entry;

    if (typeof value !== 'object') {
      (<HTMLInputElement>document.getElementById(settingName)).checked = value;
    }
  });
};
