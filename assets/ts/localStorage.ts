import { AuctionCraftSniper } from './types';
import { searchListener } from './eventChain';

export const ACS: AuctionCraftSniper.localStorageObj = {
  houseID: undefined,
  professions: [],
  expansionLevel: 8,
  settings: {
    blacklistedRecipes: [],
    alwaysShowLossyRecipes: false,
    fetchOnLoad: false,
  },
};

export const setACSLocalStorage = (data: AuctionCraftSniper.localStorageObj) => {
  Object.entries(data).forEach(entry => {
    const [key, value] = entry;
    ACS[key] = value;
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

    if (ACS.settings.fetchOnLoad) {
      searchListener();
    }
  }
};
