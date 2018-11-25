import { AuctionCraftSniper } from './types';

export const initiateCloneObj = (): AuctionCraftSniper.cloneOriginObj => {
  const obj: AuctionCraftSniper.cloneOriginObj = {
    currencies: {},
  };

  ['table', 'thead', 'tbody', 'tr', 'th', 'td', 'a'].forEach(tag => (obj[tag] = document.createElement(tag)));

  ['gold', 'silver', 'copper'].forEach(currency => {
    const span = document.createElement('span');
    span.classList.add('currency', currency);

    obj.currencies[currency] = span;
  });

  return obj;
};

export const cloneOrigin = initiateCloneObj();

export const updateState = (state: string) => {
  let stateDescription: string;

  switch (state) {
    case 'parseAuctionData':
      stateDescription = 'parsing data';
      break;
    case 'getProfessionTables':
      stateDescription = 'fetching results';
      break;
    case 'getAuctionHouseData':
      stateDescription = 'retrieving data from Blizzard';
      break;
    case 'checkHouseAge':
      stateDescription = 'validating data age';
      break;
    default:
      stateDescription = 'idling';
      break;
  }

  document.getElementById('progress-state').innerText = stateDescription;
};

export const sortByProfit = (innerProfessionData: AuctionCraftSniper.innerProfessionDataJSON[]) => innerProfessionData.sort((objA, objB) => objB.profit - objA.profit);

export const getTUJBaseURL = () => {
  const [region, realm] = (<HTMLInputElement>document.getElementById('realm')).value.split('-');

  return `https://theunderminejournal.com/#${region}/${realm}/item/`;
};

export const getWoWheadURL = (itemID: number) => `https://wowhead.com/?item=${itemID}`;

const initiateMaterialInfoTippyThead = () => {
  const thead = <HTMLTableSectionElement>cloneOrigin.thead.cloneNode();
  const tr = cloneOrigin.tr.cloneNode();

  const tdText = ['Item', 'required Amount', 'PPU', 'total'];

  for (let i = 0; i <= 3; ++i) {
    const td = <HTMLTableCellElement>cloneOrigin.td.cloneNode();
    td.innerText = tdText[i];

    tr.appendChild(td);
  }

  thead.appendChild(tr);

  return thead;
};

export const MaterialInfoTippyHead = initiateMaterialInfoTippyThead();

export const getCurrencyElements = (valueObj: AuctionCraftSniper.valueObj) => {
  const fragment = document.createDocumentFragment();

  const { isNegative, ...currencies } = valueObj;

  Object.entries(currencies).forEach(entry => {
    const [currency, value] = entry;

    const span = cloneOrigin.currencies[currency].cloneNode();
    span.innerText = value.toString();

    fragment.appendChild(span);
  });

  while (fragment.childElementCount > 0 && parseInt((<HTMLSpanElement>fragment.firstElementChild).innerText) === 0) {
    fragment.removeChild(fragment.firstElementChild);
  }

  isNegative ? (<HTMLSpanElement>fragment.firstElementChild).classList.add('negative') : void 0;

  return fragment;
};
