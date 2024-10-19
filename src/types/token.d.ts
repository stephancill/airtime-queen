import { chains } from "../lib/wagmi";

export type Token = {
  name: string;
  address: `0x${string}`;
  chainId: (typeof chains)[number]["id"];
  decimals: number;
};
