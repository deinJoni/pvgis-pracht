export type User = {
    id: string;
    name: string;
    email: string;
  };
  
// Common types used across multiple endpoints
export type BaseParams = {
  lat: number;
  lon: number;
  usehorizon?: 0 | 1;
  userhorizon?: number[];
  raddatabase?: 'PVGIS-SARAH' | 'PVGIS-NSRDB' | 'PVGIS-ERA5' | 'PVGIS-COSMO' | 'PVGIS-CMSAF';
  outputformat?: 'csv' | 'json' | 'basic' | 'epw';
  browser?: 0 | 1;
};

// Grid-connected & tracking PV systems
export type PVCalcParams = BaseParams & {
  peakpower: number;
  pvtechchoice?: 'crystSi' | 'CIS' | 'CdTe' | 'Unknown';
  mountingplace?: 'free' | 'building';
  loss: number;
  fixed?: 0 | 1;
  angle?: number;
  aspect?: number;
  optimalinclination?: 0 | 1;
  optimalangles?: 0 | 1;
  inclined_axis?: 0 | 1;
  inclined_optimum?: 0 | 1;
  inclinedaxisangle?: number;
  vertical_axis?: 0 | 1;
  vertical_optimum?: 0 | 1;
  verticalaxisangle?: number;
  twoaxis?: 0 | 1;
  pvprice?: 0 | 1;
  systemcost?: number;
  interest?: number;
  lifetime?: number;
};

// Off-grid PV systems
export type SHSCalcParams = BaseParams & {
  peakpower: number;
  batterysize: number;
  cutoff: number;
  consumptionday: number;
  hourconsumption?: number[];
};

// Monthly radiation
export type MRCalcParams = BaseParams & {
  startyear?: number;
  endyear?: number;
  horirrad?: 0 | 1;
  optrad?: 0 | 1;
  selectrad?: 0 | 1;
  angle?: number;
  mr_dni?: 0 | 1;
  d2g?: 0 | 1;
  avtemp?: 0 | 1;
};

// Daily radiation
export type DRCalcParams = BaseParams & {
  month: number;
  angle?: number;
  aspect?: number;
  global?: 0 | 1;
  glob_2axis?: 0 | 1;
  clearsky?: 0 | 1;
  clearsky_2axis?: 0 | 1;
  showtemperatures?: 0 | 1;
  localtime?: 0 | 1;
};

// Hourly radiation
export type SeriesCalcParams = BaseParams & {
  startyear?: number;
  endyear?: number;
  pvcalculation?: 0 | 1;
  peakpower?: number;
  pvtechchoice?: 'crystSi' | 'CIS' | 'CdTe' | 'Unknown';
  mountingplace?: 'free' | 'building';
  loss?: number;
  trackingtype?: 0 | 1 | 2 | 3 | 4 | 5;
  angle?: number;
  aspect?: number;
  optimalinclination?: 0 | 1;
  optimalangles?: 0 | 1;
  components?: 0 | 1;
};

// TMY (Typical Meteorological Year)
export type TMYParams = BaseParams & {
  startyear?: number;
  endyear?: number;
};

// Horizon profile
export type HorizonParams = BaseParams & {
  userhorizon?: number[];
};

// API Response types
export type PVGISError = {
  status: 'error';
  message: string;
};

export type PVGISSuccess<T> = {
  status: 'success';
  data: T;
};

export type PVGISResponse<T> = PVGISError | PVGISSuccess<T>;

// API Endpoints
export enum PVGISEndpoint {
  PVCalc = 'PVcalc',
  SHSCalc = 'SHScalc',
  MRCalc = 'MRcalc',
  DRCalc = 'DRcalc',
  SeriesCalc = 'seriescalc',
  TMY = 'tmy',
  PrintHorizon = 'printhorizon'
}

// API Base URL
export const PVGIS_API_BASE_URL = 'https://re.jrc.ec.europa.eu/api/v5_3';
  