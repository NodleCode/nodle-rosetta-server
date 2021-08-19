import { ApiPromise, WsProvider } from "@polkadot/api";
import {
  DefinitionRpc,
  DefinitionRpcSub,
  RegistryTypes,
} from "@polkadot/types/types";
import { Currency } from "../client";
import { NetworkRequest } from "types";
import networkIdentifiers, { SubstrateNetworkIdentifier } from "../network";
import Registry from "../offline-signing/registry";

const connections: { [key: string]: SubstrateNetworkConnection } = {};
const registries: { [key: string]: Registry } = {};
const currencies: { [key: string]: Currency } = {};
const isOffline = process.argv.indexOf("--offline") > -1;

class SubstrateNetworkConnection {
  api: ApiPromise;
  nodeAddress: string;
  types?: RegistryTypes;
  rpc?: Record<string, Record<string, DefinitionRpc | DefinitionRpcSub>>;
  constructor({
    nodeAddress,
    types,
    rpc,
  }: {
    nodeAddress: string;
    types?: RegistryTypes;
    rpc?: Record<string, Record<string, DefinitionRpc | DefinitionRpcSub>>;
  }) {
    this.nodeAddress = nodeAddress;
    this.types = types;
    this.rpc = rpc;
  }

  async connect() {
    if (this.api && this.api.isConnected) {
      return this.api;
    }

    this.api = await ApiPromise.create({
      provider: new WsProvider(this.nodeAddress),
      types: this.types,
      rpc: this.rpc,
    });

    return this.api;
  }
}

export function getNetworkCurrencyFromRequest(networkRequest: NetworkRequest) {
  const targetNetworkIdentifier =
    networkRequest?.network_identifier || networkIdentifiers[0];
  const networkIdentifier = getNetworkIdentifier(targetNetworkIdentifier);
  if (networkIdentifier) {
    const { nodeAddress, properties } = networkIdentifier;
    if (!currencies[nodeAddress]) {
      currencies[nodeAddress] = new Currency(
        properties.tokenSymbol,
        properties.tokenDecimals
      );
    }
    return currencies[nodeAddress];
  }
  return null;
}

export function getNetworkIdentifier({
  blockchain,
  network,
}): SubstrateNetworkIdentifier {
  for (let i = 0; i < networkIdentifiers.length; i++) {
    const networkIdentifier = networkIdentifiers[i];
    if (
      blockchain === networkIdentifier.blockchain &&
      network === networkIdentifier.network
    ) {
      return networkIdentifier;
    }
  }

  return null;
}

export function getNetworkIdentifierFromRequest(
  networkRequest: NetworkRequest
): any {
  const targetNetworkIdentifier =
    networkRequest?.network_identifier || networkIdentifiers[0];
  const { blockchain, network } = targetNetworkIdentifier;
  const networkIdentifier = getNetworkIdentifier(targetNetworkIdentifier);
  if (networkIdentifier) {
    return networkIdentifier;
  }
  throw new Error(
    `Can't find network with blockchain and network of: ${blockchain}, ${network}`
  );
}

export async function getNetworkApiFromRequest(
  networkRequest: NetworkRequest
): Promise<ApiPromise> {
  const networkIdentifier = getNetworkIdentifierFromRequest(networkRequest);
  const { api } = await getNetworkConnection(networkIdentifier);
  return api;
}

export async function getNetworkConnection(networkIdentifier) {
  if (isOffline) {
    throw new Error("Server is in offline mode");
  }

  const { nodeAddress } = networkIdentifier;
  if (!connections[nodeAddress]) {
    const connection = new SubstrateNetworkConnection(networkIdentifier);
    connections[nodeAddress] = connection;
    await connection.connect();
  }

  return connections[nodeAddress];
}

export function getNetworkRegistryFromRequest(networkRequest: NetworkRequest) {
  const targetNetworkIdentifier =
    networkRequest.network_identifier || networkIdentifiers[0];
  const networkIdentifier = getNetworkIdentifier(targetNetworkIdentifier);
  const { nodeAddress } = networkIdentifier;
  if (!registries[nodeAddress]) {
    registries[nodeAddress] = new Registry({
      chainInfo: networkIdentifier,
      types: networkIdentifier.types,
      metadata: networkIdentifier.metadataRpc,
    });
  }
  return registries[nodeAddress];
}
