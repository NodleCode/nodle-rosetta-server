import { MempoolTransactionRequest, NetworkRequest, Params } from "types";
import {
  MempoolResponse,
  TransactionIdentifier,
  MempoolTransactionResponse,
} from "../client";
import {
  getNetworkApiFromRequest,
  getNetworkCurrencyFromRequest,
} from "../utils/connections";
import { ApiPromise } from "@polkadot/api";
import { getTransactionFromPool } from "../utils/functions";
import { Keyring } from "@polkadot/api";
import { Extrinsic } from "@polkadot/types/interfaces";

const MEMPOOL_TESTING = true;

/* Data API: Mempool */

/**
 * Get All Mempool Transactions
 * Get all Transaction Identifiers in the mempool
 *
 * networkRequest NetworkRequest
 * returns MempoolResponse
 * */

export const mempool = async (
  params: Params<NetworkRequest>
): Promise<MempoolResponse> => {
  const { networkRequest } = params;
  const api: ApiPromise = await getNetworkApiFromRequest(networkRequest);

  MEMPOOL_TESTING && testMempool(api); //TODO remove after demo
  const transactions = await api.rpc.author.pendingExtrinsics();
  const transactionIdentifiers =
    transactions?.map(
      (extrinsic) =>
        new TransactionIdentifier(extrinsic.hash.toString().substr(2))
    ) || [];
  return new MempoolResponse(transactionIdentifiers);
};

/**
 * Get a Mempool Transaction
 * Get a transaction in the mempool by its Transaction Identifier.
 * This is a separate request than fetching a block transaction (/block/transaction) because some blockchain nodes need to know
 * that a transaction query is for something in the mempool instead of a transaction in a block.
 * Transactions may not be fully parsable until they are in a block (ex: may not be possible to determine the fee to pay before a transaction is executed).
 * On this endpoint, it is ok that returned transactions are only estimates of what may actually be included in a block.
 *
 * mempoolTransactionRequest MempoolTransactionRequest
 * returns MempoolTransactionResponse
 * */

export const mempoolTransaction = async (
  params: Params<MempoolTransactionRequest>
): Promise<MempoolTransactionResponse> => {
  const { mempoolTransactionRequest } = params;
  const api: ApiPromise = await getNetworkApiFromRequest(
    mempoolTransactionRequest
  );
  const { hash } = mempoolTransactionRequest.transaction_identifier;

  /****************** TODO change after demo *******************/

  MEMPOOL_TESTING && testMempool(api); 

  const mempoolTransactions = await api.rpc.author.pendingExtrinsics();

  let transactionInPool: Extrinsic;

  if (MEMPOOL_TESTING) {
    transactionInPool = mempoolTransactions[0];
  } else {
    transactionInPool = mempoolTransactions?.find(
      (t) => t.hash.toString().substr(2) === hash.toString()
    );
  }
  /*************************************************************/

  if (!transactionInPool) return {} as MempoolTransactionResponse;

  const currency = getNetworkCurrencyFromRequest(mempoolTransactionRequest);

  const transaction = getTransactionFromPool(api, transactionInPool, currency);

  return new MempoolTransactionResponse(transaction);
};

function testMempool(api: ApiPromise) {
  try {
    const keyring = new Keyring({ type: "sr25519" });
    const alice = keyring.addFromUri("//Alice", { name: "Alice default" });
    const bob = keyring.addFromUri("//Bob", { name: "Bob default" });
    const AMOUNT = 10000;
    api.tx.balances
    .transfer("4kMVMYM62pA45nkACGFMBNGLjqUXVxjsw7nY4cGCR2NejajH", AMOUNT)
    .signAndSend(alice);
    api.tx.balances
    .transfer("4mvedcXEAY9xEoEfdCDHviBJqgVQxW9DRwvs7yPsV1HtWU9k", AMOUNT)
    .signAndSend(bob);
  } catch(e) {
    console.error(e)
  }
}
