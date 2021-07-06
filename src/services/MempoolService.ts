import { ERROR_TX_INVALID, throwError } from "../utils/error-types";
import {
  MempoolResponse,
  MempoolTransactionRequest,
  MempoolTransactionResponse,
  NetworkRequest,
  Params,
} from "types";

/* Data API: Mempool */

/**
 * Get All Mempool Transactions
 * Get all Transaction Identifiers in the mempool
 *
 * mempoolRequest MempoolRequest
 * returns MempoolResponse
 * */
export const mempool = async (
  params: Params<NetworkRequest>
): Promise<MempoolResponse> => {
  const { mempoolRequest } = params;
  // No mempool transactions for substrate, assumes block time is within few seconds
  return {} as MempoolResponse;
  return { transaction_identifiers: [{ hash: "" }] };
};

/**
 * Get a Mempool Transaction
 * Get a transaction in the mempool by its Transaction Identifier. This is a separate request than fetching a block transaction (/block/transaction) because some blockchain nodes need to know that a transaction query is for something in the mempool instead of a transaction in a block.  Transactions may not be fully parsable until they are in a block (ex: may not be possible to determine the fee to pay before a transaction is executed). On this endpoint, it is ok that returned transactions are only estimates of what may actually be included in a block.
 *
 * mempoolTransactionRequest MempoolTransactionRequest
 * returns MempoolTransactionResponse
 * */
export const mempoolTransaction = async (
  params: Params<MempoolTransactionRequest>
): Promise<MempoolTransactionResponse> => {
  const { mempoolTransactionRequest } = params;

  throwError(ERROR_TX_INVALID);
  return {} as MempoolTransactionResponse;
  return {
    transaction: {
      operations: [
        {
          operation_identifier: { index: 1, network_index: 1 },
          type: "",
          status: "",
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
          coin_change: {
            coin_action: "coin_spent", // | 'coin_created'}
            coin_identifier: { identifier: "" },
          },
          related_operations: [{ index: 1, network_index: 1 }],
          metadata: {},
        },
      ],
      transaction_identifier: { hash: "" },
      metadata: {},
      related_transactions: [
        {
          direction: "forward", // |'backward'
          transaction_identifier: { hash: "" },
          network_identifier: {
            blockchain: "",
            network: "",
            sub_network_identifier: { network: "", metadata: {} },
          },
        },
      ],
    },
    metadata: {},
  };
};
