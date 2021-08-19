import { CoinChange, Operation as IOperation, SigningPayload } from "types";

export interface Metadata {
  [key: string]: any;
}
export class Block {
  block_identifier: BlockIdentifier;
  parent_block_identifier: BlockIdentifier;
  timestamp: number;
  transactions: Transaction[];
  metadata?: Metadata;
  constructor(
    block_identifier: BlockIdentifier,
    parent_block_identifier: BlockIdentifier,
    timestamp: number,
    transactions: Transaction[] = [],
    metadata?: Metadata
  ) {
    this.block_identifier = block_identifier;
    this.parent_block_identifier = parent_block_identifier;
    this.timestamp = timestamp;
    this.transactions = transactions;
    this.metadata = metadata;
  }
}

export class BlockIdentifier {
  index: number;
  hash: string;
  constructor(index: number, hash: string) {
    this.index = index;
    this.hash = hash;
  }
}

export class BlockResponse {
  block?: Block;
  other_transactions?: TransactionIdentifier[];
  constructor(block: Block, other_transactions: TransactionIdentifier[] = []) {
    this.block = block;
    this.other_transactions = other_transactions;
  }
}
export class Transaction {
  transaction_identifier: TransactionIdentifier;
  operations: Operation[];
  //related_transactions?: RelatedTransaction[];
  //metadata?: Metadata;
  constructor(
    transaction_identifier: TransactionIdentifier,
    operations: Operation[]
  ) {
    this.transaction_identifier = transaction_identifier;
    this.operations = operations;
  }
}

/* class RelatedTransaction {
  network_identifier: NetworkIdentifier;
  transaction_identifier: TransactionIdentifier;
  direction: Direction;
} */

export type Direction = "forward" | "backward";

export class TransactionIdentifier {
  hash: string;
  constructor(hash: string) {
    this.hash = hash;
  }
}
export class Operation {
  operation_identifier: OperationIdentifier;
  related_operations?: OperationIdentifier[];
  type: string;
  status?: string;
  account?: AccountIdentifier;
  amount?: Amount;
  coin_change?: CoinChange;
  metadata?: Metadata;
  static constructFromObject(obj: IOperation): Operation {
    const keys = Object.keys(obj);
    let operation = {};
    keys.forEach((key) => (operation[key] = obj[key]));
    return operation as Operation;
  }
}
export class AccountIdentifier {
  address: string;
  sub_account?: SubAccountIdentifier;
  metadata?: Metadata;
  constructor(
    address: string,
    sub_account?: SubAccountIdentifier,
    metadata?: Metadata
  ) {
    this.address = address;
    this.sub_account = sub_account;
    this.metadata = metadata;
  }
}
export class SubAccountIdentifier {
  address: string;
  metadata?: Metadata;
  constructor(address: string, metadata?: Metadata) {
    this.address = address;
    this.metadata = metadata;
  }
}
export class Amount {
  value: string;
  currency: Currency;
  metadata?: Metadata;
  constructor(value: string, currency: Currency, metadata?: Metadata) {
    this.value = value;
    this.currency = currency;
    this.metadata = metadata;
  }
}
export class OperationIdentifier {
  index: number;
  network_index?: number;
  constructor(index: number, network_index?: number) {
    this.index = index;
    this.network_index = network_index;
  }
}
export class OperationStatus {
  status: string;
  successful: boolean;
  constructor(status: string, successful: boolean) {
    this.status = status;
    this.successful = successful;
  }
}
export class AccountBalanceResponse {
  block_identifier: BlockIdentifier;
  balances: Amount[];
  metadata?: Metadata;
  constructor(
    block_identifier: BlockIdentifier,
    balances: Amount[],
    metadata?: Metadata
  ) {
    this.block_identifier = block_identifier;
    this.balances = balances;
    this.metadata = metadata;
  }
}

export class NetworkListResponse {
  network_identifiers: NetworkIdentifier[];
  constructor(network_identifiers: NetworkIdentifier[]) {
    this.network_identifiers = network_identifiers;
  }
}

export class NetworkIdentifier {
  // network.js (SubstrateNetworkIdentifier)
  blockchain: string;
  network: string;
}
export class NetworkOptionsResponse {
  version: Version;
  allow: Allow;
  constructor(version: Version, allow: Allow) {
    this.version = version;
    this.allow = allow;
  }
}
export interface Peer {
  peer_id: string;
  metadata?: Metadata;
}
export class NetworkStatusResponse {
  current_block_identifier: BlockIdentifier;
  current_block_timestamp: number;
  genesis_block_identifier: BlockIdentifier;
  oldest_block_identifier?: BlockIdentifier;
  sync_status?;
  peers: Peer[];
  constructor(
    current_block_identifier: BlockIdentifier,
    current_block_timestamp: number,
    genesis_block_identifier: BlockIdentifier,
    peers: Peer[]
  ) {
    this.current_block_identifier = current_block_identifier;
    this.current_block_timestamp = current_block_timestamp;
    this.genesis_block_identifier = genesis_block_identifier;
    this.peers = peers;
  }
}

