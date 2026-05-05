import app from "./app";
import { logger } from "./lib/logger";

const rawPort = process.env["PORT"] || "5000";
const port = Number(rawPort);

const startServer = (p: number) => {
  const server = app.listen(p, () => {
    logger.info({ port: p }, "Server listening");
  });

  server.on("error", (err: any) => {
    if (err.code === "EADDRINUSE") {
      logger.warn({ port: p }, "Port already in use, trying next one...");
      startServer(p + 1);
    } else {
      logger.error({ err }, "Error listening on port");
      process.exit(1);
    }
  });
};

startServer(port);
