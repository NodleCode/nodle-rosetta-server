import { AccountBalanceRequest, Params } from "types";
import RosettaSDK from "rosetta-node-sdk";

import { ERROR_NOT_IMPLEMENTED, throwError } from "../utils/error-types";

import {
  getNetworkApiFromRequest,
  getNetworkCurrencyFromRequest,
} from "../utils/connections";
import { AccountBalanceResponse, Amount, BlockIdentifier } from "../client";
import { ApiPromise } from "@polkadot/api";

/* Data API: Account */

/**
 * Get an Account Balance
 * Get an array of all Account Balances for an Account Identifier and the Block Identifier at which the balance lookup was performed.
 * Some consumers of account balance data need to know at which block the balance was calculated to reconcile account balance changes.
 * To get all balances associated with an account, it may be necessary to perform multiple balance requests with unique Account Identifiers.
 * If the client supports it, passing nil AccountIdentifier metadata to the request should fetch all balances (if applicable).
 * It is also possible to perform a historical balance lookup (if the server supports it) by passing in an optional BlockIdentifier.
 *
 * accountBalanceRequest AccountBalanceRequest
 * returns AccountBalanceResponse
 * */

export const balance = async (
  params: Params<AccountBalanceRequest>
): Promise<AccountBalanceResponse> => {
  const { accountBalanceRequest } = params;
  const { address } = accountBalanceRequest.account_identifier;
  const { index, hash } = accountBalanceRequest.block_identifier || {
    index: null,
    hash: null,
  };
  const api: ApiPromise = await getNetworkApiFromRequest(accountBalanceRequest);

  // Get block hash if not set
  let blockHash = hash;
  let blockIndex = index;
  if (!blockHash) {
    blockHash = (await api.rpc.chain.getBlockHash(index)).toString();
  }

  // Get block info and set index if not set
  const currentBlock = await api.rpc.chain.getBlock(blockHash);
  if (!blockIndex) {
    blockIndex = currentBlock.block.header.number.toNumber();
  }

  // Get balance at block hash
  const {
    data: { free },
  } = await api.query.system.account.at(blockHash, address);
  const validBlock = new BlockIdentifier(blockIndex, blockHash);

  const validAmount = new Amount(
    free.toString(),
    getNetworkCurrencyFromRequest(accountBalanceRequest)
  );

  return new AccountBalanceResponse(validBlock, [validAmount]);
};

export const coins = async () => {
  throwError(ERROR_NOT_IMPLEMENTED);
};
