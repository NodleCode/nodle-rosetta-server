import { ApiPromise } from "@polkadot/api";
import { getTypeDef, Vec } from "@polkadot/types";
import {
  BlockNumber,
  CodecHash,
  EventRecord,
  Extrinsic,
  SignedBlock,
} from "@polkadot/types/interfaces";
import { Codec } from "@polkadot/types/types";
import { u8aToHex } from "@polkadot/util";
import BN from "bn.js";
import { SubstrateNetworkIdentifier } from "src/network";

import {
  AccountIdentifier,
  Amount,
  Currency,
  Operation,
  OperationIdentifier,
  Transaction,
  TransactionIdentifier,
} from "../client";
import extrinsicOpMap from "./extrinsic-operation-map";
export const OPERATION_STATUSES = {
  SUCCESS: "SUCCESS",
  FAILURE: "FAILURE",
  UNKNOWN: "UNKNOWN",
};

const EXTRINSIC_SUCCESS_EVENT = "system:ExtrinsicSuccess";
const EXTRINSIC_FAILED_EVENT = "system:ExtrinsicFailed";

const epochDetailsCache = {};

export async function getDefaultPayment() {
  return {
    partialFee: new BN("0"),
  };
}

// Event utils
export function getSourceAccountFromEvent(operationId: string, args) {
  if (operationId === "balances.transfer") {
    return args[0];
  }

  return "";
}

export function getEffectedAccountFromEvent(
  operationId: string,
  args: Codec[],
  api: ApiPromise,
  networkIdentifier: SubstrateNetworkIdentifier
) {
  if (
    operationId === "poamodule.txnfeesgiven" ||
    operationId === "balances.transfer"
  ) {
    return args[1];
  }
  if (operationId === "poamodule.epochends") {
    return (
      networkIdentifier.properties.poaModule &&
      networkIdentifier.properties.poaModule.treasury
    );
  }
  return args[0];
}

export async function getOperationAmountFromEvent(
  operationId: string,
  args: Codec[],
  api: ApiPromise,
  blockNumber: BlockNumber | number
) {
  if (
    operationId === "balances.transfer" ||
    operationId === "poamodule.txnfeesgiven"
  ) {
    return api.createType("Balance", args[2]);
  }
  if (
    operationId === "balances.reserved" ||
    operationId === "balances.unreserved" ||
    operationId === "balances.endowed"
  ) {
    return api.createType("Balance", args[1]);
  }
  if (operationId === "poamodule.epochends") {
    const epochNo = args[0];
    const epochId = epochNo.toString();
    let epochDetails = epochDetailsCache[epochId];
    if (!epochDetails) {
      epochDetails = await api.query.poAModule.epochs(epochNo);
      epochDetailsCache[epochId] = epochDetails;
    }
    return api.createType(
      "Balance",
      epochDetails.emission_for_treasury.toString()
    );
  }
  if (operationId === "balances.balanceset") {
    const address = args[0];
    const newBalance = args[1];
    const previousBlockHash = await api.rpc.chain.getBlockHash(
      (typeof blockNumber === "number"
        ? blockNumber
        : blockNumber.toNumber && blockNumber.toNumber()) - 1
    );
    const {
      data: { free },
    } = (await api.query.system.account.at(previousBlockHash, address)) as any;
    const deltaBalance = new BN(newBalance.toString()).sub(
      new BN(free.toString())
    );
    return deltaBalance.toString();
  }
  return 0;
}

// Extrinsic utils
export function getOperationsFromExtrinsic(
  api: ApiPromise,
  extrinsic: Extrinsic,
  currency: Currency
) {
  const type = extrinsic.method.method;
  const extrinsicMethod =
    `${extrinsic.method.section}.${extrinsic.method.method}`.toLowerCase();

  const amount = getOperationAmountFromExtrinsic(
    api,
    extrinsic,
    extrinsicMethod
  );
  return [
    Operation.constructFromObject({
      operation_identifier: new OperationIdentifier(0),
      type,
      account: new AccountIdentifier(getSourceAccountFromExtrinsic(extrinsic)),
      amount: new Amount(
        new BN(extrinsic.method.args[1].toString()).neg().toString(),
        currency
      ),
    }),
    Operation.constructFromObject({
      operation_identifier: new OperationIdentifier(1),
      type,
      account: new AccountIdentifier(
        getEffectedAccountFromExtrinsic(extrinsic, extrinsicMethod)
      ),
      amount: new Amount(new BN(amount).toString(), currency),
    }),
  ];
}

