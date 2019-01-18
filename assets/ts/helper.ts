import { ACS } from './localStorage';
import { AuctionCraftSniper } from './types';

const HINT_VISIBLE_DURATION = 3500; // 3.5 * 1000;

export const initiateCloneObj = (): AuctionCraftSniper.CloneOriginObjInterface => {
  const obj: AuctionCraftSniper.CloneOriginObjInterface = {
    currencies: {}
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

export const currencyContainer: AuctionCraftSniper.CurrencyContainerInterface = {
  gold: 0,
  silver: 0,
  copper: 0
};

export const updateState = (state: string): void => {
  document.getElementById('progress-bar').dataset.state = state;
};

export const sortByProfit = (innerProfessionData: AuctionCraftSniper.InnerProfessionDataJSONInterface[]) => innerProfessionData.sort((objA, objB) => objB.profit - objA.profit);

export const getTUJBaseURL = (): string => {
  const [region, realm] = (document.getElementById('realm') as HTMLInputElement).value.split('-');

  return `https://theunderminejournal.com/#${region.toLowerCase()}/${realm
    .split(' ')
    .join('-')
    .toLowerCase()}/item/`;
};

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

const createNotification = (notificationType: string, notificationContent: string): void => {
  const notification = cloneOrigin.div.cloneNode() as HTMLDivElement;
  notification.classList.add('notification', notificationType);

  const button = cloneOrigin.button.cloneNode() as HTMLButtonElement;
  button.type = 'button';
  button.classList.add('delete');

  button.addEventListener('click', function() {
    this.parentElement.remove();
  });

  notification.innerText = notificationContent;
  notification.prepend(button);

  document.body.appendChild(notification);

  if (ACS.settings.pushNotificationsAllowed) {
    // new Notification(notificationContent);
  }

  setTimeout(() => {
    notification.remove();
  }, HINT_VISIBLE_DURATION);
};

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

export const toggleProgressBar = (): void => {
  const progressBar = document.getElementById('progress-bar') as HTMLProgressElement;

  progressBar.removeAttribute('value');
  progressBar.classList.toggle('visible');
};

export const toggleUserInputs = (state: boolean = true): void => {
  document.querySelectorAll('input').forEach(input => (input.disabled = state));
  [document.getElementById('search') as HTMLInputElement, document.getElementById('expansion-level') as HTMLSelectElement].forEach(el => (el.disabled = state));
};
