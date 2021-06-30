import { ApiPromise, WsProvider } from "@polkadot/api";

export async function getApi(ws: string): Promise<ApiPromise> {
  const provider = new WsProvider(ws);

  return await ApiPromise.create({ provider });
}
