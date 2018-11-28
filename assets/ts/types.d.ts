export declare namespace AuctionCraftSniper {
  interface cloneOriginCurrencynObj {
    gold?: HTMLSpanElement;
    silver?: HTMLSpanElement;
    copper?: HTMLSpanElement;
  }

  interface cloneOriginObj {
    table?: HTMLTableElement;
    thead?: HTMLTableSectionElement;
    tbody?: HTMLTableSectionElement;
    th?: HTMLTableHeaderCellElement;
    tr?: HTMLTableRowElement;
    td?: HTMLTableCellElement;
    span?: HTMLSpanElement;
    a?: HTMLAnchorElement;
    currencies?: cloneOriginCurrencynObj;
  }

  interface parseAuctionDataPayload {
    itemIDs?: object;
    step?: number;
    houseID: number;
    expansionLevel: number;
  }

  interface parseAuctionDataResponseJSON {
    itemIDs: number[];
    percentDone: number;
    reqSteps: number;
    step: number;

    err?: string;
    callback?: string;
  }

  interface ACSSettingsObj {
    blacklistedRecipes?: number[];
    alwaysShowLossyRecipes?: boolean;
    fetchOnLoad?: boolean;
  }

  interface localStorageObj {
    houseID?: undefined | number;
    professions?: number[];
    expansionLevel?: number;
    settings?: ACSSettingsObj;
  }

  interface materialJSON {
    buyout: number;
    name: string;
    rank: number;
    amount: number;
    itemID: number;
  }

  interface productJSON {
    buyout: number;
    item: number;
    name: string;
  }

  interface innerProfessionDataJSON {
    materials: materialJSON[];
    product: productJSON;
    profit: number;
  }

  interface outerProfessionDataJSON {
    Alchemy?: innerProfessionDataJSON[];
    Blacksmithing?: innerProfessionDataJSON[];
    Cooking?: innerProfessionDataJSON[];
    Enchanting?: innerProfessionDataJSON[];
    Engineering?: innerProfessionDataJSON[];
    Inscription?: innerProfessionDataJSON[];
    Jewelcrafting?: innerProfessionDataJSON[];
    Leatherworking?: innerProfessionDataJSON[];
    Tailoring?: innerProfessionDataJSON[];
  }

  interface valueObj {
    isNegative: boolean;
    gold: number;
    silver: number;
    copper: number;
  }

  interface checkHouseAgeJSON {
    callback: string;
    lastUpdate: number;
  }

  interface currencyObj {
    gold?: HTMLSpanElement;
    silver?: HTMLSpanElement;
    copper?: HTMLSpanElement;
  }

  interface innerProfessionDataJSON {
    materials: materialJSON[];
    product: productJSON;
    profit: number;
  }

  interface materialJSON {
    buyout: number;
    name: string;
    rank: number;
    amount: number;
    itemID: number;
  }

  interface productJSON {
    buyout: number;
    item: number;
    name: string;
  }
}
