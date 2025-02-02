import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export interface BaseFormProps {
  onSubmit: (data: any) => void
  children?: React.ReactNode
}

export function BaseFormPVGIS({ onSubmit, children }: BaseFormProps) {
  const [latitude, setLatitude] = useState("")
  const [longitude, setLongitude] = useState("")
  const [useHorizon, setUseHorizon] = useState(false)
  const [userHorizon, setUserHorizon] = useState("")
  const [database, setDatabase] = useState("")
  const [outputFormat, setOutputFormat] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      latitude,
      longitude,
      useHorizon,
      userHorizon: useHorizon ? userHorizon.split(",").map(Number) : undefined,
      database,
      outputFormat,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="latitude">Latitude</Label>
          <Input
            id="latitude"
            type="number"
            step="any"
            required
            value={latitude}
            onChange={(e) => setLatitude(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="longitude">Longitude</Label>
          <Input
            id="longitude"
            type="number"
            step="any"
            required
            value={longitude}
            onChange={(e) => setLongitude(e.target.value)}
          />
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <Switch id="useHorizon" checked={useHorizon} onCheckedChange={setUseHorizon} />
        <Label htmlFor="useHorizon">Use horizon calculation</Label>
      </div>
      {useHorizon && (
        <div>
          <Label htmlFor="userHorizon">User horizon (comma-separated degrees)</Label>
          <Input id="userHorizon" value={userHorizon} onChange={(e) => setUserHorizon(e.target.value)} />
        </div>
      )}
      <div>
        <Label htmlFor="database">Radiation database</Label>
        <Select value={database} onValueChange={setDatabase}>
          <SelectTrigger>
            <SelectValue placeholder="Select database" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="PVGIS-SARAH">PVGIS-SARAH</SelectItem>
            <SelectItem value="PVGIS-SARAH2">PVGIS-SARAH2</SelectItem>
            <SelectItem value="PVGIS-ERA5">PVGIS-ERA5</SelectItem>
            <SelectItem value="PVGIS-COSMO">PVGIS-COSMO</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="outputFormat">Output format</Label>
        <Select value={outputFormat} onValueChange={setOutputFormat}>
          <SelectTrigger>
            <SelectValue placeholder="Select output format" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="json">JSON</SelectItem>
            <SelectItem value="csv">CSV</SelectItem>
            <SelectItem value="basic">Basic</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {children}
      <Button type="submit">Calculate</Button>
    </form>
  )
}

