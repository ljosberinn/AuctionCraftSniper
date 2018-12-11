import { AuctionCraftSniper } from './types';
import { ACS } from './localStorage';

const HINT_VISIBLE_DURATION = 3500; // 3 * 1000;

/**
 * @returns {AuctionCraftSniper.cloneOriginObj}
 */
export const initiateCloneObj = (): AuctionCraftSniper.cloneOriginObj => {
  const obj: AuctionCraftSniper.cloneOriginObj = {
    currencies: {},
  };

  ['table', 'thead', 'tbody', 'tr', 'th', 'td', 'a', 'div', 'button', 'strong'].forEach(tag => (obj[tag] = document.createElement(tag)));
  obj.a.rel = 'noreferrer';
  obj.a.target = '_blank';

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
 * @param {string} state
 */
export const updateState = (state: string): void => {
  document.getElementById('progress-bar').dataset.state = state;
};

/**
 *
 * @param {AuctionCraftSniper.innerProfessionDataJSON[]} innerProfessionData
 * @returns {AuctionCraftSniper.innerProfessionDataJSON[]} innerProfessionData
 */
export const sortByProfit = (innerProfessionData: AuctionCraftSniper.innerProfessionDataJSON[]) => innerProfessionData.sort((objA, objB) => objB.profit - objA.profit);

/**
 * @returns {string}
 */
export const getTUJBaseURL = (): string => {
  const [region, realm] = (<HTMLInputElement>document.getElementById('realm')).value.split('-');

  return `https://theunderminejournal.com/#${region}/${realm}/item/`;
};

/**
 *
 * @param {number} itemID
 * @returns {string}
 */
export const getWoWheadURL = (itemID: number): string => `https://wowhead.com/?item=${itemID}`;

export const toggleSearchLoadingState = () => {
  document.getElementById('search').classList.toggle('is-loading');
  toggleProgressBar();
};

export const showHint = (hintType: string): void => {
  const target = document.getElementById(`hint-invalid-${hintType}`);

  const classList = target.classList;

  classList.add('visible');

  setTimeout(() => {
    classList.remove('visible');
  }, HINT_VISIBLE_DURATION);
};

/**
 *
 * @param {string} notificationType
 * @param {string} notificationContent
 */
const createNotification = (notificationType: string, notificationContent: string): void => {
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
  }, HINT_VISIBLE_DURATION);
};

/**
 *
 * @param {any} valueToCopy
 */
export const copyOnClick = (valueToCopy: any): void => {
  const input = document.createElement('input');
  input.value = valueToCopy;

  document.body.appendChild(input);
  input.select();
  document.execCommand('copy');

  input.remove();

  createNotification('is-primary', 'copied TSM string');
};

const removeLocalStorageTextarea = (): void => {
  document.getElementById('localStorage-textarea').remove();

  const triggerElement = document.getElementById('showLocalStorage');
  triggerElement.removeEventListener('click', removeLocalStorageTextarea);
  triggerElement.addEventListener('click', showLocalStorage);
};

export const showLocalStorage = (): void => {
  const triggerElement = document.getElementById('showLocalStorage');
  triggerElement.removeEventListener('click', showLocalStorage);

  const textarea = document.createElement('textarea');
  textarea.classList.add('textarea');
  textarea.rows = 10;
  textarea.id = 'localStorage-textarea';
  // sentry #802697179
  textarea.innerHTML = localStorage.ACS ? JSON.stringify(JSON.parse(localStorage.ACS), null, 2).replace(/<br\s*[\/]?>/gi, '\n') : 'no data stored yet!';

  triggerElement.insertAdjacentElement('afterend', textarea);

  triggerElement.addEventListener('click', removeLocalStorageTextarea);
};

export const clearLocalStorage = (): void => {
  localStorage.clear();
  createNotification('is-info', 'All your data has been removed.');
};

/**
 *
 * @param {boolean} show
 */
export const toggleProgressBar = (show: boolean = true): void => {
  const progressBar = <HTMLProgressElement>document.getElementById('progress-bar');

  if (show) {
    progressBar.parentElement.classList.add('visible');
  } else {
    progressBar.removeAttribute('value');
    progressBar.parentElement.classList.remove('visible');
  }
};

/**
 *
 * @param {bool} state
 */
export const toggleUserInputs = (state: boolean = true): void => {
  document.querySelectorAll('input').forEach(input => (input.disabled = state));
  [<HTMLInputElement>document.getElementById('search'), <HTMLSelectElement>document.getElementById('expansion-level')].forEach(el => (el.disabled = state));
};
