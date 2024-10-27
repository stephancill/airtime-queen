import { Token } from "../types/token";

export const CHALLENGE_DURATION_SECONDS = 60;
export const AUTH_SESSION_COOKIE_NAME = "auth_session";

export const BASE_TOKEN: Token = {
  name: "USDC",
  address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  chainId: 8453,
  decimals: 6,
} as const;

export const YIELD_TOKEN: Token = {
  name: "aBasUSDC",
  address: "0x4e65fE4DbA92790696d040ac24Aa414708F5c0AB",
  chainId: 8453,
  decimals: 6,
} as const;

export const BASE_TOKEN_AAVE_POOL =
  "0xA238Dd80C259a72e81d7e4664a9801593F98d1c5" as const;

export const LINKDROP_ESCROW_ADDRESS =
  "0x139B79602B68E8198EA3D57f5E6311fd98262269" as const;
