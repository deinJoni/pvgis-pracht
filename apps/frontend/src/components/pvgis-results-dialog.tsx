"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"

interface PVGISResultsDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  results: {
    status: string
    data: {
      inputs: {
        location: {
          latitude: number
          longitude: number
          elevation: number
          address: string
        }
        meteo_data: {
          radiation_db: string
          meteo_db: string
          year_min: number
          year_max: number
          use_horizon: boolean
          horizon_db: string
        }
        mounting_system: {
          fixed: {
            slope: {
              value: number
              optimal: boolean
            }
            azimuth: {
              value: number
              optimal: boolean
            }
            type: string
          }
        }
        pv_module: {
          technology: string
          peak_power: number
          system_loss: number
        }
        economic_data?: {
          system_cost: number
          interest: number
          lifetime: number
        }
      }
      outputs: {
        monthly: {
          fixed: Array<{
            month: number
            E_d: number
            E_m: number
            "H(i)_d": number
            "H(i)_m": number
            SD_m: number
          }>
        }
        totals: {
          fixed: {
            E_d: number
            E_m: number
            E_y: number
            "H(i)_d": number
            "H(i)_m": number
            "H(i)_y": number
            SD_m: number
            SD_y: number
            l_aoi: number
            l_spec: string
            l_tg: number
            l_total: number
            LCOE_pv?: number
          }
        }
      }
    }
  }
}

export function PVGISResultsDialog({ isOpen, onOpenChange, results }: PVGISResultsDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>PV System Calculation Results</DialogTitle>
          <DialogDescription>
            Detailed results of your PV system calculation including location, system configuration, and production estimates.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Location Information */}
          <div>
            <h3 className="font-semibold mb-2">Location</h3>
            <div className="mb-4">
              <p className="text-sm text-muted-foreground">Address</p>
              <p className="text-lg">{results.data.inputs.location.address}</p>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Latitude</p>
                <p className="text-lg">{results.data.inputs.location.latitude}°</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Longitude</p>
                <p className="text-lg">{results.data.inputs.location.longitude}°</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Elevation</p>
                <p className="text-lg">{results.data.inputs.location.elevation} m</p>
              </div>
            </div>
          </div>

          {/* System Configuration */}
          <div>
            <h3 className="font-semibold mb-2">System Configuration</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">PV Technology</p>
                <p className="text-lg">{results.data.inputs.pv_module.technology}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Peak Power</p>
                <p className="text-lg">{results.data.inputs.pv_module.peak_power} kWp</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">System Loss</p>
                <p className="text-lg">{results.data.inputs.pv_module.system_loss}%</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Mounting Type</p>
                <p className="text-lg">{results.data.inputs.mounting_system.fixed.type}</p>
              </div>
            </div>
          </div>

          {/* Monthly Production */}
          <div>
            <h3 className="font-semibold mb-2">Monthly Production</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Month</th>
                    <th className="text-right py-2">Daily Energy (kWh)</th>
                    <th className="text-right py-2">Monthly Energy (kWh)</th>
                    <th className="text-right py-2">Daily Irradiation (kWh/m²)</th>
                    <th className="text-right py-2">Monthly Irradiation (kWh/m²)</th>
                  </tr>
                </thead>
                <tbody>
                  {results.data.outputs.monthly.fixed.map((month) => (
                    <tr key={month.month} className="border-b">
                      <td className="py-2">{month.month}</td>
                      <td className="text-right">{month.E_d.toFixed(2)}</td>
                      <td className="text-right">{month.E_m.toFixed(2)}</td>
                      <td className="text-right">{month["H(i)_d"].toFixed(2)}</td>
                      <td className="text-right">{month["H(i)_m"].toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Annual Totals */}
          <div>
            <h3 className="font-semibold mb-2">Annual Totals</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Yearly Energy Production</p>
                <p className="text-lg">{results.data.outputs.totals.fixed.E_y.toFixed(2)} kWh</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Yearly Irradiation</p>
                <p className="text-lg">{results.data.outputs.totals.fixed["H(i)_y"].toFixed(2)} kWh/m²</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total System Losses</p>
                <p className="text-lg">{results.data.outputs.totals.fixed.l_total.toFixed(2)}%</p>
              </div>
            </div>
          </div>

          {/* Economic Data */}
          {results.data.inputs.economic_data && results.data.outputs.totals.fixed.LCOE_pv && (
            <div>
              <h3 className="font-semibold mb-2">Economic Analysis</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">System Cost</p>
                  <p className="text-lg">{results.data.inputs.economic_data.system_cost}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Interest Rate</p>
                  <p className="text-lg">{results.data.inputs.economic_data.interest}%</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">System Lifetime</p>
                  <p className="text-lg">{results.data.inputs.economic_data.lifetime} years</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">LCOE</p>
                  <p className="text-lg">{results.data.outputs.totals.fixed.LCOE_pv.toFixed(3)} per kWh</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
} 