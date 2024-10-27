import { LinkdropSDK } from "linkdrop-sdk";
import crypto from "crypto";

const baseUrl =
  typeof globalThis !== "undefined" && typeof globalThis.window !== "undefined"
    ? `${globalThis.window.location.origin}`
    : "https://p2p.linkdrop.io"; // baseUrl is the host to be used to generate claim URLs. Required
// const apiKey = "spfurjdmvfkdlfo" // apiKey is the string parameter that will be passed to headers as Bearer token ("authorization" header). Not required. Default value: null
// const apiUrl = "https://api.myurl.com" // apiUrl is the string parameter that will be used as request url prefix for endpoints. Not required. Default value: https://escrow-api.linkdrop.io/v3
const getRandomBytes = (length: number) => {
  return new Uint8Array(crypto.randomBytes(length));
}; // To avoid using and linking native crypto libraries, we ask to pass a random bytes generation function. Required

export const linkdropSdk = new LinkdropSDK({
  baseUrl,
  getRandomBytes,
  apiKey: process.env.NEXT_PUBLIC_LINKDROP_API_KEY,
});
