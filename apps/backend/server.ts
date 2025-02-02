import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from 'hono/cors'

const app = new Hono();

// Enable CORS for frontend
app.use('/*', cors())

// Test endpoints
app.get("/", (c) => c.json({ message: "Hello from PVGIS Pracht API!" }));
app.get("/health", (c) => c.json({ status: "ok", timestamp: new Date().toISOString() }));

// Start the server
const port = 3000;
console.log(`Server is running on port ${port}`);

serve({
  fetch: app.fetch,
  port
});
