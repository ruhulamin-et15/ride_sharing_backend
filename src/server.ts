import { Server } from "http";
import app from "./app";
import config from "./config";
import { setupWebSocketServer } from "./app/modules/socket/socket";

let server: Server;
async function main() {
  server = app.listen(config.port, () => {
    console.log("✅ Server is running on port", config.port || 8001);
  });

  setupWebSocketServer(server);

  const exitHandler = () => {
    if (server) {
      server.close(() => {
        console.info("Server closed!");
      });
    }
    process.exit(1);
  };
  process.on("uncaughtException", (error) => {
    console.log(error);
    exitHandler();
  });

  process.on("unhandledRejection", (error) => {
    console.log(error);
    exitHandler();
  });
}

main();
