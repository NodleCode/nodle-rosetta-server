import { cryptoWaitReady, encodeAddress } from "@polkadot/util-crypto";
import { KeypairType } from "@polkadot/util-crypto/types";
import { Keyring } from "@polkadot/keyring";
import { CurveType } from "types";

const curveToTypeMap = {
  secp256k1: "ecdsa",
  secp256r1: "ecdsa",
  edwards25519: "ed25519",
};

// Keyrings mapped by type (ecdsa, sr25519 etc)
const keyrings: { [key: string]: Keyring } = {};

export async function getKeyring(
  curve: KeypairType,
  ss58Format = 42
): Promise<Keyring> {
  await cryptoWaitReady();
  const keypairType: KeypairType = curveToTypeMap[curve] || curve;
  if (!keypairType) {
    throw new Error(`Unsupported curve type: ${curve}`);
  }
  if (!keyrings[keypairType]) {
    keyrings[keypairType] = new Keyring({ ss58Format, type: keypairType });
  }
  return keyrings[keypairType];
}

export async function publicKeyToAddress(
  hexStr: string | Uint8Array,
  curve: KeypairType | CurveType,
  ss58Format = 42
) {
  // const keyring = await getKeyring(curve, ss58Format);
  // const seed = hexToU8a(hexStr);
  return encodeAddress(hexStr, ss58Format);
}
