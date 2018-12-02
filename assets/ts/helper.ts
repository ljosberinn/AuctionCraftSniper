import { AuctionCraftSniper } from './types';

export const initiateCloneObj = (): AuctionCraftSniper.cloneOriginObj => {
  const obj: AuctionCraftSniper.cloneOriginObj = {
    currencies: {},
  };

  ['table', 'thead', 'tbody', 'tr', 'th', 'td', 'a', 'div', 'button'].forEach(tag => (obj[tag] = document.createElement(tag)));

  ['gold', 'silver', 'copper'].forEach(currency => {
    const span = document.createElement('span');
    span.classList.add('currency', currency);

    obj.currencies[currency] = span;
  });

  return obj;
};

export const cloneOrigin = initiateCloneObj();

const createStateNotification = (notificationType: string, notificationContent: string) => {
  const notification = <HTMLDivElement>cloneOrigin.div.cloneNode();
  notification.classList.add('notification', notificationType);

  const button = <HTMLButtonElement>cloneOrigin.button.cloneNode();
  button.type = 'button';
  button.classList.add('delete');

  button.addEventListener('click', function () {
    this.parentElement.remove();
  });

  notification.innerText = notificationContent;
  notification.prepend(button);

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, 3000);
};

export const updateState = (state: string) => {
  switch (state) {
    case 'parseAuctionData':
      createStateNotification('is-primary', 'parsing data');
      break;
    case 'getProfessionTables':
      createStateNotification('is-primary', 'fetching results');
      break;
    case 'getAuctionHouseData':
      createStateNotification('is-primary', 'retrieving data from Blizzard');
      break;
    case 'checkHouseAge':
      createStateNotification('is-primary', 'validating data age');
      break;
    default:
      createStateNotification('is-primary', 'idling');
      break;
  }
};

export const sortByProfit = (innerProfessionData: AuctionCraftSniper.innerProfessionDataJSON[]) => innerProfessionData.sort((objA, objB) => objB.profit - objA.profit);

export const getTUJBaseURL = () => {
  const [region, realm] = (<HTMLInputElement>document.getElementById('realm')).value.split('-');

  return `https://theunderminejournal.com/#${region}/${realm}/item/`;
};

export const getWoWheadURL = (itemID: number) => `https://wowhead.com/?item=${itemID}`;
