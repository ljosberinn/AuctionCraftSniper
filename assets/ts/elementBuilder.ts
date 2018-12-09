import tippy from 'tippy.js';
import { cloneOrigin, getWoWheadURL } from './helper';
import {
  toggleBlacklistEntry, formatCurrency, toggleLossyRecipes, TSMListener,
} from './eventChain';
import { AuctionCraftSniper } from './types';

export const createBlackListTD = (recipe: number, isBlacklisted: boolean = false) => {
  const td = <HTMLTableCellElement>cloneOrigin.td.cloneNode();
  td.dataset.recipe = recipe.toString();
  td.addEventListener('click', toggleBlacklistEntry);
  td.classList.add(isBlacklisted ? 'recipe-is-invisible' : 'recipe-is-visible');

  tippy(td, { content: 'black- or whitelist this recipe' });

  return td;
};

export const createMissingProfitsHintTR = function () {
  const hintTR = cloneOrigin.tr.cloneNode();

  const hintTD = <HTMLTableCellElement>cloneOrigin.td.cloneNode();
  hintTD.classList.add('missing-profits-hint');
  hintTD.colSpan = 4;
  hintTD.innerText = 'currently no recipes net profit';

  hintTR.appendChild(hintTD);
  return hintTR;
};

/**
 *
 * @param {number} id
 * @param {string} name
 */
export const createProductNameTD = ({ item, name, producedQuantity }: AuctionCraftSniper.productJSON) => {
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
 */
export const createProfitTD = (profit: number = 0) => {
  const td = <HTMLTableCellElement>cloneOrigin.td.cloneNode();
  td.classList.add('has-text-right');
  td.appendChild(formatCurrency(profit));

  return td;
};

export const initiateTHead = () => {
  const thead = cloneOrigin.thead.cloneNode();
  const theadRow = cloneOrigin.tr.cloneNode();

  ['itemName', 'materialInfo', 'productBuyout', 'profit', 'margin'].forEach(thText => {
    const th = <HTMLTableHeaderCellElement>cloneOrigin.th.cloneNode();
    th.innerText = thText;
    theadRow.appendChild(th);
  });

  const TSMTD = createTSMTD();
  theadRow.appendChild(TSMTD);

  thead.appendChild(theadRow);

  return thead;
};

/**
 *
 * @param {AuctionCraftSniper.innerProfessionDataJSON} recipe
 * @returns {mixed}
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
          td.style.textAlign = 'right';
          td.innerText = material.amount.toString();
          break;
        case 2:
          td.style.textAlign = 'right';
          td.appendChild(formatCurrency(material.buyout));
          break;
        case 3:
          td.style.textAlign = 'right';
          td.appendChild(formatCurrency(material.amount * material.buyout));
          break;
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
 */
export const createProductBuyoutTD = (recipe: AuctionCraftSniper.innerProfessionDataJSON, TUJBaseUrl: string) => {
  const productBuyoutTD = <HTMLTableCellElement>cloneOrigin.td.cloneNode();
  productBuyoutTD.classList.add('has-text-right');

  const a = <HTMLAnchorElement>cloneOrigin.a.cloneNode();
  a.classList.add('tuj');
  a.target = '_blank';
  a.href = `${TUJBaseUrl}${recipe.product.item}`;

  tippy(a, { content: `TUJ - ${recipe.product.name}` });

  [a, formatCurrency(recipe.product.buyout)].forEach(el => productBuyoutTD.appendChild(el));

  return productBuyoutTD;
};

/**
 *
 * @param {AuctionCraftSniper.valueObj} valueObj
 */
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

const materialInfoTippyHead = initiateMaterialInfoTippyThead();

export const createWinMarginTD = (margin: number) => {
  const td = <HTMLTableCellElement>cloneOrigin.td.cloneNode();
  td.classList.add('has-text-right');
  td.innerText = `${margin}%`;

  return td;
};

export const createTSMTD = (target: string = '') => {
  const TSMTD = <HTMLTableCellElement>cloneOrigin.td.cloneNode();
  TSMTD.classList.add('tsm');
  TSMTD.addEventListener('click', function () {
    TSMListener(this, target);
  });

  tippy(TSMTD, { content: target === '' ? 'exports <strong>profitable</strong> non-blacklisted recipes to TSM' : 'exports <strong>all</strong> non-blacklisted recipes to TSM' });

  return TSMTD;
};

export const createLossyRecipeHintTR = () => {
  const hintTR = cloneOrigin.tr.cloneNode();

  const hintTD = <HTMLTableCellElement>cloneOrigin.td.cloneNode();
  hintTD.classList.add('lossy-recipes-hint');
  hintTD.colSpan = 5;
  hintTD.innerText = 'show lossy recipes';
  hintTD.addEventListener('click', toggleLossyRecipes);

  const TSMTD = createTSMTD('.lossy-recipes');

  [hintTD, TSMTD].forEach(td => hintTR.appendChild(td));
  return hintTR;
};
