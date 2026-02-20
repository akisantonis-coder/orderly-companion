import express from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse).substring(0, 80)}`;
      }
      log(logLine);
    }
  });

  next();
});

(async () => {
  console.log("[Server] Starting server...");
  console.log("[Server] NODE_ENV:", process.env.NODE_ENV || "development");
  console.log("[Server] DATABASE_URL:", process.env.DATABASE_URL ? `Set (${process.env.DATABASE_URL.length} chars)` : "NOT SET");
  
  registerRoutes(app);

  // Catch-all 404 handler για οποιοδήποτε /api/* route δεν ταιριάζει σε κανένα endpoint
  app.use("/api", (req, res) => {
    if (res.headersSent) return;
    console.error(
      "[Server] 404 API route not found:",
      req.method,
      req.originalUrl
    );
    res.status(404).json({
      error: "API route not found",
      path: req.originalUrl,
    });
  });

  const PORT = process.env.PORT || 5000;
  const server = app.listen({
    port: PORT,
    host: "0.0.0.0",
  }, () => {
    console.log(`[Server] Express server listening on port ${PORT}`);
  });

  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    console.error("[Server] Unhandled error:", err);
    console.error("[Server] Error stack:", err?.stack);
    res.status(status).json({ 
      message,
      error: process.env.NODE_ENV === 'development' ? err?.message : undefined,
      stack: process.env.NODE_ENV === 'development' ? err?.stack : undefined
    });
    if (process.env.NODE_ENV === 'development') {
      throw err;
    }
  });

  // Στο development, πάντα χρησιμοποιούμε Vite (ακόμα και στο Replit)
  const isDevelopment = process.env.NODE_ENV !== "production";
  if (isDevelopment) {
    console.log("[Server] Setting up Vite middleware...");
    await setupVite(app, server);
  } else {
    console.log("[Server] Serving static files...");
    serveStatic(app);
  }

  log(`serving on port ${PORT}`);
})();