export function getSourceAccountFromExtrinsic(extrinsic: Extrinsic) {
  return extrinsic.signer.toString();
}

export function getEffectedAccountFromExtrinsic(
  extrinsic: Extrinsic,
  extrinsicMethod: string
) {
  if (
    extrinsicMethod === "balances.transfer" ||
    extrinsicMethod === "balances.transferkeepalive"
  ) {
    return extrinsic.method.args[0].toString();
  }

  return "";
}

export function getOperationAmountFromExtrinsic(
  api: ApiPromise,
  extrinsic: Extrinsic,
  extrinsicMethod: string
) {
  if (
    extrinsicMethod === "balances.transfer" ||
    extrinsicMethod === "balances.transferkeepalive"
  ) {
    return api.createType("Balance", extrinsic.method.args[1]);
  }

  return 0;
}

//Operations
export function addToOperations(
  operations: Operation[],
  eventOpType: string,
  status: string,
  destAccountAddress: string,
  balanceAmount: BN,
  sourceAccountAddress: string,
  currency: Currency
) {
  // Apply minus delta balance from source (typically index 0)
  if (sourceAccountAddress) {
    operations.push(
      Operation.constructFromObject({
        operation_identifier: new OperationIdentifier(operations.length),
        type: eventOpType,
        status,
        account: new AccountIdentifier(sourceAccountAddress),
        amount: new Amount(balanceAmount.neg().toString(), currency),
      })
    );
  }

  // Operations map to balance changing events (typically index 1)
  operations.push(
    Operation.constructFromObject({
      operation_identifier: new OperationIdentifier(operations.length),
      type: eventOpType,
      status,
      account: new AccountIdentifier(destAccountAddress),
      amount: new Amount(balanceAmount.toString(), currency),
    })
  );
}

export async function processRecordToOp(
  api: ApiPromise,
  record: EventRecord,
  operations: Operation[],
  extrinsicArgs: Codec[],
  status: string,
  allRecords: Vec<EventRecord>,
  currency: Currency,
  networkIdentifier: SubstrateNetworkIdentifier,
  blockNumber: BlockNumber | number
) {
  const { event } = record;
  const operationId = `${event.section}.${event.method}`.toLowerCase();
  const eventOpType = extrinsicOpMap[operationId];
  if (eventOpType) {
    const params = event.typeDef.map(({ type }) => ({
      type: getTypeDef(type),
    }));
    const values = event.data.map((value) => ({ isValid: true, value }));
    const args = params.map((param, index) => values[index].value);

    const destAccountAddress = getEffectedAccountFromEvent(
      operationId,
      args,
      api,
      networkIdentifier
    );
    const balanceAmount = await getOperationAmountFromEvent(
      operationId,
      args,
      api,
      blockNumber
    );
    const sourceAccountAddress = getSourceAccountFromEvent(operationId, args);

    addToOperations(
      operations,
      eventOpType,
      status,
      destAccountAddress as string,
      balanceAmount as BN,
      sourceAccountAddress,
      currency
    );
  } else {
    console.error(
      `unprocessed event:\n\t${event.section}:${
        event.method
      }:: (phase=${record.phase.toString()}) `
    );
  }
}

//Transactions
export async function getTransactionsFromEvents(
  allRecords: Vec<EventRecord>,
  api: ApiPromise,
  currency: Currency,
  networkIdentifier: SubstrateNetworkIdentifier,
  blockNumber: BlockNumber | number
): Promise<any> {
  const extrinsicStatus = OPERATION_STATUSES.SUCCESS;
  return (
    await Promise.all(
      allRecords.map(async (record) => {
        const operations = [];
        await processRecordToOp(
          api,
          record,
          operations,
          null,
          extrinsicStatus,
          allRecords,
          currency,
          networkIdentifier,
          blockNumber
        );
        if (operations.length) {
          const transactionIdentifier = new TransactionIdentifier(
            u8aToHex(record.hash).substr(2)
          );
          return new Transaction(transactionIdentifier, operations);
        }

        return undefined;
      })
    )
  ).filter((event) => event !== undefined);
}

