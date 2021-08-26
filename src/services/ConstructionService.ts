import {
  ConstructionCombineRequest,
  ConstructionDeriveRequest,
  ConstructionHashRequest,
  ConstructionMetadataRequest,
  ConstructionParseRequest,
  ConstructionPayloadsRequest,
  ConstructionPreprocessRequest,
  ConstructionSubmitRequest,
  Params,
  SigningPayload,
} from "types";
import {
  ConstructionMetadataResponse,
  TransactionIdentifierResponse,
  ConstructionCombineResponse,
  ConstructionDeriveResponse,
  ConstructionParseResponse,
  AccountIdentifier,
  Amount,
  OperationIdentifier,
  ConstructionPayloadsResponse,
  ConstructionPreprocessResponse,
  Operation,
} from "../client";
import { Extrinsic, Address } from "@polkadot/types/interfaces";
import BN from "bn.js";
import { decode, getTxHash, UnsignedTransaction } from "@substrate/txwrapper";
import { u8aToHex, hexToU8a, u8aConcat } from "@polkadot/util";
import { signatureVerify, decodeAddress } from "@polkadot/util-crypto";
import { EXTRINSIC_VERSION } from "@polkadot/types/extrinsic/v4/Extrinsic";
import { ERROR_BROADCAST_TRANSACTION, throwError } from "../utils/error-types";
import { publicKeyToAddress } from "../utils/crypto";
import {
  getNetworkApiFromRequest,
  getNetworkRegistryFromRequest,
  getNetworkCurrencyFromRequest,
  getNetworkIdentifierFromRequest,
} from "../utils/connections";
import buildTransferTxn from "../offline-signing/txns";
import Registry from "src/offline-signing/registry";
const sigTypeEnum = {
  ed25519: 0,
  sr25519: 1,
  ecdsa: 2,
};

interface Options {
  registry?: Registry;
  [key: string]: any;
}

function jsonToTx(transaction: string, options: Options = {}) {
  const txParams = JSON.parse(transaction);
  const { unsignedTxn, signingPayload } = buildTransferTxn({
    ...txParams,
    ...options,
    version: EXTRINSIC_VERSION,
  });

  const extrinsic = options.registry.registry.createType(
    "Extrinsic",
    unsignedTxn,
    { version: EXTRINSIC_VERSION, ...unsignedTxn }
  );

  if (txParams.signature) {
    extrinsic.addSignature(
      txParams.signer,
      hexToU8a(txParams.signature),
      signingPayload
    );
  }

  return {
    transaction: unsignedTxn,
    extrinsic,
    signingPayload,
  };
}

/* Data API: Construction */

/**
 * Derive an Address from a PublicKey
 * Derive returns the network-specific address associated with a public key. Blockchains that require an on-chain action to create an account should not implement this method.
 *
 * [OFFLINE]
 * constructionDeriveRequest ConstructionDeriveRequest
 * returns ConstructionDeriveResponse
 * */

export const constructionDerive = async (
  params: Params<ConstructionDeriveRequest>
): Promise<ConstructionDeriveResponse> => {
  const { constructionDeriveRequest } = params;
  const networkIdentifier = getNetworkIdentifierFromRequest(
    constructionDeriveRequest
  );
  const publicKeyHex = `0x${constructionDeriveRequest.public_key.hex_bytes}`;
  const publicKeyType = constructionDeriveRequest.public_key.curve_type;
  const address = await publicKeyToAddress(
    publicKeyHex,
    publicKeyType,
    networkIdentifier.properties.ss58Format
  );
  return new ConstructionDeriveResponse(address);
};

/**
 * Create a Request to Fetch Metadata
 * Preprocess is called prior to /construction/payloads to construct a request for any metadata that is needed for transaction construction given (i.e. account nonce).
 * The options object returned from this endpoint will be sent to the /construction/metadata endpoint UNMODIFIED by the caller (in an offline execution environment).
 * If your Construction API implementation has configuration options, they MUST be specified in the /construction/preprocess request (in the metadata field).
 *
 * The request returned from this method will be used by the caller (in a different execution environment) to call the `/construction/metadata` endpoint.
 *
 * [OFFLINE]
 * constructionPreprocessRequest ConstructionPreprocessRequest
 * returns ConstructionPreprocessResponse
 * */

export const constructionPreprocess = async (
  params: Params<ConstructionPreprocessRequest>
): Promise<ConstructionPreprocessResponse> => {
  const { constructionPreprocessRequest } = params;
  const { operations } = constructionPreprocessRequest;

  // Gather public keys needed for TXs
  const requiredPublicKeys = operations.map(
    (operation) => new AccountIdentifier(operation.account.address)
  );

  const senderAddress = operations
    .filter((operation) => new BN(operation.amount.value).isNeg())
    .map((operation) => operation.account.address);

  return new ConstructionPreprocessResponse(
    { from: senderAddress[0] },
    requiredPublicKeys
  );
};