export class Version {
  rosetta_version: string;
  node_version: string;
  middleware_version?: string;
  metadata?: Metadata;
  constructor(
    rosetta_version: string,
    node_version: string,
    middleware_version?: string,
    metadata?: Metadata
  ) {
    this.rosetta_version = rosetta_version;
    this.node_version = node_version;
    this.middleware_version = middleware_version;
    this.metadata = metadata;
  }
}
export class Allow {
  operation_statuses: OperationStatus[];
  operation_types: string[];
  errors: Error[];
  /* historical_balance_lookup?;
  timestamp_start_index?;
  call_methods;
  balance_exemptions;
  mempool_coins; */
  constructor(
    operation_statuses: OperationStatus[],
    operation_types: string[],
    errors: Error[]
  ) {
    this.operation_statuses = operation_statuses;
    this.operation_types = operation_types;
    this.errors = errors;
  }
}

export class Error {
  code: number;
  message: string;
  retriable: boolean;
  description?: string;
  details?: { [key: string]: any };
  constructor(
    code: number,
    message: string,
    retriable?: boolean,
    description?: string
  ) {
    this.code = code;
    this.message = message;
    this.retriable = retriable;
    this.description = description;
  }
}

export class ConstructionMetadataResponse {
  metadata: Metadata;
  constructor(metadata: Metadata) {
    this.metadata = metadata;
  }
}
export class TransactionIdentifierResponse {
  transaction_identifier: TransactionIdentifier;
  metadata?: Metadata;
  constructor(
    transaction_identifier: TransactionIdentifier,
    metadata?: Metadata
  ) {
    this.transaction_identifier = transaction_identifier;
    this.metadata = metadata;
  }
}

export class ConstructionCombineResponse {
  signed_transaction: string;
  constructor(signed_transaction: string) {
    this.signed_transaction = signed_transaction;
  }
}

export class ConstructionDeriveResponse {
  address?: string;
  account_identifier?: AccountIdentifier;
  metadata?: {
    [key: string]: any;
  };
  constructor(
    address?: string,
    account_identifier?: AccountIdentifier,
    metadata?: Metadata
  ) {
    this.address = address;
    this.account_identifier = account_identifier;
    this.metadata = metadata;
  }
}

export class ConstructionParseResponse {
  operations: Operation[];
  signers?: string[];
  account_identifier_signers?: AccountIdentifier[];
  metadata?: Metadata;
  constructor(
    operations: Operation[],
    signers?: string[],
    account_identifier_signers?: AccountIdentifier[],
    metadata?: Metadata
  ) {
    this.operations = operations;
    this.signers = signers;
    this.account_identifier_signers = account_identifier_signers;
    this.metadata = metadata;
  }
}

export class ConstructionPayloadsResponse {
  unsigned_transaction: string;
  payloads: SigningPayload[];
  constructor(unsigned_transaction: string, payloads: SigningPayload[]) {
    this.unsigned_transaction = unsigned_transaction;
    this.payloads = payloads;
  }
}

export class ConstructionPreprocessResponse {
  options?: {
    [key: string]: any;
  };
  required_public_keys?: AccountIdentifier[];
  constructor(
    options?: {
      [key: string]: any;
    },
    required_public_keys?: AccountIdentifier[]
  ) {
    this.options = options;
    this.required_public_keys = required_public_keys;
  }
}

export class MempoolResponse {
  transaction_identifiers: TransactionIdentifier[];
  constructor(transaction_identifiers: TransactionIdentifier[]) {
    this.transaction_identifiers = transaction_identifiers;
  }
}

export class MempoolTransactionResponse {
  transaction: Transaction;
  metadata?: Metadata;
  constructor(transaction: Transaction, metadata?: Metadata) {
    this.transaction = transaction;
    this.metadata = metadata;
  }
}

export class BlockTransactionResponse {
  transaction: Transaction;
  metadata?: Metadata;
  constructor(
    transaction: Transaction = {} as Transaction,
    metadata?: Metadata
  ) {
    this.transaction = transaction;
    this.metadata = metadata;
  }
}

export class Currency {
  symbol: string;
  decimals: number;
  metadata?: Metadata;
  constructor(symbol: string, decimals: number, metadata?: Metadata) {
    this.symbol = symbol;
    this.decimals = decimals;
    this.metadata = metadata;
  }
}