export async function getTransactions(
  currentBlock: SignedBlock,
  allRecords: Vec<EventRecord>,
  api: ApiPromise,
  shouldDisplay: (
    section: string,
    method: string,
    hash: CodecHash | string
  ) => boolean,
  paymentInfos: { partialFee: BN }[],
  currency: Currency,
  networkIdentifier: SubstrateNetworkIdentifier
) {
  const transactions: Transaction[] = [];
  const fees = [];

  // map between the extrinsics and events
  const { extrinsics } = currentBlock.block;
  const blockNumber = currentBlock.block.header.number.toNumber();

  const promises = extrinsics.map(async (extrinsic, index) => {
    const {
      method: { method, section, args },
      hash,
    } = extrinsic;
    const extrinsicMethod = `${section}.${method}`.toLowerCase();
    if (extrinsicMethod === "timestamp.set") {
      return;
    }

    const paymentInfo = paymentInfos[index];
    const transactionIdentifier = new TransactionIdentifier(
      hash.toHex().substr(2)
    );
    const operations = [];

    let paysFee = false;
    if (!shouldDisplay || shouldDisplay(section, method, hash)) {
      // Get extrinsic status/fee info
      let extrinsicStatus = OPERATION_STATUSES.UNKNOWN;
      allRecords
        .filter(
          ({ phase }) =>
            phase.isApplyExtrinsic && phase.asApplyExtrinsic.eq(index)
        )
        .forEach((record) => {
          const { event } = record;
          const extrinsicAction = `${event.section}:${event.method}`;
          const extrinsicSuccess = extrinsicAction === EXTRINSIC_SUCCESS_EVENT;
          const extrinsicFailed = extrinsicAction === EXTRINSIC_FAILED_EVENT;
          if (extrinsicSuccess) {
            extrinsicStatus = OPERATION_STATUSES.SUCCESS;
          } else if (extrinsicFailed) {
            extrinsicStatus = OPERATION_STATUSES.FAILURE;
          }

          if (extrinsicSuccess || extrinsicFailed) {
            const eventData = event.toHuman().data as any[];
            eventData.forEach((data) => {
              if (data && data.paysFee === "Yes") {
                paysFee = true;
              }
            });
          }
        });

      // Parse events
      if (extrinsicStatus === OPERATION_STATUSES.SUCCESS) {
        await Promise.all(
          allRecords
            .filter(
              ({ phase }) =>
                phase.isApplyExtrinsic && phase.asApplyExtrinsic.eq(index)
            )
            .map(async (record) =>
              processRecordToOp(
                api,
                record,
                operations,
                args,
                extrinsicStatus,
                allRecords,
                currency,
                networkIdentifier,
                blockNumber
              )
            )
        );
      } else {
        // When an extrinsic fails we cant rely on the events to parse its operations
        const operationType =
          extrinsicOpMap[extrinsicMethod] || extrinsicMethod;
        const destAccountAddress = getEffectedAccountFromExtrinsic(
          extrinsic,
          extrinsicMethod
        );
        const balanceAmount = getOperationAmountFromExtrinsic(
          api,
          extrinsic,
          extrinsicMethod
        );
        const sourceAccountAddress = getSourceAccountFromExtrinsic(extrinsic);
        if (balanceAmount) {
          addToOperations(
            operations,
            operationType,
            extrinsicStatus,
            destAccountAddress,
            balanceAmount,
            sourceAccountAddress,
            currency
          );
        }
      }
    }

    if (operations.length > 0) {
      transactions.push(new Transaction(transactionIdentifier, operations));
    }

    const extrinsicData = extrinsic.toHuman() as any;
    const txFee = paymentInfo ? paymentInfo.partialFee.neg().toString() : "";
    if (extrinsicData.isSigned && paysFee && txFee) {
      fees.push({
        account: new AccountIdentifier(extrinsicData.signer),
        amount: new Amount(txFee, currency),
      });
    }
  });

  await Promise.all(promises);

  return {
    transactions,
    fees,
  };
}

export const getTransactionFromPool = (
  api: ApiPromise,
  transaction: Extrinsic,
  currency: Currency
): Transaction => {
  const transactionHash = transaction.hash.toString().substr(2);
  const operations = getOperationsFromExtrinsic(api, transaction, currency);
  return {
    transaction_identifier: new TransactionIdentifier(transactionHash),
    operations,
  };
};
