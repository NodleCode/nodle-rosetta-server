import {
  MempoolResponse,
  MempoolTransactionRequest,
  MempoolTransactionResponse,
  NetworkRequest,
  Params,
} from "rosetta-typescript-sdk/src/types";

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
  return {} as MempoolResponse;
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
  return {} as MempoolTransactionResponse;
};
