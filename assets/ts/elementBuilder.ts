import tippy from 'tippy.js';
import { cloneOrigin, getWoWheadURL } from './helper';
import {
  toggleBlacklistEntry, formatCurrency, toggleTBody, TSMListener,
} from './eventChain';
import { AuctionCraftSniper } from './types';

/**
 *
 * @param {number} recipe
 * @param {boolean} isBlacklisted
 * @returns {HTMLTableCellElement}
 */
export const createBlackListTD = (recipe: number, isBlacklisted: boolean = false): HTMLTableCellElement => {
  const td = <HTMLTableCellElement>cloneOrigin.td.cloneNode();
  td.dataset.recipe = recipe.toString();
  td.addEventListener('click', toggleBlacklistEntry);
  td.classList.add(isBlacklisted ? 'recipe-is-invisible' : 'recipe-is-visible');

  tippy(td, { content: 'black- or whitelist this recipe' });

  return td;
};

/**
 * @returns {HTMLTableRowElement}
 */
export const createMissingProfitsHintTR = function (): HTMLTableRowElement {
  const hintTR = <HTMLTableRowElement>cloneOrigin.tr.cloneNode();

  const hintTD = <HTMLTableCellElement>cloneOrigin.td.cloneNode();
  hintTD.classList.add('missing-profits-hint');
  hintTD.colSpan = 6;
  hintTD.innerText = 'currently no recipes net profit';
  hintTD.classList.add('has-text-centered');

  hintTR.appendChild(hintTD);
  return hintTR;
};

/**
 *
 * @param {number} id
 * @param {string} name
 * @returns {HTMLTableCellElement}
 */
export const createProductNameTD = ({ item, name, producedQuantity }: AuctionCraftSniper.productJSON): HTMLTableCellElement => {
  const td = <HTMLTableCellElement>cloneOrigin.td.cloneNode();

  if (producedQuantity > 1) {
    const strong = <HTMLElement>cloneOrigin.strong.cloneNode();

    strong.classList.add('tag', 'is-warning', 'has-text-dark');
    strong.innerText = `${producedQuantity}x`;

    tippy(strong, { content: `This recipe always produces ${producedQuantity}, thus the product buyout column is adjusted to reflect that.` });

    td.appendChild(strong);
  }

  const a = <HTMLAnchorElement>cloneOrigin.a.cloneNode();
  a.href = getWoWheadURL(item);
  a.innerText = name;

  td.appendChild(a);

  return td;
};

/**
 *
 * @param {number} profit
 * @returns {HTMLTableCellElement}
 */
export const createProfitTD = (profit: number = 0): HTMLTableCellElement => {
  const td = <HTMLTableCellElement>cloneOrigin.td.cloneNode();
  td.classList.add('has-text-right');
  td.appendChild(formatCurrency(profit));

  return td;
};

/**
 *
 * @param {AuctionCraftSniper.innerProfessionDataJSON} recipe
 * @returns {HTMLTableDataCellElement}
 */
export const createMaterialTD = (recipe: AuctionCraftSniper.innerProfessionDataJSON): HTMLTableDataCellElement => {
  const materialInfoTD = <HTMLTableCellElement>cloneOrigin.td.cloneNode();
  materialInfoTD.classList.add('has-text-right');

  const tippyTable = <HTMLTableElement>cloneOrigin.table.cloneNode();
  const [thead, tbody] = [materialInfoTippyHead.cloneNode(true), cloneOrigin.tbody.cloneNode()];

  recipe.materials.forEach(material => {
    const tr = cloneOrigin.tr.cloneNode();

    for (let i = 0; i <= 3; ++i) {
      const td = <HTMLTableCellElement>cloneOrigin.td.cloneNode();

      switch (i) {
        case 0:
          const a = <HTMLAnchorElement>cloneOrigin.a.cloneNode();
          a.href = getWoWheadURL(material.itemID);
          a.innerText = material.name;
          td.appendChild(a);
          break;
        case 1:
          td.innerText = material.amount.toString();
          break;
        case 2:
          td.appendChild(formatCurrency(material.buyout));
          break;
        case 3:
          td.appendChild(formatCurrency(material.amount * material.buyout));
          break;
      }

      if (i > 0) {
        td.classList.add('has-text-right');
      }

      tr.appendChild(td);
    }

    tbody.appendChild(tr);
  });

  materialInfoTD.appendChild(formatCurrency(recipe.materialCostSum));

  tippyTable.appendChild(thead);
  tippyTable.appendChild(tbody);
  tippy(materialInfoTD, { content: tippyTable });

  return materialInfoTD;
};

