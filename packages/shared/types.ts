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

// PVGIS PV Calculation Response Types
export type PVGISLocation = {
  latitude: number;
  longitude: number;
  elevation: number;
};

export type PVGISMeteoData = {
  radiation_db: string;
  meteo_db: string;
  year_min: number;
  year_max: number;
  use_horizon: boolean;
  horizon_db: string;
};

export type PVGISMountingSystem = {
  fixed: {
    slope: {
      value: number;
      optimal: boolean;
    };
    azimuth: {
      value: number;
      optimal: boolean;
    };
    type: 'free-standing' | 'building-integrated';
  };
};

export type PVGISPVModule = {
  technology: string;
  peak_power: number;
  system_loss: number;
};

export type PVGISEconomicData = {
  system_cost: number;
  interest: number;
  lifetime: number;
};

export type PVGISMonthlyData = {
  month: number;
  E_d: number;      // Average daily energy production (kWh/d)
  E_m: number;      // Average monthly energy production (kWh/mo)
  'H(i)_d': number; // Average daily sum of global irradiation (kWh/m2/d)
  'H(i)_m': number; // Average monthly sum of global irradiation (kWh/m2/mo)
  SD_m: number;     // Standard deviation of monthly production (kWh)
};

export type PVGISTotals = {
  E_d: number;      // Average daily energy production (kWh/d)
  E_m: number;      // Average monthly energy production (kWh/mo)
  E_y: number;      // Average annual energy production (kWh/y)
  'H(i)_d': number; // Average daily sum of global irradiation (kWh/m2/d)
  'H(i)_m': number; // Average monthly sum of global irradiation (kWh/m2/mo)
  'H(i)_y': number; // Average annual sum of global irradiation (kWh/m2/y)
  SD_m: number;     // Standard deviation of monthly production (kWh)
  SD_y: number;     // Standard deviation of annual production (kWh)
  l_aoi: number;    // Angle of incidence loss (%)
  l_spec: string;   // Spectral loss (%)
  l_tg: number;     // Temperature and irradiance loss (%)
  l_total: number;  // Total loss (%)
  LCOE_pv: number;  // Levelized cost of electricity (currency/kWh)
};

export type PVGISMetaVariable = {
  description: string;
  units?: string;
};

export type PVGISMetaLocationVariables = {
  latitude: PVGISMetaVariable;
  longitude: PVGISMetaVariable;
  elevation: PVGISMetaVariable;
};

export type PVGISMetaMeteoDataVariables = {
  radiation_db: PVGISMetaVariable;
  meteo_db: PVGISMetaVariable;
  year_min: PVGISMetaVariable;
  year_max: PVGISMetaVariable;
  use_horizon: PVGISMetaVariable;
  horizon_db: PVGISMetaVariable;
};

export type PVGISMetaMountingSystemFields = {
  slope: PVGISMetaVariable;
  azimuth: PVGISMetaVariable;
};

export type PVGISMetaPVModuleVariables = {
  technology: PVGISMetaVariable;
  peak_power: PVGISMetaVariable;
  system_loss: PVGISMetaVariable;
};

export type PVGISMetaEconomicDataVariables = {
  system_cost: PVGISMetaVariable;
  interest: PVGISMetaVariable;
  lifetime: PVGISMetaVariable;
};

export type PVGISMetaMonthlyVariables = {
  E_d: PVGISMetaVariable;
  E_m: PVGISMetaVariable;
  'H(i)_d': PVGISMetaVariable;
  'H(i)_m': PVGISMetaVariable;
  SD_m: PVGISMetaVariable;
};

export type PVGISMetaTotalsVariables = {
  E_d: PVGISMetaVariable;
  E_m: PVGISMetaVariable;
  E_y: PVGISMetaVariable;
  'H(i)_d': PVGISMetaVariable;
  'H(i)_m': PVGISMetaVariable;
  'H(i)_y': PVGISMetaVariable;
  SD_m: PVGISMetaVariable;
  SD_y: PVGISMetaVariable;
  l_aoi: PVGISMetaVariable;
  l_spec: PVGISMetaVariable;
  l_tg: PVGISMetaVariable;
  l_total: PVGISMetaVariable;
  LCOE_pv: PVGISMetaVariable;
};

export type PVGISCalcResponse = {
  inputs: {
    location: PVGISLocation;
    meteo_data: PVGISMeteoData;
    mounting_system: PVGISMountingSystem;
    pv_module: PVGISPVModule;
    economic_data: PVGISEconomicData;
  };
  outputs: {
    monthly: {
      fixed: PVGISMonthlyData[];
    };
    totals: {
      fixed: PVGISTotals;
    };
  };
  meta: {
    inputs: {
      location: {
        description: string;
        variables: PVGISMetaLocationVariables;
      };
      meteo_data: {
        description: string;
        variables: PVGISMetaMeteoDataVariables;
      };
      mounting_system: {
        description: string;
        choices: string;
        fields: PVGISMetaMountingSystemFields;
      };
      pv_module: {
        description: string;
        variables: PVGISMetaPVModuleVariables;
      };
      economic_data: {
        description: string;
        variables: PVGISMetaEconomicDataVariables;
      };
    };
    outputs: {
      monthly: {
        type: string;
        timestamp: string;
        variables: PVGISMetaMonthlyVariables;
      };
      totals: {
        type: string;
        variables: PVGISMetaTotalsVariables;
      };
    };
  };
};
  