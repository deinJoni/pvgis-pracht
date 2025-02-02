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

## License

ISC 