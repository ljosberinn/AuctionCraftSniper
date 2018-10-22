interface ObjectConstructor {
  assign(target: any, ...sources: any[]): Object;
}

interface ACSLocalStorageObj {
  house?: undefined | number;
  professions?: number[];
}