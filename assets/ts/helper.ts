import { AuctionCraftSniper } from './types';
import { ACS } from './localStorage';

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

/**
 *
 * @param state
 */
export const updateState = (state: string) => {
  switch (state) {
    case 'parseAuctionData':
      createNotification('is-primary', 'parsing data');
      break;
    case 'getProfessionTables':
      createNotification('is-primary', 'fetching results');
      break;
    case 'getAuctionHouseData':
      createNotification('is-primary', 'retrieving data from Blizzard');
      break;
    case 'checkHouseAge':
      createNotification('is-primary', 'validating data age');
      break;
    default:
      createNotification('is-primary', 'idling');
      break;
  }
};

/**
 *
 * @param {AuctionCraftSniper.innerProfessionDataJSON[]} innerProfessionData
 */
export const sortByProfit = (innerProfessionData: AuctionCraftSniper.innerProfessionDataJSON[]) => innerProfessionData.sort((objA, objB) => objB.profit - objA.profit);

export const getTUJBaseURL = (): string => {
  const [region, realm] = (<HTMLInputElement>document.getElementById('realm')).value.split('-');

  return `https://theunderminejournal.com/#${region}/${realm}/item/`;
};

/**
 *
 * @param {number} itemID
 */
export const getWoWheadURL = (itemID: number): string => `https://wowhead.com/?item=${itemID}`;

/**
 *
 * @param {number} buyout
 * @param {number} cost
 */
export const calculateRecipeProfit = (buyout: number, cost: number) => ((buyout / cost - 1) * 100).toFixed(2);

export const toggleSearchLoadingState = () => {
  document.getElementById('search').classList.toggle('is-loading');
};

export const showInvalidRegionRealmPairHint = () => {
  const target = document.getElementById('hint-invalid-region-realm');
  const display = target.style.display;

  if (display !== 'block') {
    target.style.display = 'block';

    setTimeout(() => {
      target.style.display = 'none';
    }, 3500);
  }
};

/**
 *
 * @param {string} notificationType
 * @param {string} notificationContent
 */
const createNotification = (notificationType: string, notificationContent: string) => {
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

  if (ACS.settings.pushNotificationsAllowed) {
    new Notification(notificationContent);
  }

  setTimeout(() => {
    notification.remove();
  }, 3000);
};

/**
 *
 * @param {any} valueToCopy
 */
export const copyOnClick = (valueToCopy: any) => {
  const input = document.createElement('input');
  input.value = valueToCopy;

  document.body.appendChild(input);
  input.select();
  document.execCommand('copy');

  input.remove();

  createNotification('is-primary', 'copied TSM string');
};
