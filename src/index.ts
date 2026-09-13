import { SwiggySyndicateServer } from "./server/mcp-server";

async function main() {
  const server = new SwiggySyndicateServer();
  await server.run();
}

main().catch((err) => {
  console.error("Fatal error starting Swiggy Syndicate server:", err);
  process.exit(1);
});
