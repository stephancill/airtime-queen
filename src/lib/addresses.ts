import { Token, YieldToken } from "../types/token";

export const LINKDROP_ESCROW_ADDRESS =
  "0x139B79602B68E8198EA3D57f5E6311fd98262269" as const;

export const USDC_TOKEN: Token = {
  symbol: "USDC",
  address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  chainId: 8453,
  decimals: 6,
} as const;

export const USDC_YIELD_TOKEN: YieldToken = {
  symbol: "aBasUSDC",
  address: "0x4e65fE4DbA92790696d040ac24Aa414708F5c0AB",
  chainId: 8453,
  decimals: 6,
  yieldPool: "0xA238Dd80C259a72e81d7e4664a9801593F98d1c5",
} as const;

export const ZARP_TOKEN: Token = {
  symbol: "ZARP",
  address: "0xb755506531786C8aC63B756BaB1ac387bACB0C04",
  chainId: 8453,
  decimals: 18,
} as const;

// This is a dummy yield token with 0% yield
export const ZARP_YIELD_TOKEN: YieldToken = {
  symbol: "aBasZARP",
  address: "0xf5a7bb26376093a5e44168abed2eb581366b2cce",
  chainId: 8453,
  decimals: 18,
  yieldPool: "0xf5a7bb26376093a5e44168abed2eb581366b2cce",
} as const;

export const ALL_TOKENS = [USDC_TOKEN, ZARP_TOKEN];

export const KNOWN_ADDRESSES: Record<string, string> = {
  [ZARP_TOKEN.address.toLowerCase()]: "ZAR",
  [ZARP_YIELD_TOKEN.address.toLowerCase()]: "Savings",
  [LINKDROP_ESCROW_ADDRESS.toLowerCase()]: "Linkdrop Escrow",
  // TODO: Merchant address for Sale type
};

export const tokenByCountryCode: Record<string, Token> = {
  ZA: ZARP_TOKEN,
  default: USDC_TOKEN,
} as const;

export const yieldTokenByBaseToken: Record<string, YieldToken> = {
  [ZARP_TOKEN.address]: ZARP_YIELD_TOKEN,
};

export function getBaseToken(countryCode: string) {
  return tokenByCountryCode[countryCode] || tokenByCountryCode.default;
}

export function getYieldToken(token: Token): YieldToken | undefined {
  return yieldTokenByBaseToken[token.address];
}

export function getKnownAddressLabel(address: string): string | null {
  return KNOWN_ADDRESSES[address.toLowerCase()] || null;
}