/**
 *
 * @param {AuctionCraftSniper.innerProfessionDataJSON} recipe
 * @param {string} TUJBaseUrl
 * @returns {HTMLTableCellElement}
 */
export const createProductBuyoutTD = (recipe: AuctionCraftSniper.innerProfessionDataJSON, TUJBaseUrl: string): HTMLTableCellElement => {
  const productBuyoutTD = <HTMLTableCellElement>cloneOrigin.td.cloneNode();
  productBuyoutTD.classList.add('has-text-right');

  const a = <HTMLAnchorElement>cloneOrigin.a.cloneNode();
  a.href = `${TUJBaseUrl}${recipe.product.item}`;

  tippy(a, { content: `TUJ - ${recipe.product.name}` });

  a.appendChild(formatCurrency(recipe.product.buyout));
  productBuyoutTD.appendChild(a);

  return productBuyoutTD;
};

/**
 *
 * @param {AuctionCraftSniper.valueObj} valueObj
 * @returns {DocumentFragment}
 */
export const getCurrencyElements = (valueObj: AuctionCraftSniper.valueObj): DocumentFragment => {
  const fragment = document.createDocumentFragment();

  const { isNegative, ...currencies } = valueObj;

  Object.entries(currencies).forEach(entry => {
    const [currency, value] = entry;

    const span = cloneOrigin.currencies[currency].cloneNode();
    span.innerText = value.toLocaleString();

    fragment.appendChild(span);
  });

  while (fragment.childElementCount > 0 && parseInt((<HTMLSpanElement>fragment.firstElementChild).innerText) === 0) {
    fragment.removeChild(fragment.firstElementChild);
  }

  isNegative ? (<HTMLSpanElement>fragment.firstElementChild).classList.add('negative') : void 0;

  return fragment;
};

/**
 * @returns {HTMLTableSectionElement}
 */
const initiateMaterialInfoTippyThead = (): HTMLTableSectionElement => {
  const thead = <HTMLTableSectionElement>cloneOrigin.thead.cloneNode();
  const tr = cloneOrigin.tr.cloneNode();

  const tdText = ['Item', 'required Amount', 'PPU', 'total'];

  for (let i = 0; i <= 3; ++i) {
    const td = <HTMLTableCellElement>cloneOrigin.td.cloneNode();
    td.innerText = tdText[i];

    if (i > 0) {
      td.classList.add('has-text-right');
    }

    tr.appendChild(td);
  }

  thead.appendChild(tr);

  return thead;
};

const materialInfoTippyHead = initiateMaterialInfoTippyThead();

/**
 *
 * @param {number} margin
 * @returns {HTMLTableCellElement}
 */
export const createWinMarginTD = (margin: number): HTMLTableCellElement => {
  const td = <HTMLTableCellElement>cloneOrigin.td.cloneNode();
  td.classList.add('has-text-right');
  td.innerText = `${margin}%`;

  return td;
};

/**
 *
 * @param target
 * @returns {HTMLTableCellElement}
 */
const createTSMTD = (target: string = ''): HTMLTableCellElement => {
  const TSMTD = <HTMLTableCellElement>cloneOrigin.td.cloneNode();
  TSMTD.classList.add('tsm');
  TSMTD.addEventListener('click', function () {
    TSMListener(this, target);
  });

  tippy(TSMTD, { content: target === '' ? 'exports <strong>profitable</strong> non-blacklisted recipes to TSM' : 'exports <strong>all</strong> non-blacklisted recipes to TSM' });

  return TSMTD;
};

