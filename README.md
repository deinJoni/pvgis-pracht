# PVGIS Pracht

This is a monorepo project containing a frontend application, backend server, and shared packages.

## Prerequisites

- Node.js (v18 or higher recommended)
- [pnpm](https://pnpm.io/) (v9.1.2 or higher)

## Project Structure

```
.
├── apps/
│   ├── frontend/    # React frontend application
│   └── backend/     # Backend server
└── packages/
    └── shared/      # Shared types and utilities
```

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd pvgis-pracht
```

2. Install dependencies:
```bash
pnpm install
```

This will install all dependencies for the frontend, backend, and shared packages.

## Development

To run both frontend and backend in development mode:

```bash
pnpm dev
```

This will start:
- Frontend development server
- Backend development server

### Running Individual Services

To run services individually:

Frontend:
```bash
pnpm --filter frontend dev
```

Backend:
```bash
pnpm --filter backend dev
```

## Building for Production

To build all packages:

```bash
pnpm build
```

To build individual packages:

```bash
pnpm --filter frontend build
pnpm --filter backend build
pnpm --filter shared build
```

## API Types Documentation

This project includes TypeScript types for the PVGIS API v5.3. Below is a comprehensive documentation of all available types.

### Base Parameters

```typescript
type BaseParams = {
  lat: number;          // Latitude in decimal degrees (south is negative)
  lon: number;          // Longitude in decimal degrees (west is negative)
  usehorizon?: 0 | 1;   // Calculate with shadows from high horizon (1 = yes)
  userhorizon?: number[]; // Custom horizon heights in degrees
  raddatabase?: 'PVGIS-SARAH' | 'PVGIS-NSRDB' | 'PVGIS-ERA5' | 'PVGIS-COSMO' | 'PVGIS-CMSAF';
  outputformat?: 'csv' | 'json' | 'basic' | 'epw';
  browser?: 0 | 1;      // Output as file (1) or stream (0)
}
```

### Grid-connected & Tracking PV Systems

```typescript
type PVCalcParams = BaseParams & {
  peakpower: number;    // Nominal power of PV system (kW)
  pvtechchoice?: 'crystSi' | 'CIS' | 'CdTe' | 'Unknown';
  mountingplace?: 'free' | 'building';
  loss: number;         // System losses (%)
  fixed?: 0 | 1;        // Fixed mounting system
  angle?: number;       // Inclination angle
  aspect?: number;      // Orientation angle (0=south, 90=west, -90=east)
  optimalinclination?: 0 | 1;
  optimalangles?: 0 | 1;
  // ... and more tracking-related parameters
}
```

### Off-grid PV Systems

```typescript
type SHSCalcParams = BaseParams & {
  peakpower: number;     // Nominal power in W
  batterysize: number;   // Battery capacity in Wh
  cutoff: number;        // Battery cutoff percentage
  consumptionday: number; // Daily energy consumption in Wh
  hourconsumption?: number[]; // Hourly consumption profile
}
```

### Monthly Radiation

```typescript
type MRCalcParams = BaseParams & {
  startyear?: number;
  endyear?: number;
  horirrad?: 0 | 1;     // Output horizontal plane irradiation
  optrad?: 0 | 1;       // Output optimal angle plane irradiation
  selectrad?: 0 | 1;    // Output selected inclination irradiation
  angle?: number;       // Selected inclination angle
  mr_dni?: 0 | 1;      // Output direct normal irradiation
  d2g?: 0 | 1;         // Output diffuse/global radiation ratio
  avtemp?: 0 | 1;      // Output average temperature
}
```

### Daily Radiation

```typescript
type DRCalcParams = BaseParams & {
  month: number;        // Month number (1-12, 0 for all months)
  angle?: number;       // Inclination angle
  aspect?: number;      // Orientation angle
  global?: 0 | 1;      // Output global irradiance
  glob_2axis?: 0 | 1;  // Output two-axis tracking irradiance
  clearsky?: 0 | 1;    // Output clear-sky irradiance
  clearsky_2axis?: 0 | 1;
  showtemperatures?: 0 | 1;
  localtime?: 0 | 1;   // Use local time instead of UTC
}
```

### Hourly Radiation

```typescript
type SeriesCalcParams = BaseParams & {
  startyear?: number;
  endyear?: number;
  pvcalculation?: 0 | 1;
  peakpower?: number;
  pvtechchoice?: 'crystSi' | 'CIS' | 'CdTe' | 'Unknown';
  mountingplace?: 'free' | 'building';
  loss?: number;
  trackingtype?: 0 | 1 | 2 | 3 | 4 | 5; // Different tracking options
  // ... and more parameters
}
```

### TMY (Typical Meteorological Year)

```typescript
type TMYParams = BaseParams & {
  startyear?: number;   // First year of TMY
  endyear?: number;     // Final year of TMY
}
```

### API Response Types

```typescript
type PVGISError = {
  status: 'error';
  message: string;
}

type PVGISSuccess<T> = {
  status: 'success';
  data: T;
}

type PVGISResponse<T> = PVGISError | PVGISSuccess<T>;
```

### API Endpoints

```typescript
enum PVGISEndpoint {
  PVCalc = 'PVcalc',         // Grid-connected PV
  SHSCalc = 'SHScalc',       // Off-grid PV
  MRCalc = 'MRcalc',         // Monthly radiation
  DRCalc = 'DRcalc',         // Daily radiation
  SeriesCalc = 'seriescalc', // Hourly radiation
  TMY = 'tmy',               // Typical Meteorological Year
  PrintHorizon = 'printhorizon' // Horizon profile
}
```

The base URL for all API endpoints is: `https://re.jrc.ec.europa.eu/api/v5_3`

## Server API Endpoints

### POST /api/pv-calc

Calculates PV system performance by forwarding requests to the PVGIS API. The endpoint accepts all parameters supported by the PVGIS PVcalc API and returns the results in a standardized format.

#### Example Request Payload:

```json
{
  "lat": 47.37,              // Latitude of Zurich
  "lon": 8.55,               // Longitude of Zurich
  "peakpower": 5.0,          // 5 kW system
  "loss": 14,                // 14% system losses
  "pvtechchoice": "crystSi", // Crystalline Silicon technology
  "mountingplace": "building", // Building-integrated mounting
  "angle": 35,               // 35° tilt angle
  "aspect": 0,               // South-facing (0° = South)
  "raddatabase": "PVGIS-ERA5", // ERA5 radiation database
  "usehorizon": 1,           // Consider horizon shadows
  "optimalinclination": 0,   // Don't calculate optimal inclination
  "optimalangles": 0,        // Don't calculate optimal angles
  "fixed": 1,                // Fixed mounting system
  "pvprice": 1,              // Calculate PV electricity price
  "systemcost": 6000,        // System cost in currency units
  "interest": 2.5,           // 2.5% annual interest rate
  "lifetime": 25             // 25 years system lifetime
}
```

#### Response Format:

```typescript
type PVGISResponse<T> = {
  status: 'success' | 'error';
  data?: T;              // Present when status is 'success'
  message?: string;      // Present when status is 'error'
}
```

On success, the response data contains three main sections:

1. `inputs`: Contains the processed input parameters
   ```typescript
   {
     location: {
       latitude: number;      // Decimal degrees
       longitude: number;     // Decimal degrees
       elevation: number;     // Meters
     };
     meteo_data: {
       radiation_db: string;  // Solar radiation database used
       meteo_db: string;     // Meteorological database used
       year_min: number;     // First year of calculations
       year_max: number;     // Last year of calculations
       use_horizon: boolean; // Whether horizon shadows were included
       horizon_db: string;   // Source of horizon data
     };
     mounting_system: {
       fixed?: {            // Present for fixed mounting systems
         slope: {
           value: number;   // Degrees from horizontal
           optimal: boolean;
         };
         azimuth: {
           value: number;   // Degrees (0=S, 90=W, -90=E)
           optimal: boolean;
         };
         type: string;     // e.g., "building-integrated"
       };
     };
     pv_module: {
       technology: string;  // e.g., "c-Si"
       peak_power: number; // Nominal power in kW
       system_loss: number; // System losses in %
     };
     economic_data?: {     // Present if economic calculation requested
       system_cost: number;
       interest: number;   // Annual interest rate in %
       lifetime: number;   // System lifetime in years
     };
   }
   ```

2. `outputs`: Contains the calculation results
   ```typescript
   {
     monthly: {
       fixed: Array<{      // Monthly averages
         month: number;    // 1-12
         E_d: number;     // Daily energy production (kWh/day)
         E_m: number;     // Monthly energy production (kWh/month)
         H(i)_d: number;  // Daily irradiation on modules (kWh/m²/day)
         H(i)_m: number;  // Monthly irradiation on modules (kWh/m²/month)
         SD_m: number;    // Standard deviation of monthly production (kWh)
       }>;
     };
     totals: {
       fixed: {           // Yearly totals and averages
         E_d: number;     // Average daily energy production (kWh/day)
         E_m: number;     // Average monthly energy production (kWh/month)
         E_y: number;     // Average yearly energy production (kWh/year)
         H(i)_d: number;  // Average daily irradiation (kWh/m²/day)
         H(i)_m: number;  // Average monthly irradiation (kWh/m²/month)
         H(i)_y: number;  // Average yearly irradiation (kWh/m²/year)
         SD_m: number;    // Monthly production standard deviation (kWh)
         SD_y: number;    // Yearly production standard deviation (kWh)
         l_aoi: number;   // Angle of incidence losses (%)
         l_spec: string;  // Spectral losses (%)
         l_tg: number;    // Temperature and irradiance losses (%)
         l_total: number; // Total losses (%)
         LCOE_pv?: number; // Levelized cost of electricity (currency/kWh)
       };
     };
   }
   ```

3. `meta`: Contains descriptions and units for all input and output fields
   ```typescript
   {
     inputs: {
       // Detailed descriptions of all input parameters
       // Including units and valid ranges
     };
     outputs: {
       // Detailed descriptions of all output parameters
       // Including units and calculation methods
     };
   }
   ```

The response data structure follows the PVGIS API response format when successful, or includes an error message when the request fails.

## License

ISC 