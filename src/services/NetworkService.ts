import {
  NetworkOptionsResponse,
  NetworkRequest,
  NetworkStatusResponse,
  Params,
} from "types";

import { Client } from "rosetta-typescript-sdk";
const Types = Client;

import { networkIdentifier } from "../network";

/* Data API: Network */

/**
 * Get List of Available Networks
 * This endpoint returns a list of NetworkIdentifiers that the Rosetta server can handle.
 *
 * metadataRequest MetadataRequest
 * returns NetworkListResponse
 * */
export const networkList = async (params) => {
  const { metadataRequest } = params;

  return new Types.NetworkListResponse([networkIdentifier]);
};

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

  const rosettaVersion = "1.4.0";
  const nodeVersion = "0.0.1";

  const operationStatuses = [
    new Types.OperationStatus("Success", true),
    new Types.OperationStatus("Reverted", false),
  ];

  const operationTypes = ["Transfer", "Reward"];

  const errors = [new Types.Error(1, "not implemented", false)];
  return {
    allow: {
      balance_exemptions: [
        {
          currency: { decimals: 1, metadata: {}, symbol: "" },
          exemption_type: "greater_or_equal", // | 'less_or_equal' | 'dynamic',
          sub_account_address: "",
        },
      ],
      call_methods: [""],
      errors: [
        { code: 1, message: "", retriable: true, description: "", details: {} },
      ],
      historical_balance_lookup: true,
      mempool_coins: true,
      operation_statuses: [{ status: "", successful: true }],
      operation_types: [""],
      timestamp_start_index: 1,
    },
    version: {
      node_version: "",
      rosetta_version: "",
      metadata: {},
      middleware_version: "",
    },
  };
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

  const currentBlockIdentifier = new Types.BlockIdentifier(1000, "block 1000");
  const currentBlockTimestamp = 1586483189000;
  const genesisBlockIdentifier = new Types.BlockIdentifier(0, "block 0");
  const peers = [new Types.Peer("peer 1")];
  return {
    current_block_identifier: { hash: "", index: 1 },
    current_block_timestamp: 1,
    genesis_block_identifier: { hash: "", index: 1 },
    peers: [{ peer_id: "", metadata: {} }],
    oldest_block_identifier: { hash: "", index: 1 },
    sync_status: { current_index: 1, stage: "", synced: true, target_index: 1 },
  };
};
