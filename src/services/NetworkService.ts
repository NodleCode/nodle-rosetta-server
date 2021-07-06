import { NetworkRequest, Params } from "types";
import extrinsicOpMap from "../utils/extrinsic-operation-map";
import networkIdentifiers from "../network";
import { getNetworkApiFromRequest } from "../utils/connections";
import { errorTypes } from "../utils/error-types";
import {
  Allow,
  NetworkListResponse,
  NetworkOptionsResponse,
  OperationStatus,
  Version,
  Error,
  BlockIdentifier,
  NetworkStatusResponse,
} from "../client";

// Rosetta API target version
const rosettaVersion = "1.4.10";

// Binary true/false success state for extrinsics
const operationStatuses = [
  new OperationStatus("SUCCESS", true),
  new OperationStatus("FAILURE", false),
];
// List of operation supported types
const operationTypes = Object.keys(extrinsicOpMap).map(
  (key) => extrinsicOpMap[key]
);

/* Data API: Network */

/**
 * Get List of Available Networks
 * This endpoint returns a list of NetworkIdentifiers that the Rosetta server can handle.
 *
 * metadataRequest MetadataRequest
 * returns NetworkListResponse
 * */
/* export const networkList = async (params) => {
  const { body: metadataRequest } = params;

  return {
    network_identifiers: [
      {
        blockchain: "nodle",
        network: "mainnet",
        sub_network_identifier: {
          network: "shard 1",
          metadata: {
            producer: "0x52bc44d5378309ee2abf1539bf71de1b7d7be3b5",
          },
        },
      },
    ],
  };
}; */
export const networkList = async () =>
  new NetworkListResponse(
    networkIdentifiers.map(({ blockchain, network }) => ({
      blockchain,
      network,
    }))
  );
/**
 * Get Network Options
 * This endpoint returns the version information and allowed network-specific types for a NetworkIdentifier. Any NetworkIdentifier returned by /network/list should be accessible here.  Because options are retrievable in the context of a NetworkIdentifier, it is possible to define unique options for each network.
 *
 * networkRequest NetworkRequest
 * returns NetworkOptionsResponse
 * */
export const networkOptions = async (
  params: Params<NetworkRequest>
): Promise<NetworkOptionsResponse> => {
  const { networkRequest } = params;

  // Get api connection
  const api = await getNetworkApiFromRequest(networkRequest);
  const nodeVersion = await api.rpc.system.version();
  const errors = errorTypes.map(
    (error) => new Error(error.code, error.message, error.retriable)
  );

  // Filter duplicte op types
  const opTypes = operationTypes.filter(
    (item, index) => operationTypes.indexOf(item) === index
  );
  return new NetworkOptionsResponse(
    new Version(rosettaVersion, nodeVersion),
    new Allow(operationStatuses, opTypes, errors)
  );
};

/**
 * Get Network Status
 * This endpoint returns the current status of the network requested. Any NetworkIdentifier returned by /network/list should be accessible here.
 *
 * networkRequest NetworkRequest
 * returns NetworkStatusResponse
 * */
export const networkStatus = async (
  params: Params<NetworkRequest>
): Promise<NetworkStatusResponse> => {
  const { networkRequest } = params;
  // Get api connection
  const api = await getNetworkApiFromRequest(networkRequest);

  // Get block info
  const genesisBlockIndex = 0;
  const currentBlockTimestamp = (await api.query.timestamp.now()).toNumber();
  const genesisBlockHash = await api.rpc.chain.getBlockHash(genesisBlockIndex);
  const currentBlock = await api.rpc.chain.getBlock();

  // Format into correct types
  const currentBlockIdentifier = new BlockIdentifier(
    currentBlock.block.header.number,
    currentBlock.block.header.hash.toHex()
  );
  const genesisBlockIdentifier = new BlockIdentifier(
    genesisBlockIndex,
    genesisBlockHash
  );

  // Dont need any peers for now, format response
  const peers = [];
  return new NetworkStatusResponse(
    currentBlockIdentifier,
    currentBlockTimestamp,
    genesisBlockIdentifier,
    peers
  );
};
