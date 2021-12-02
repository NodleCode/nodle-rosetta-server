import { Server as RosettaServer } from "@nodle/rosetta-typescript-sdk";
import * as ServiceHandlers from "./services";
import { OpenApiConfig } from "types";

/* */
/* Create a server configuration */
const Server = new RosettaServer({
  URL_PORT: process.env.ROSETTA_PORT || 8080,
  URL_PATH: process.env.ROSETTA_HOST || "0.0.0.0",
} as OpenApiConfig);

/* Construction API */
Server.register(
  "/construction/metadata",
  ServiceHandlers.Construction.constructionMetadata
);
Server.register(
  "/construction/submit",
  ServiceHandlers.Construction.constructionSubmit
);
Server.register(
  "/construction/combine",
  ServiceHandlers.Construction.constructionCombine
);
Server.register(
  "/construction/derive",
  ServiceHandlers.Construction.constructionDerive
);
Server.register(
  "/construction/hash",
  ServiceHandlers.Construction.constructionHash
);
Server.register(
  "/construction/parse",
  ServiceHandlers.Construction.constructionParse
);
Server.register(
  "/construction/payloads",
  ServiceHandlers.Construction.constructionPayloads
);
Server.register(
  "/construction/preprocess",
  ServiceHandlers.Construction.constructionPreprocess
);

/* Data API: Network */
Server.register("/network/list", ServiceHandlers.Network.networkList);
Server.register("/network/options", ServiceHandlers.Network.networkOptions);
Server.register("/network/status", ServiceHandlers.Network.networkStatus);

/* Data API: Block */
Server.register("/block", ServiceHandlers.Block.block);
Server.register("/block/transaction", ServiceHandlers.Block.blockTransaction);

Server.register("/network/list", ServiceHandlers.Network.networkList);
Server.register("/network/options", ServiceHandlers.Network.networkOptions);
Server.register("/network/status", ServiceHandlers.Network.networkStatus);

/* Data API: Account */
Server.register("/account/balance", ServiceHandlers.Account.accountBalance);
Server.register("/account/coins", ServiceHandlers.Account.accountCoins);

/* Data API: Mempool */
Server.register("/mempool", ServiceHandlers.Mempool.mempool);
Server.register(
  "/mempool/transaction",
  ServiceHandlers.Mempool.mempoolTransaction
);

Server.expressServer.app.use((req, res, next) => {
  res.setHeader("Content-Type", "application/json");
  next();
});

async function main() {
  await Server.launch();
}

main();
