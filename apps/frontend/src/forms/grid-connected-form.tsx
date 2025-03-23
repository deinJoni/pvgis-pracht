"use client"
import { useState } from "react"
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
import { PVGISResultsDialog } from "@/components/pvgis-results-dialog"

const formSchema = z.object({
    address: z.string().min(1, "Address is required"),
    peakpower: z.coerce.number().min(0.1).default(1),
    loss: z.coerce.number().min(-100).max(100).default(14),
    pvtechchoice: z.string().default("crystSi"),
    mountingplace: z.string().default("free"),
    angle: z.coerce.number().min(0).max(90).default(35),
    aspect: z.coerce.number().min(-180).max(180).default(0),
    usehorizon: z.boolean().default(true),
    optimalinclination: z.boolean().default(false),
    optimalangles: z.boolean().default(false),
    pvprice: z.boolean().default(false),
    systemcost: z.coerce.number().optional(),
    interest: z.coerce.number().optional(),
    lifetime: z.coerce.number().optional(),
})

type FormValues = z.infer<typeof formSchema>

export default function GridConnectedForm() {
    const [isLoading, setIsLoading] = useState(false);
    const [resultsOpen, setResultsOpen] = useState(false);
    const [results, setResults] = useState<any>(null);
    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            address: "",
            peakpower: 5.0,
            loss: 14,
            pvtechchoice: "crystSi",
            mountingplace: "building",
            angle: 35,
            aspect: 0,
            usehorizon: false,
            optimalinclination: false,
            optimalangles: false,
            pvprice: false,
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

    const onSubmit = async (data: FormValues) => {
        try {
            setIsLoading(true);
            
            // First get coordinates from address
            const geoResponse = await fetch(`https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(data.address)}&apiKey=${import.meta.env.VITE_GEOAPIFY_API_KEY}`)
            const geoData = await geoResponse.json()
            
            if (!geoData.features || geoData.features.length < 1) {
                throw new Error("No location found for this address")
            }
            
            const location = geoData.features[0]
            const lon = location.properties.lon
            const lat = location.properties.lat
            const formattedAddress = location.properties.formatted

            const jsonOutput = {
                lat,
                lon,
                peakpower: form.getValues("peakpower"),
                loss: form.getValues("loss"),
                pvtechchoice: form.getValues("pvtechchoice"),
                mountingplace: form.getValues("mountingplace"),
                angle: form.getValues("angle"),
                aspect: form.getValues("aspect"),
                raddatabase: "PVGIS-SARAH3",
                usehorizon: form.getValues("usehorizon") ? 1 : 0,
                optimalinclination: form.getValues("optimalinclination") ? 1 : 0,
                optimalangles: form.getValues("optimalangles") ? 1 : 0,
                pvprice: form.getValues("pvprice") ? 1 : 0,
                ...(form.getValues("pvprice") ? {
                    systemcost: form.getValues("systemcost"),
                    interest: form.getValues("interest"),
                    lifetime: form.getValues("lifetime"),
                } : {})
            }
            console.log(jsonOutput)
            const response = await fetch("http://localhost:3000/api/pv-calc", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(jsonOutput),
            })
            const res = await response.json()
            console.log('API Response:', res)
            
            if (res.status === 'error') {
                throw new Error(res.message)
            }
            
            // Add the formatted address to the results
            if (res.data && res.data.inputs && res.data.inputs.location) {
                res.data.inputs.location.address = formattedAddress;
            } else {
                // If the response structure is different, create it
                res.data = {
                    ...res.data,
                    inputs: {
                        ...res.data?.inputs,
                        location: {
                            address: formattedAddress,
                            latitude: lat,
                            longitude: lon
                        }
                    }
                };
            }
            
            setResults(res);
            setResultsOpen(true);
        } catch (error) {
            console.error(error)
            // You might want to show this error in the UI
        } finally {
            setIsLoading(false);
        }
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

    return (
        <TooltipProvider>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Address</FormLabel>
                                <FormControl>
                                    <Input
                                        {...field}
                                        placeholder="Enter full address"
                                    />
                                </FormControl>
                                <FormDescription>Enter a complete address (e.g., street, city, country)</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    </div>

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
                                        <SelectItem value="Unknown">Unknown</SelectItem>
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

                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Calculating...
                            </>
                        ) : (
                            'Calculate'
                        )}
                    </Button>
                </form>
            </Form>
            {results && (
                <PVGISResultsDialog
                    isOpen={resultsOpen}
                    onOpenChange={setResultsOpen}
                    results={results}
                />
            )}
        </TooltipProvider>
    )
}

