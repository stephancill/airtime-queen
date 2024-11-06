import { UserRow } from "./db";

export type User = {
  id: string;
  walletAddress: Address;
  passkeyId: string;
  passkeyPublicKey: Hex;
  createdAt: Date;
  updatedAt: Date;
  phoneNumber: string;
  verifiedAt: Date | null;
  countryCode: string;
};
