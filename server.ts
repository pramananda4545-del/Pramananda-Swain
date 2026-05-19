import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // International Payment API (Mocked for demo)
  app.post("/api/payments/process", (req, res) => {
    const { amount, currency, method, bookingId } = req.body;
    console.log(`Processing international payment of ${amount} ${currency || 'USD'} via ${method} for booking ${bookingId}`);
    // Simulate multi-currency gateway processing
    setTimeout(() => {
      res.json({ 
        success: true, 
        transactionId: `INTL_TXN_${Math.random().toString(36).substr(2, 9)}`,
        gateway: 'Servi Global Pay'
      });
    }, 1200);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
