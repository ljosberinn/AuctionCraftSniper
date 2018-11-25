import { AuctionCraftSniper } from './types';

export const ACS: AuctionCraftSniper.localStorageObj = {
  houseID: undefined,
  professions: [],
  expansionLevel: 8,
  blacklist: [],
};

export const setACSLocalStorage = (data: AuctionCraftSniper.localStorageObj) => {
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

export  const getACSLocalStorage = () => {
  if (localStorage.ACS) {
    const tempACS: AuctionCraftSniper.localStorageObj = JSON.parse(localStorage.ACS);

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
