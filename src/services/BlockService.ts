import { getApi } from "../api";
import {
  BlockRequest,
  BlockResponse,
  BlockTransactionRequest,
  BlockTransactionResponse,
  Params,
} from "types";

/* Data API: Block */

/**
 * Get a Block
 * Get a block by its Block Identifier. If transactions are returned in the same call to the node as fetching the block, the response should include these transactions in the Block object. If not, an array of Transaction Identifiers should be returned so /block/transaction fetches can be done to get all transaction information.
 *
 * blockRequest BlockRequest
 * returns BlockResponse
 * */
export async function block(
  params: Params<BlockRequest>
): Promise<BlockResponse> {
  const api = await getApi("ws://3.217.156.114:9944");
  const { body: blockRequest } = params;
  const hash = blockRequest.block_identifier.hash;

  const [{ block }, timestamp] = await Promise.all([
    api.rpc.chain.getBlock(hash),
    api.query.timestamp.now.at(hash),
  ]);
  return {
    block: {
      block_identifier: {
        hash: block.hash.toString(),
        index: block.header.number.toNumber(),
      },
      parent_block_identifier: { hash: "", index: 1 },
      timestamp: timestamp.toNumber(),
      transactions: [
        {
          operations: [
            {
              operation_identifier: { index: 1, network_index: 1 },
              type: "",
              account: {
                address: "",
                metadata: {},
                sub_account: { address: "", metadata: {} },
              },
              amount: {
                value: "",
                currency: { decimals: 1, symbol: "", metadata: {} },
                metadata: {},
              },
              metadata: {},
              coin_change: {
                coin_action: "coin_created", //| 'coin_spent',
                coin_identifier: { identifier: "" },
              },
              related_operations: [{ index: 1, network_index: 1 }],
              status: "",
            },
          ],
          transaction_identifier: { hash: "" },
          related_transactions: [
            {
              direction: "forward", // | 'backward'
              transaction_identifier: { hash: "" },
              network_identifier: {
                blockchain: "",
                network: "",
                sub_network_identifier: { network: "", metadata: {} },
              },
            },
          ],
          metadata: {},
        },
      ],
    },
  };
}

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
  const { body: blockTransactionRequest } = params;

  return {
    transaction: {
      transaction_identifier: { hash: "" },
      operations: [
        {
          operation_identifier: { index: 1, network_index: 1 },
          type: "",
          account: {
            address: "",
            metadata: {},
            sub_account: { address: "", metadata: {} },
          },
          amount: {
            value: "",
            currency: { decimals: 1, symbol: "", metadata: {} },
            metadata: {},
          },
          metadata: {},
          coin_change: {
            coin_action: "coin_created", //| 'coin_spent',
            coin_identifier: { identifier: "" },
          },
          related_operations: [{ index: 1, network_index: 1 }],
          status: "",
        },
      ],
      metadata: {},
      related_transactions: [
        {
          direction: "forward", // | 'backward'
          transaction_identifier: { hash: "" },
          network_identifier: {
            blockchain: "",
            network: "",
            sub_network_identifier: { network: "", metadata: {} },
          },
        },
      ],
    },
  };
};
