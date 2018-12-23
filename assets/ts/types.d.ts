export declare namespace AuctionCraftSniper {
  interface IcloneOriginCurrencynObj {
    gold?: HTMLSpanElement;
    silver?: HTMLSpanElement;
    copper?: HTMLSpanElement;
  }

  interface IcloneOriginObj {
    table?: HTMLTableElement;
    thead?: HTMLTableSectionElement;
    tbody?: HTMLTableSectionElement;
    th?: HTMLTableHeaderCellElement;
    tr?: HTMLTableRowElement;
    td?: HTMLTableCellElement;
    a?: HTMLAnchorElement;
    div?: HTMLDivElement;
    button?: HTMLButtonElement;
    strong?: HTMLElement;
    currencies?: IcloneOriginCurrencynObj;
  }

  interface IparseAuctionDataPayload {
    houseID: number;
    expansionLevel: number;
  }

  interface IparseAuctionDataResponseJSON {
    err?: string;
    callback?: string;
  }

  interface IACSSettingsObj {
    blacklistedRecipes?: number[];
    alwaysShowLossyRecipes?: boolean;
    alwaysShowUnlistedRecipes?: boolean;
    fetchOnLoad?: boolean;
    pushNotificationsAllowed?: boolean;
    hideBlacklistedRecipes?: boolean;
    marginThresholdPercent?: number;
    profitThresholdValue?: number;
    useAssumedAlchemyProcRate?: boolean;
  }

  interface IlocalStorageObj {
    houseID?: undefined | number;
    professions?: number[];
    expansionLevel?: number;
    lastUpdate?: number;
    houseUpdateInterval?: number;
    currentTab?: undefined | string;
    settings?: IACSSettingsObj;
    hasLocalStorage?: boolean;
  }

  interface ImaterialJSON {
    buyout: number;
    name: string;
    amount: number;
    itemID: number;
  }

  interface IproductJSON {
    buyout: number;
    item: number;
    name: string;
    producedQuantity: number;
  }

  interface IinnerProfessionDataJSON {
    materials: ImaterialJSON[];
    product: IproductJSON;
    profit: number;
    margin: number;
    materialCostSum: number;
  }

  interface IouterProfessionDataJSON {
    alchemy?: IinnerProfessionDataJSON[];
    blacksmithing?: IinnerProfessionDataJSON[];
    cooking?: IinnerProfessionDataJSON[];
    enchanting?: IinnerProfessionDataJSON[];
    engineering?: IinnerProfessionDataJSON[];
    inscription?: IinnerProfessionDataJSON[];
    jewelcrafting?: IinnerProfessionDataJSON[];
    leatherworking?: IinnerProfessionDataJSON[];
    tailoring?: IinnerProfessionDataJSON[];
    callback?: string;
  }

  interface IcurrencyContainer {
    isNegative?: boolean;
    gold: number;
    silver: number;
    copper: number;
  }

  interface IcheckHouseAgeJSON {
    callback: string;
    lastUpdate: number;
  }

  interface IcurrencyObj {
    gold?: HTMLSpanElement;
    silver?: HTMLSpanElement;
    copper?: HTMLSpanElement;
  }

  interface IinnerProfessionDataJSON {
    materials: ImaterialJSON[];
    product: IproductJSON;
    profit: number;
  }

  interface ImaterialJSON {
    buyout: number;
    name: string;
    rank: number;
    amount: number;
    itemID: number;
  }

  interface IproductJSON {
    buyout: number;
    item: number;
    name: string;
  }
  interface IvalidateRegionRealmJSON {
    houseID: number;
    updateInterval: number;
  }

  interface IrealmRegionParams {
    value: string[];
    retry: number;
  }

  interface IcheckHouseAgeArgs {
    triggeredByRefresher: boolean;
    retry: number;
  }
}