/**
 * Get Transaction Construction Metadata
 * Get any information required to construct a transaction for a specific network. Metadata returned here could be a recent hash to use, an account sequence number, or even arbitrary chain state. It is up to the client to correctly populate the options object with any network-specific details to ensure the correct metadata is retrieved.  It is important to clarify that this endpoint should not pre-construct any transactions for the client (this should happen in the SDK). This endpoint is left purposely unstructured because of the wide scope of metadata that could be required.  In a future version of the spec, we plan to pass an array of Rosetta Operations to specify which metadata should be received and to create a transaction in an accompanying SDK. This will help to insulate the client from chain-specific details that are currently required here.
 * Metadata returned here could be a recent hash to use, an account sequence number, or even arbitrary chain state.
 * It is up to the client to correctly populate the options object with any network-specific details to ensure the correct metadata is retrieved.
 * It is important to clarify that this endpoint should not pre-construct any transactions for the client (this should happen in the SDK).
 * This endpoint is left purposely unstructured because of the wide scope of metadata that could be required.
 * In a future version of the spec, we plan to pass an array of Rosetta Operations to specify which metadata should be received and to create a transaction in an accompanying SDK.
 * This will help to insulate the client from chain-specific details that are currently required here.
 *
 * constructionMetadataRequest ConstructionMetadataRequest
 * returns ConstructionMetadataResponse
 * */

export const constructionMetadata = async (
  params: Params<ConstructionMetadataRequest>
): Promise<ConstructionMetadataResponse> => {
  const { constructionMetadataRequest } = params;
  const api = await getNetworkApiFromRequest(constructionMetadataRequest);
  const { options } = constructionMetadataRequest;

  // Get signing info for extrinsic
  const nonce = (await api.query.system.account(options.from)).nonce.toNumber();
  const signingInfo = await api.derive.tx.signingInfo(options.from, nonce);
  const blockNumber = signingInfo.header.number.toNumber();
  //@ts-ignore
  const blockHash = await api.rpc.chain.getBlockHash(signingInfo.header.number);
  const eraPeriod = signingInfo.mortalLength;

  // Format into metadata object
  return new ConstructionMetadataResponse({
    nonce,
    blockHash,
    blockNumber,
    eraPeriod,
  });
};

/**
 * Generate an Unsigned Transaction and Signing Payloads
 * Payloads is called with an array of operations and the response from `/construction/metadata`. It returns an unsigned transaction blob and a collection of payloads that must be signed by particular addresses using a certain SignatureType. The array of operations provided in transaction construction often times can not specify all \"effects\" of a transaction (consider invoked transactions in Ethereum). However, they can deterministically specify the \"intent\" of the transaction, which is sufficient for construction. For this reason, parsing the corresponding transaction in the Data API (when it lands on chain) will contain a superset of whatever operations were provided during construction.
 * It returns an unsigned transaction blob and a collection of payloads that must be signed by particular addresses using a certain SignatureType.
 * The array of operations provided in transaction construction often times can not specify all \"effects\" of a transaction (consider invoked transactions in Ethereum).
 * However, they can deterministically specify the \"intent\" of the transaction, which is sufficient for construction.
 * For this reason, parsing the corresponding transaction in the Data API (when it lands on chain) will contain a superset of whatever operations were provided during construction.
 *
 * [OFFLINE]
 * constructionPayloadsRequest ConstructionPayloadsRequest
 * returns ConstructionPayloadsResponse
 * */