/**
 * @returns {HTMLTableRowElement}
 */
export const createRecipeHintTR = (className: string): HTMLTableRowElement => {
  const hintTR = <HTMLTableRowElement>cloneOrigin.tr.cloneNode();

  const hintTD = <HTMLTableCellElement>cloneOrigin.td.cloneNode();
  hintTD.classList.add(`${className}-hint`, 'has-text-centered');
  hintTD.colSpan = className === 'lossy-recipes' ? 5 : 6;
  hintTD.innerText = `show ${className === 'lossy-recipes' ? 'lossy' : 'unlisted'} recipes`;
  hintTD.addEventListener('click', toggleTBody);

  hintTR.appendChild(hintTD);

  if (className === 'lossy-recipes') {
    hintTR.appendChild(createTSMTD('.lossy-recipes'));
  }

  return hintTR;
};

const TUJLinkHintSVG = '<svg class="svg" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" viewBox="0 0 1024 1024"><path fill="#bdcbdb" d="M574 665.4a8.03 8.03 0 0 0-11.3 0L446.5 781.6c-53.8 53.8-144.6 59.5-204 0-59.5-59.5-53.8-150.2 0-204l116.2-116.2c3.1-3.1 3.1-8.2 0-11.3l-39.8-39.8a8.03 8.03 0 0 0-11.3 0L191.4 526.5c-84.6 84.6-84.6 221.5 0 306s221.5 84.6 306 0l116.2-116.2c3.1-3.1 3.1-8.2 0-11.3L574 665.4zm258.6-474c-84.6-84.6-221.5-84.6-306 0L410.3 307.6a8.03 8.03 0 0 0 0 11.3l39.7 39.7c3.1 3.1 8.2 3.1 11.3 0l116.2-116.2c53.8-53.8 144.6-59.5 204 0 59.5 59.5 53.8 150.2 0 204L665.3 562.6a8.03 8.03 0 0 0 0 11.3l39.8 39.8c3.1 3.1 8.2 3.1 11.3 0l116.2-116.2c84.5-84.6 84.5-221.5 0-306.1zM610.1 372.3a8.03 8.03 0 0 0-11.3 0L372.3 598.7a8.03 8.03 0 0 0 0 11.3l39.6 39.6c3.1 3.1 8.2 3.1 11.3 0l226.4-226.4c3.1-3.1 3.1-8.2 0-11.3l-39.5-39.6z"></path></svg>';

const MaterialTHHintSVG = '<svg class="svg" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" viewBox="0 0 24 24"><path fill="#bdcbdb" d="M13.746 10.187l.635.136 4.165 2.078a1.615 1.615 0 0 1 1.107 1.66v.255l-.907 6.125a1.75 1.75 0 0 1-.599 1.107c-.306.3-.715.469-1.143.472h-6.888a1.751 1.751 0 0 1-1.27-.553l-5.99-5.98.908-.972c.257-.263.613-.404.98-.39h.29L9 14.997V4.5a2 2 0 0 1 4 0v5.687h.746z"/></svg>';

/**
 * @returns {HTMLTableSectionElement}
 */
export const initiateTHead = (): HTMLTableSectionElement => {
  const thead = <HTMLTableSectionElement>cloneOrigin.thead.cloneNode();
  const theadRow = cloneOrigin.tr.cloneNode();

  ['Item', `Material ${MaterialTHHintSVG} Info`, `Product ${TUJLinkHintSVG} TUJ`, 'Profit', 'Margin'].forEach(thText => {
    const th = <HTMLTableHeaderCellElement>cloneOrigin.th.cloneNode();
    th.innerHTML = thText;

    theadRow.appendChild(th);
  });

  theadRow.appendChild(createTSMTD());

  thead.appendChild(theadRow);

  return thead;
};
