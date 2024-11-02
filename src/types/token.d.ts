import { chains } from "../lib/wagmi";

export type Token = {
  symbol: string;
  address: `0x${string}`;
  chainId: (typeof chains)[number]["id"];
  decimals: number;
};

export type YieldToken = Token & {
  yieldPool: `0x${string}`;
};
