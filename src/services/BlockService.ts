import { BlockRequest, BlockTransactionRequest, Params } from "types";
import { BlockHash, EventRecord } from "@polkadot/types/interfaces";
import {
  getNetworkApiFromRequest,
  getNetworkCurrencyFromRequest,
  getNetworkIdentifierFromRequest,
} from "../utils/connections";

import {
  Block,
  BlockIdentifier,
  BlockResponse,
  Operation,
  OperationIdentifier,
  BlockTransactionResponse,
} from "../client";
import { ApiPromise } from "@polkadot/api";
import {
  getDefaultPayment,
  getTransactions,
  getTransactionsFromEvents,
  OPERATION_STATUSES,
} from "../utils/functions";
import { Vec } from "@polkadot/types";

/* Data API: Block */

/**
 * Get a Block
 * Get a block by its Block Identifier. If transactions are returned in the same call to the node as fetching the block, the response should include these transactions in the Block object. If not, an array of Transaction Identifiers should be returned so /block/transaction fetches can be done to get all transaction information.
 *
 * blockRequest BlockRequest
 * returns BlockResponse
 * */
export const block = async (
  params: Params<BlockRequest>
): Promise<BlockResponse> => {
  const { blockRequest } = params;
  const api: ApiPromise = await getNetworkApiFromRequest(blockRequest);
  const currency = getNetworkCurrencyFromRequest(blockRequest);
  const networkIdentifier = getNetworkIdentifierFromRequest(blockRequest);
  const { index, hash } = blockRequest.block_identifier;

  // Get block hash if not set
  let blockHash = hash;
  let blockIndex = index;
  if (!blockHash) {
    blockHash = (await api.rpc.chain.getBlockHash(index)).toString();
  }

  // Get block timestamp
  const timestamp = (await api.query.timestamp.now.at(blockHash)).toNumber();

  // Genesis block
  if (blockIndex === 0) {
    const blockIdentifier = new BlockIdentifier(blockIndex, blockHash);

    // Define block format
    const blockTyped = new Block(
      blockIdentifier,
      blockIdentifier,
      timestamp,
      []
    );

    // Format data into block response
    return new BlockResponse(blockTyped);
  }

  // Get block info and set index if not set
  const currentBlock = await api.rpc.chain.getBlock(blockHash);
  if (!blockIndex) {
    blockIndex = currentBlock.block.header.number.toNumber();
  }

  // Get block parent
  const parentHash = currentBlock.block.header.parentHash.toHex();
  const parentBlock = await api.rpc.chain.getBlock(parentHash);

  // Convert to BlockIdentifier
  const blockIdentifier = new BlockIdentifier(blockIndex, blockHash);

  const parentBlockIdentifier = new BlockIdentifier(
    parentBlock.block.header.number.toNumber(),
    parentHash
  );

  // Get payment infos for all extrinsics
  const paymentInfoPromises = [];
  const { extrinsics } = currentBlock.block;

  for (let i = 0; i < extrinsics.length; i++) {
    const extrinsic = extrinsics[i];
    const prom = await api.rpc.payment
      .queryInfo(extrinsic.toHex(), blockHash)
      .catch(() => getDefaultPayment());
    paymentInfoPromises.push(prom);
  }

  const paymentInfos = await Promise.all(paymentInfoPromises);
  const allRecords = await api.query.system.events.at(blockHash);
  const { transactions, fees } = await getTransactions(
    currentBlock,
    allRecords,
    api,
    null,
    paymentInfos,
    currency,
    networkIdentifier
  );

  // Get system events as this can also contain balance changing info (poa, reserved etc)
  // HACK: setting txHash to blockHash for system events, since they arent related to extrinsic hashes
  const systemTransactions = await getTransactionsFromEvents(
    allRecords.filter(
      ({ phase }) => !phase.isApplyExtrinsic
    ) as Vec<EventRecord>,
    api,
    currency,
    networkIdentifier,
    blockIndex
  );

  // Add fees to system transactions
  if (systemTransactions.length) {
    const { operations } = systemTransactions[0];
    operations.push(
      ...fees.map((fee, feeIndex) =>
        Operation.constructFromObject({
          operation_identifier: new OperationIdentifier(
            operations.length + feeIndex
          ),
          type: "Fee",
          status: OPERATION_STATUSES.SUCCESS,
          ...fee,
        })
      )
    );

    transactions.push(...systemTransactions);
  }

  // Define block format
  const blockTyped = new Block(
    blockIdentifier,
    parentBlockIdentifier,
    timestamp,
    transactions
  );

  // Format data into block response
  return new BlockResponse(blockTyped);
};

/**
 * Get a Block Transaction
 * Get a transaction in a block by its Transaction Identifier. This endpoint should only be used when querying a node for a block does not return all transactions contained within it.  All transactions returned by this endpoint must be appended to any transactions returned by the /block method by consumers of this data. Fetching a transaction by hash is considered an Explorer Method (which is classified under the Future Work section).  Calling this endpoint requires reference to a BlockIdentifier because transaction parsing can change depending on which block contains the transaction. For example, in Bitcoin it is necessary to know which block contains a transaction to determine the destination of fee payments. Without specifying a block identifier, the node would have to infer which block to use (which could change during a re-org).  Implementations that require fetching previous transactions to populate the response (ex: Previous UTXOs in Bitcoin) may find it useful to run a cache within the Rosetta server in the /data directory (on a path that does not conflict with the node).
 *
 * blockTransactionRequest BlockTransactionRequest
 * returns BlockTransactionResponse
 * */
export const blockTransaction = async (
  params: Params<BlockTransactionRequest>
): Promise<BlockTransactionResponse> => {
  const { blockTransactionRequest } = params;
  const api = await getNetworkApiFromRequest(blockTransactionRequest);
  const currency = getNetworkCurrencyFromRequest(blockTransactionRequest);
  const networkIdentifier = getNetworkIdentifierFromRequest(
    blockTransactionRequest
  );
  const { index, hash } = blockTransactionRequest.block_identifier;

  // Get block hash if not set
  let blockHash: string | BlockHash = hash;
  let blockIndex = index;
  if (!blockHash) {
    blockHash = await api.rpc.chain.getBlockHash(index);
  }

  // Get block info and set index if not set
  const currentBlock = await api.rpc.chain.getBlock(blockHash);
  if (!blockIndex) {
    blockIndex = currentBlock.block.header.number.toNumber();
  }

  const txIdentifier = blockTransactionRequest.transaction_identifier;
  const allRecords = await api.query.system.events.at(blockHash);
  const { transactions } = await getTransactions(
    currentBlock,
    allRecords,
    api,
    (section, method, txhash) =>
      txhash.toString() === txIdentifier.hash.toString(),
    [],
    currency,
    networkIdentifier
  );

  return new BlockTransactionResponse(transactions[0]);
};
