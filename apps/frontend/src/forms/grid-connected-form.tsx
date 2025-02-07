"use client"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Info, Loader2 } from "lucide-react"
import {
    setKey,
    setDefaults,
    setLanguage,
    setRegion,
    fromAddress,
    fromLatLng,
    fromPlaceId,
    setLocationType,
    geocode,
    RequestType,
} from "react-geocode";

const formSchema = z.object({
    address: z.string(),
    lat: z.number().min(-90).max(90),
    lon: z.number().min(-180).max(180),
    peakpower: z.number().positive(),
    loss: z.number().min(0).max(100),
    pvtechchoice: z.enum(["crystSi", "CIS", "CdTe", "polySi"]),
    mountingplace: z.enum(["building", "free"]),
    angle: z.number().min(0).max(90),
    aspect: z.number().min(-180).max(180),
    raddatabase: z.enum(["PVGIS-SARAH3", "PVGIS-ERA5"]),
    usehorizon: z.boolean(),
    optimalinclination: z.boolean(),
    optimalangles: z.boolean(),
    pvprice: z.boolean(),
    systemcost: z.number().positive(),
    interest: z.number().min(0).max(100),
    lifetime: z.number().int().min(1).max(50),
})

type FormValues = z.infer<typeof formSchema>

export default function GridConnectedForm() {
    const [isLoading, setIsLoading] = useState(false);
    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            address: "",
            lat: 47.37,
            lon: 8.55,
            peakpower: 5.0,
            loss: 14,
            pvtechchoice: "crystSi",
            mountingplace: "building",
            angle: 35,
            aspect: 0,
            raddatabase: "PVGIS-ERA5",
            usehorizon: true,
            optimalinclination: false,
            optimalangles: false,
            pvprice: true,
            systemcost: 6000,
            interest: 2.5,
            lifetime: 25,
        },
    })
    /* Google Maps API key is set in the environment variables
    useEffect(() => {
        if (!import.meta.env.VITE_GOOGLE_MAPS_API_KEY) {
            console.error('Google Maps API key not found in environment variables');
            return;
        }
        setKey(import.meta.env.VITE_GOOGLE_MAPS_API_KEY);
        setLanguage("de");
        setRegion("de");
    }, []);
    */

    const onSubmit = (data: FormValues) => {
        console.log("submitted")
        const jsonOutput = {
            ...data,
            usehorizon: data.usehorizon ? 1 : 0,
            optimalinclination: data.optimalinclination ? 1 : 0,
            optimalangles: data.optimalangles ? 1 : 0,
            // Only include price-related fields if pvprice is true
            ...(data.pvprice ? {
                systemcost: data.systemcost,
                interest: data.interest,
                lifetime: data.lifetime,
            } : {})
        }
        console.log(JSON.stringify(jsonOutput, null, 2))

        // Here you would typically send this data to your API
    }
    
    /*
    // Use Google API to fetch location from address
    const fetchLocation = async () => {
        geocode(RequestType.ADDRESS, "Eiffel Tower")
            .then(({ results }) => {
                const { lat, lng } = results[0].geometry.location;
                console.log(lat, lng);
            })
            .catch(console.error);
    }
    */

    const fetchLocation = async () => {
        try {
            setIsLoading(true);
            const response = await fetch(`https://api.geoapify.com/v1/geocode/search?text=${form.getValues("address")}&apiKey=${import.meta.env.VITE_GEOAPIFY_API_KEY}`)
            const data = await response.json()
            console.log(data)
            
            if (!data.features || data.features.length < 1) {
                throw new Error("No location found for this address")
            }
            
            const lon = data.features[0].properties.lon
            const lat = data.features[0].properties.lat
            
            form.setValue("lon", lon)
            form.setValue("lat", lat)
        } catch (error) {
            console.error(error)
            // You might want to show this error in the UI
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <TooltipProvider>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    <div className="flex flex-row gap-2">
                        <div className="w-3/4">
                            <FormField
                                control={form.control}
                                name="address"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Address</FormLabel>
                                    <FormControl>
                                        <Input
                                            {...field}
                                            onChange={(e) => field.onChange(e.target.value)}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        </div>
                        <Button className="mt-8 w-1/4" type="button" onClick={fetchLocation}>Fetch Location</Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                            control={form.control}
                            name="lat"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Latitude</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Input
                                                type="number"
                                                step="0.01"
                                                placeholder="47.37"
                                                {...field}
                                                onChange={(e) => field.onChange(Number.parseFloat(e.target.value))}
                                                disabled={isLoading}
                                            />
                                            {isLoading && (
                                                <Loader2 className="h-4 w-4 animate-spin absolute right-3 top-3" />
                                            )}
                                        </div>
                                    </FormControl>
                                    <FormDescription>Example: 47.37 for Zurich</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="lon"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Longitude</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Input
                                                type="number"
                                                step="0.01"
                                                placeholder="8.55"
                                                {...field}
                                                onChange={(e) => field.onChange(Number.parseFloat(e.target.value))}
                                                disabled={isLoading}
                                            />
                                            {isLoading && (
                                                <Loader2 className="h-4 w-4 animate-spin absolute right-3 top-3" />
                                            )}
                                        </div>
                                    </FormControl>
                                    <FormDescription>Example: 8.55 for Zurich</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <FormField
                        control={form.control}
                        name="peakpower"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Installed PV Power (kWp)</FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        step="0.1"
                                        placeholder="5.0"
                                        {...field}
                                        onChange={(e) => field.onChange(Number.parseFloat(e.target.value))}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="loss"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>System Loss (%)</FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        min="0"
                                        max="100"
                                        step="0.1"
                                        {...field}
                                        onChange={(e) => field.onChange(Number.parseFloat(e.target.value))}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="pvtechchoice"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>PV Technology</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select PV Technology" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="crystSi">Crystalline Silicon</SelectItem>
                                        <SelectItem value="CIS">Thin Film CIS</SelectItem>
                                        <SelectItem value="CdTe">Thin Film CdTe</SelectItem>
                                        <SelectItem value="polySi">Polycrystalline Silicon</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="mountingplace"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Mounting Position</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Mounting Position" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="building">Building-Integrated</SelectItem>
                                        <SelectItem value="free">Free-Standing</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="flex items-end gap-4">
                        <div className="flex-1">
                            <FormField
                                control={form.control}
                                name="angle"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            Panel Tilt Angle (°)
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Info className="h-4 w-4 ml-2 inline-block" />
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>The angle between the PV panels and the horizontal plane. Range: 0-90°</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                min="0"
                                                max="90"
                                                step="0.1"
                                                {...field}
                                                onChange={(e) => field.onChange(Number.parseFloat(e.target.value))}
                                                disabled={form.watch("optimalinclination") || form.watch("optimalangles")}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <FormField
                            control={form.control}
                            name="optimalinclination"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                    <FormControl>
                                        <Checkbox 
                                            checked={field.value} 
                                            onCheckedChange={field.onChange}
                                            disabled={form.watch("optimalangles")}
                                        />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                        <FormLabel>Optimize Tilt</FormLabel>
                                    </div>
                                </FormItem>
                            )}
                        />
                    </div>

                    <div className="flex items-end gap-4">
                        <div className="flex-1">
                            <FormField
                                control={form.control}
                                name="aspect"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            Panel Azimuth (°)
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Info className="h-4 w-4 ml-2 inline-block" />
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>0° = South, 90° = West, -90° = East</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                min="-180"
                                                max="180"
                                                step="0.1"
                                                {...field}
                                                onChange={(e) => field.onChange(Number.parseFloat(e.target.value))}
                                                disabled={form.watch("optimalangles")}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <FormField
                            control={form.control}
                            name="optimalangles"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                    <FormControl>
                                        <Checkbox checked={field.value} onCheckedChange={(checked) => {
                                            field.onChange(checked);
                                            if (checked) {
                                                form.setValue("optimalinclination", false);
                                            }
                                        }} />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                        <FormLabel>Optimize Tilt & Azimuth</FormLabel>
                                    </div>
                                </FormItem>
                            )}
                        />
                    </div>

                    <FormField
                        control={form.control}
                        name="raddatabase"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Solar Radiation Database</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Solar Radiation Database" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="PVGIS-SARAH3">PVGIS-SARAH3</SelectItem>
                                        <SelectItem value="PVGIS-ERA5">PVGIS-ERA5</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <FormField
                            control={form.control}
                            name="usehorizon"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                    <FormControl>
                                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                        <FormLabel>Include Horizon</FormLabel>
                                    </div>
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="pvprice"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                    <FormControl>
                                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                        <FormLabel>Calculate Price</FormLabel>
                                    </div>
                                </FormItem>
                            )}
                        />
                    </div>

                    {form.watch("pvprice") && (
                        <div className="space-y-8">
                            <FormField
                                control={form.control}
                                name="systemcost"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>System Cost</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                step="100"
                                                placeholder="Enter cost in your currency"
                                                {...field}
                                                onChange={(e) => field.onChange(Number.parseFloat(e.target.value))}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="interest"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Annual Interest Rate (%)</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                min="0"
                                                max="100"
                                                step="0.1"
                                                {...field}
                                                onChange={(e) => field.onChange(Number.parseFloat(e.target.value))}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="lifetime"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>System Lifetime (Years)</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                min="1"
                                                max="50"
                                                step="1"
                                                {...field}
                                                onChange={(e) => field.onChange(Number.parseInt(e.target.value, 10))}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    )}

                    <Button type="submit">Submit</Button>
                </form>
            </Form>
        </TooltipProvider>
    )
}

