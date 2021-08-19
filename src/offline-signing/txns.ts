import {
  createSigningPayload,
  methods,
  UnsignedTransaction,
} from "@substrate/txwrapper";
import Registry from "./registry";

interface TransferParams {
  from: string;
  to: string;
  value: string | number;
  tip?: number;
  nonce: number;
  eraPeriod?: number;
  blockNumber: number;
  blockHash: string;
  registry: Registry;
}
interface TransferTxn {
  unsignedTxn: UnsignedTransaction;
  signingPayload: string;
}

export default function buildTransferTxn({
  from,
  to,
  value,
  tip,
  nonce,
  eraPeriod,
  blockNumber,
  blockHash,
  registry,
}: TransferParams): TransferTxn {
  const unsignedTxn = methods.balances.transfer(
    {
      value,
      dest: to,
    },
    {
      address: from,
      blockHash,
      blockNumber,
      eraPeriod,
      genesisHash: registry.chainInfo.genesis,
      metadataRpc: registry.metadata,
      nonce,
      specVersion: registry.chainInfo.specVersion,
      tip,
      transactionVersion: registry.chainInfo.transactionVersion,
    },
    {
      metadataRpc: registry.metadata,
      registry: registry.registry,
    }
  );
  const signingPayload = createSigningPayload(unsignedTxn, {
    registry: registry.registry,
  });
  return {
    unsignedTxn,
    signingPayload,
  };
}