export const constructionPayloads = async (
  params: Params<ConstructionPayloadsRequest>
): Promise<ConstructionPayloadsResponse> => {
  const { constructionPayloadsRequest } = params;
  const { operations } = constructionPayloadsRequest;

  // Must have 2 operations, send and receive
  if (operations.length !== 2) {
    throw new Error("Need atleast 2 transfer operations");
  }

  // Sort by sender/reciever
  const senderOperations = operations.filter((operation) =>
    new BN(operation.amount.value).isNeg()
  );
  const receiverOperations = operations.filter(
    (operation) => !new BN(operation.amount.value).isNeg()
  );

  // Ensure we have correct amount of operations
  if (senderOperations.length !== 1 || receiverOperations.length !== 1) {
    throw new Error(
      "Payloads require 1 sender and 1 receiver transfer operation"
    );
  }

  const sendOp = senderOperations[0];
  const receiveOp = receiverOperations[0];

  // Support only transfer operation
  if (sendOp.type !== "Transfer" || receiveOp.type !== "Transfer") {
    throw new Error("Payload operations must be of type Transfer");
  }

  const senderAddress = sendOp.account.address;
  const toAddress = receiveOp.account.address;
  const { nonce, eraPeriod, blockNumber, blockHash } =
    constructionPayloadsRequest.metadata;

  // Initialize the registry
  const registry = getNetworkRegistryFromRequest(constructionPayloadsRequest);

  // Build the transfer txn
  const txParams = {
    from: senderAddress,
    to: toAddress,
    value: receiveOp.amount.value,
    tip: 0,
    nonce,
    eraPeriod,
    blockNumber,
    blockHash,
    version: EXTRINSIC_VERSION,
  };

  const { unsignedTxn } = buildTransferTxn({
    ...txParams,
    registry,
  });

  const extrinsicPayload = registry.registry.createType(
    "ExtrinsicPayload",
    unsignedTxn,
    {
      version: EXTRINSIC_VERSION,
    }
  );

  // With the `ExtrinsicPayload` class, construct the actual payload to sign.
  const actualPayload = extrinsicPayload.toU8a({ method: true });
  const signingPayload = u8aToHex(actualPayload);
  const signatureType = "ed25519";

  // Create an array of payloads that must be signed by the caller
  const payloads: SigningPayload[] = [
    {
      address: senderAddress,
      account_identifier: new AccountIdentifier(senderAddress),
      hex_bytes: signingPayload.substr(2),
      signature_type: signatureType,
    },
  ];

  const unsignedTransaction = JSON.stringify(txParams);
  return new ConstructionPayloadsResponse(unsignedTransaction, payloads);
};

/**
 * Create Network Transaction from Signatures
 * Combine creates a network-specific transaction from an unsigned transaction and an array of provided signatures. The signed transaction returned from this method will be sent to the `/construction/submit` endpoint by the caller.
 * The signed transaction returned from this method will be sent to the `/construction/submit` endpoint by the caller.
 *
 * [OFFLINE]
 * constructionCombineRequest ConstructionCombineRequest
 * returns ConstructionCombineResponse
 * */

export const constructionCombine = async (
  params: Params<ConstructionCombineRequest>
): Promise<ConstructionCombineResponse> => {
  const { constructionCombineRequest } = params;
  const registry = getNetworkRegistryFromRequest(constructionCombineRequest);
  const { signatures } = constructionCombineRequest;
  const unsignedTx = constructionCombineRequest.unsigned_transaction;
  const unsignedTxJSON = JSON.parse(unsignedTx);

  // Get signature info
  const signatureType = signatures[0].signature_type.toLowerCase();
  const signatureHex = `0x${signatures[0].hex_bytes}`;
  const signingPayload = `0x${signatures[0].signing_payload.hex_bytes}`;

  // Verify the message
  const signer = u8aToHex(decodeAddress(unsignedTxJSON.from));
  const signatureU8a = hexToU8a(signatureHex);
  const { isValid } = signatureVerify(signingPayload, signatureU8a, signer);
  if (!isValid) {
    throw new Error("Signature is not valid for signing payload");
  }

  // Re-construct extrinsic
  const { transaction } = jsonToTx(unsignedTx, {
    metadataRpc: registry.metadata,
    registry,
  });
  const unsignedTxn: UnsignedTransaction = transaction;
  const txInfo = decode(unsignedTxn, {
    metadataRpc: registry.metadata,
    registry: registry.registry,
  });

  // Ensure tx is balances.transfer
  if (
    txInfo.method.name !== "transfer" ||
    txInfo.method.pallet !== "balances"
  ) {
    throw new Error("Extrinsic must be method transfer and pallet balances");
  }

  // Generate header byte
  const headerU8a = new Uint8Array(1);
  headerU8a[0] = sigTypeEnum[signatureType] || 0;

  // Append signature type header then create a signed transaction
  const signatureWithHeader = u8aConcat(headerU8a, signatureU8a);
  const signedTxJSON = JSON.stringify({
    ...unsignedTxJSON,
    signature: u8aToHex(signatureWithHeader),
    signer: unsignedTxJSON.from,
  });

  return new ConstructionCombineResponse(signedTxJSON);
};

/**
 * Parse a Transaction
 * Parse is called on both unsigned and signed transactions to understand the intent of the formulated transaction. This is run as a sanity check before signing (after `/construction/payloads`) and before broadcast (after `/construction/combine`).
 * This is run as a sanity check before signing (after `/construction/payloads`) and before broadcast (after `/construction/combine`).
 *
 * [OFFLINE]
 * constructionParseRequest ConstructionParseRequest
 * returns ConstructionParseResponse
 * */

