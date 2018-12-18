import { AuctionCraftSniper } from './types';
import { searchListener, getProfessionTables, hideIntroduction } from './eventChain';
import { showHint, toggleUserInputs, toggleSearchLoadingState } from './helper';

/**
 *
 * @param {string} type
 */
const storageAvailable = (type: string): boolean => {
  // https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API/Using_the_Web_Storage_API#Testing_for_availability
  try {
    var storage = window[type];

    const x = '__storage_test__';
    storage.setItem(x, x);
    storage.removeItem(x);
    return true;
  } catch (err) {
    return (
      err instanceof DOMException
      // everything except Firefox
      && (err.code === 22
        // Firefox
        || err.code === 1014
        // test name field too, because code might not be present
        // everything except Firefox
        || err.name === 'QuotaExceededError'
        // Firefox
        || err.name === 'NS_ERROR_DOM_QUOTA_REACHED')
      // acknowledge QuotaExceededError only if there's something already stored
      && storage.length !== 0
    );
  }
};

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
    alwaysShowUnlistedRecipes: false,
    fetchOnLoad: false,
    pushNotificationsAllowed: false,
    hideBlacklistedRecipes: false,
  },
  hasLocalStorage: storageAvailable('localStorage'),
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

  if (ACS.hasLocalStorage) {
    // sentry #812161570
    try {
      localStorage.ACS = JSON.stringify(ACS);
    } catch (err) {
      if (err.name === 'NS_ERROR_FILE_CORRUPTED') {
        try {
          localStorage.clear();
          localStorage.ACS = JSON.stringify(ACS);
        } catch (err2) {
          if (err2.name === 'NS_ERROR_FILE_CORRUPTED') {
            alert(
              'Sorry, it looks like your browser storage has been corrupted. Please clear your storage by going to Settings -> Privacy & Security -> section Cookies -> remove all cookies & restart your browser. This will remove the corrupted browser storage across all sites. Then try again.',
            );
          }
        }
      }
    }
  }
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
      if (ACS.professions.length === 0) {
        showHint('professions');
        return;
      }
      // circumvent API potentially not answering although most recent data is up to date anyways
      if (new Date().getTime() + ACS.houseUpdateInterval > ACS.lastUpdate + ACS.houseUpdateInterval) {
        hideIntroduction();
        toggleUserInputs(false);
        toggleSearchLoadingState();
        getProfessionTables({ triggeredByRefresher: true, retry: 0 });
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
      const checkbox = <HTMLInputElement>document.getElementById(settingName);

      if (checkbox !== null) {
        checkbox.checked = value;
      } else {
        console.warn(`invalid settingName: ${settingName}`);
      }
    }
  });
};
