import { Client } from "@nodle/rosetta-typescript-sdk";
export const networkIdentifier = new Client.NetworkIdentifier(
  "Rosetta",
  "Testnet"
);

import * as RosettaSDK from "@nodle/rosetta-typescript-sdk";
import fs from "fs";
import { ApiPromise, WsProvider } from "@polkadot/api";

// Networks folder relative to execution publicPath
const networksFolder = "./networks";

interface IdentifierProperties {
  ss58Format?: number;
  tokenDecimals?: number;
  tokenSymbol?: string;
  poaModule?: {
    treasury?: string;
  };
}

interface NetworkIdentifierProps {
  blockchain: string;
  network: string;
  nodeAddress: string;
  ss58Format: number;
  properties: IdentifierProperties;
  genesis: string;
  name: string;
  specName: string;
  specVersion: number;
  transactionVersion: any;
  types: any;
  metadataRpc: any;
}
// Extend MetworkIdentifier class to set properties direct from object
export class SubstrateNetworkIdentifier extends RosettaSDK.Client
  .NetworkIdentifier {
  blockchain: string;
  network: string;
  nodeAddress: string;
  ss58Format: number;
  properties: IdentifierProperties;
  genesis: string;
  name: string;
  specName: string;
  specVersion: number;
  transactionVersion: any;
  types: any;
  metadataRpc: any;

  constructor({
    blockchain,
    network,
    nodeAddress,
    ss58Format,
    properties,
    genesis,
    name,
    specName,
    specVersion,
    transactionVersion,
    types = {},
    metadataRpc,
  }: NetworkIdentifierProps) {
    super(blockchain, network);
    this.blockchain = blockchain;
    this.network = network;
    this.nodeAddress = nodeAddress;
    this.ss58Format = ss58Format;
    this.properties = properties;
    this.genesis = genesis;
    this.name = name;
    this.specName = specName;
    this.specVersion = specVersion;
    this.transactionVersion = transactionVersion;
    this.types = types;
    this.metadataRpc = metadataRpc;
  }
}

// Load networks
const networks: SubstrateNetworkIdentifier[] = [];
fs.readdir(networksFolder, async (error, files) => {
  if (error) {
    console.error(error);
  } else {
    for (const file of files) {
      // Ensure file has .js extension in it, for either .js or .json
      if (file.indexOf(".js") > -1) {
        const data: NetworkIdentifierProps = require(`.${networksFolder}/${file}`);
        networks.push(new SubstrateNetworkIdentifier(data));
      }
    }
  }
});

export default networks;
