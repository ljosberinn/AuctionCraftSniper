export declare namespace AuctionCraftSniper {
  interface CloneOriginCurrencynObjInterface {
    gold?: HTMLSpanElement;
    silver?: HTMLSpanElement;
    copper?: HTMLSpanElement;
  }

  interface CloneOriginObjInterface {
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
    currencies?: CloneOriginCurrencynObjInterface;
  }

  interface ParseAuctionDataPayloadInterface {
    houseID: number;
    expansionLevel: number;
  }

  interface ParseAuctionDataResponseJSONInterface {
    err?: string;
    callback?: string;
  }

  interface ACSSettingsObjInterface {
    blacklistedRecipes?: number[];
    alwaysShowLossyRecipes?: boolean;
    alwaysShowUnlistedRecipes?: boolean;
    fetchOnLoad?: boolean;
    pushNotificationsAllowed?: boolean;
    hideBlacklistedRecipes?: boolean;
    marginThresholdPercent?: number;
    profitThresholdValue?: number;
    useAssumedAlchemyProcRate?: boolean;
    useEstimatedExpulsomPrice?: boolean;
    useAdjustedExpulsomPrice?: boolean;
  }

  interface LocalStorageObjInterface {
    houseID?: undefined | number;
    professions?: number[];
    expansionLevel?: number;
    lastUpdate?: number;
    houseUpdateInterval?: number;
    currentTab?: undefined | string;
    settings?: ACSSettingsObjInterface;
    hasLocalStorage?: boolean;
  }

  interface MaterialJSONInterface {
    buyout: number;
    name: string;
    amount: number;
    itemID: number;
  }

  interface ProductJSONInterface {
    buyout: number;
    item: number;
    name: string;
    producedQuantity: number;
    mayProcMultiple: boolean;
  }

  interface InnerProfessionDataJSONInterface {
    materials: MaterialJSONInterface[];
    product: ProductJSONInterface;
    profit: number;
    margin: number;
    materialCostSum: number;
  }

  interface OuterProfessionDataJSONInterface {
    alchemy?: InnerProfessionDataJSONInterface[];
    blacksmithing?: InnerProfessionDataJSONInterface[];
    cooking?: InnerProfessionDataJSONInterface[];
    enchanting?: InnerProfessionDataJSONInterface[];
    engineering?: InnerProfessionDataJSONInterface[];
    inscription?: InnerProfessionDataJSONInterface[];
    jewelcrafting?: InnerProfessionDataJSONInterface[];
    leatherworking?: InnerProfessionDataJSONInterface[];
    tailoring?: InnerProfessionDataJSONInterface[];
    callback?: string;
    expulsomData?: ExpulsomWorthObjInterface;
  }

  interface ExpulsomWorthObjInterface {
    estimatedPrice: number;
    adjustedPrice: number;
    cheapestItem: number;
  }

  interface CurrencyContainerInterface {
    isNegative?: boolean;
    gold: number;
    silver: number;
    copper: number;
  }

  interface CheckHouseAgeJSONInterface {
    callback: string;
    lastUpdate: number;
  }

  interface CurrencyObjInterface {
    gold?: HTMLSpanElement;
    silver?: HTMLSpanElement;
    copper?: HTMLSpanElement;
  }

  interface InnerProfessionDataJSONInterface {
    materials: MaterialJSONInterface[];
    product: ProductJSONInterface;
    profit: number;
  }

  interface MaterialJSONInterface {
    buyout: number;
    name: string;
    rank: number;
    amount: number;
    itemID: number;
    baseBuyPrice: number;
  }

  interface ProductJSONInterface {
    buyout: number;
    item: number;
    name: string;
  }
  interface ValidateRegionRealmJSONInterface {
    houseID: number;
    updateInterval: number;
  }

  interface RealmRegionParamsInterface {
    value: string[];
    retry: number;
  }

  interface CheckHouseAgeArgsInterface {
    triggeredByRefresher: boolean;
    retry: number;
  }
}
