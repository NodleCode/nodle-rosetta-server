import { Server as RosettaServer, Asserter } from "rosetta-typescript-sdk";

import * as ServiceHandlers from "./services";
import { networkIdentifier } from "./network";

import { OpenApiConfig } from "rosetta-typescript-sdk/src/types";

const asserter = Asserter.NewServer(["Transfer", "Reward"], false, [
  networkIdentifier,
]);
/* Create a server configuration */
const Server = new RosettaServer({
  URL_PORT: 8080,
} as OpenApiConfig);

// Register global asserter
Server.useAsserter(asserter);

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

/* Data API: Block */
Server.register("/block", ServiceHandlers.Block.block);
Server.register("/block/transaction", ServiceHandlers.Block.blockTransaction);

/* Data API: Account */
Server.register("/account/balance", ServiceHandlers.Account.balance);

/* Data API: Mempool */
Server.register("/mempool", ServiceHandlers.Mempool.mempool);
Server.register(
  "/mempool/transaction",
  ServiceHandlers.Mempool.mempoolTransaction
);

Server.launch();