export const constructionParse = async (
  params: Params<ConstructionParseRequest>
): Promise<ConstructionParseResponse> => {
  const { constructionParseRequest } = params;
  const { signed, transaction } = constructionParseRequest;
  const registry = getNetworkRegistryFromRequest(constructionParseRequest);
  const currency = getNetworkCurrencyFromRequest(constructionParseRequest);

  let value: any;
  let sourceAccountAddress: string;
  let destAccountAddress: string | any;

  // Parse transaction
  if (transaction.substr(0, 2) === "0x") {
    // Hex encoded extrinsic
    const polkaTx = registry.registry.createType(
      "Extrinsic",
      hexToU8a(transaction),
      {
        isSigned: true,
      }
    );

    const transactionJSON: Extrinsic = polkaTx.toHuman() as any;
    sourceAccountAddress = transactionJSON.signer.toString();
    destAccountAddress = transactionJSON.method.args[0];
    value = polkaTx.method.args[1].toString();
  } else {
    const parsedTx = jsonToTx(transaction, {
      metadataRpc: registry.metadata,
      registry,
    });

    const parsedTxn = parsedTx.transaction;
    const txInfo = decode(parsedTxn, {
      metadataRpc: registry.metadata,
      registry: registry.registry,
    });
    const { args } = txInfo.method;

    // Ensure tx is balances.transfer
    if (
      txInfo.method.name !== "transfer" ||
      txInfo.method.pallet !== "balances"
    ) {
      throw new Error("Extrinsic must be method transfer and pallet balances");
    }

    sourceAccountAddress = txInfo.address;
    destAccountAddress =
      (args.dest as any).Address20 || (args.dest as any).Id || args.dest;
    value = args.value;
  }

  // Ensure arguments are correct
  if (!destAccountAddress || typeof value === "undefined") {
    throw new Error("Extrinsic is missing dest and value arguments");
  }
  
  // Deconstruct transaction into operations
  const operations = [
    Operation.constructFromObject({
      operation_identifier: new OperationIdentifier(0),
      type: "Transfer",
      account: new AccountIdentifier(sourceAccountAddress),
      amount: new Amount(new BN(value).neg().toString(), currency),
    }),
    Operation.constructFromObject({
      operation_identifier: new OperationIdentifier(1),
      type: "Transfer",
      account: new AccountIdentifier(destAccountAddress),
      amount: new Amount(value.toString(), currency),
    }),
  ];

  // Create response
  const response = new ConstructionParseResponse(operations);
  if (signed) {
    response.account_identifier_signers = [
      new AccountIdentifier(sourceAccountAddress),
    ];
  }
  return response;
};

/**
 * Get the Hash of a Signed Transaction
 * TransactionHash returns the network-specific transaction hash for a signed transaction.
 *
 * [OFFLINE]
 * constructionHashRequest ConstructionHashRequest
 * returns TransactionIdentifierResponse
 * */

export const constructionHash = async (
  params: Params<ConstructionHashRequest>
): Promise<TransactionIdentifierResponse> => {
  const { constructionHashRequest } = params;
  const registry = getNetworkRegistryFromRequest(constructionHashRequest);
  const { extrinsic } = jsonToTx(constructionHashRequest.signed_transaction, {
    metadataRpc: registry.metadata,
    registry,
  });

  const transactionHashHex = getTxHash(extrinsic.toHex());
  return new TransactionIdentifierResponse({
    hash: transactionHashHex.substr(2),
  });
};

/**
 * Submit a Signed Transaction
 * Submit a pre-signed transaction to the node. This call should not block on the transaction being included in a block.
 * Rather, it should return immediately with an indication of whether or not the transaction was included in the mempool.
 * The transaction submission response should only return a 200 status if the submitted transaction could be included in the mempool. Otherwise, it should return an error.
 *
 * constructionSubmitRequest ConstructionSubmitRequest
 * returns ConstructionSubmitResponse
 * */

export const constructionSubmit = async (
  params: Params<ConstructionSubmitRequest>
): Promise<TransactionIdentifierResponse | void> => {
  const { constructionSubmitRequest } = params;
  const api = await getNetworkApiFromRequest(constructionSubmitRequest);
  const signedTxHex = constructionSubmitRequest.signed_transaction;
  const registry = getNetworkRegistryFromRequest(constructionSubmitRequest);
  const nonce = (
    await api.query.system.account(JSON.parse(signedTxHex).from)
  ).nonce.toNumber();

  if (nonce !== JSON.parse(signedTxHex).nonce) {
    return throwError(ERROR_BROADCAST_TRANSACTION);
  }

  const { extrinsic } = jsonToTx(constructionSubmitRequest.signed_transaction, {
    metadataRpc: registry.metadata,
    registry,
  });

  try {
    //@ts-ignore
    const txHash = await api.rpc.author.submitExtrinsic(extrinsic.toHex());
    return new TransactionIdentifierResponse({
      hash: u8aToHex(txHash).substr(2),
    });
  } catch (e) {
    return throwError(ERROR_BROADCAST_TRANSACTION, e);
  }
};
