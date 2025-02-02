import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from 'hono/cors'
import { PVGIS_API_BASE_URL, PVCalcParams, PVGISCalcResponse, PVGISResponse, PVGISEndpoint } from '@pvgis-pracht/shared/types';

const app = new Hono();

// Enable CORS for frontend
app.use('/*', cors())

// Test endpoints
app.get("/", (c) => c.json({ message: "Hello from PVGIS Pracht API!" }));
app.get("/health", (c) => c.json({ status: "ok", timestamp: new Date().toISOString() }));

// PVGIS API endpoints
app.post("/api/pv-calc", async (c) => {
  try {
    const body = await c.req.json<PVCalcParams>();
    const params = new URLSearchParams();

    // Add all parameters to the URL
    Object.entries(body).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          params.append(key, value.join(','));
        } else {
          params.append(key, value.toString());
        }
      }
    });

    // Add outputformat=json to ensure JSON response
    params.append('outputformat', 'json');

    // Call PVGIS API
    const response = await fetch(`${PVGIS_API_BASE_URL}/${PVGISEndpoint.PVCalc}?${params.toString()}`);
    const contentType = response.headers.get('content-type');
    
    if (!response.ok) {
      const errorText = await response.text();
      return c.json<PVGISResponse<never>>({ 
        status: 'error', 
        message: errorText 
      });
    }

    if (contentType?.includes('application/json')) {
      const data = await response.json() as PVGISCalcResponse;
      return c.json<PVGISResponse<PVGISCalcResponse>>({ 
        status: 'success', 
        data 
      });
    } else {
      const text = await response.text();
      return c.json<PVGISResponse<never>>({ 
        status: 'error', 
        message: `Unexpected non-JSON response: ${text}`
      });
    }
  } catch (error) {
    return c.json<PVGISResponse<never>>({ 
      status: 'error', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// Start the server
const port = 3000;
console.log(`Server is running on port ${port}`);

serve({
  fetch: app.fetch,
  port
});
