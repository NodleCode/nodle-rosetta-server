import {
  NetworkOptionsResponse,
  NetworkRequest,
  NetworkStatusResponse,
  Params,
} from "rosetta-typescript-sdk/src/types";

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

  return new Types.NetworkOptionsResponse(
    new Types.Version(rosettaVersion, nodeVersion),
    new Types.Allow(operationStatuses, operationTypes, errors)
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

  const currentBlockIdentifier = new Types.BlockIdentifier(1000, "block 1000");
  const currentBlockTimestamp = 1586483189000;
  const genesisBlockIdentifier = new Types.BlockIdentifier(0, "block 0");
  const peers = [new Types.Peer("peer 1")];

  return new Types.NetworkStatusResponse(
    currentBlockIdentifier,
    currentBlockTimestamp,
    genesisBlockIdentifier,
    peers
  );
};
