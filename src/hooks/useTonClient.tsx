import { TonClient } from "@ton/ton";
import { useInit } from "./useInit";
/**
 * @params -3 测试网
 * @params -239 正式网
 */
type ChainType = '-3' | '-239' | string;


export function useTonClient(chain: ChainType = '-3') {
  return useInit(
    async () => {
      const endpoint = chain === '-3' 
        ? "https://testnet.toncenter.com/api/v2/jsonRPC"
        : "https://toncenter.com/api/v2/jsonRPC";
      return new TonClient({ endpoint });
    },
    [chain]
  );
}