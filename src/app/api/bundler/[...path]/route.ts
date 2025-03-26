import { createProxyRequestHandler } from "@/lib/utils";

// TODO: make the target URL a transformation of the request URL
// export const POST = createProxyRequestHandler("https://api.pimlico.io", {
//   searchParams: {
//     apikey: process.env.PIMLICO_API_KEY,
//   },
// });

const chainIdToName: Record<string, string> = {
  "8453": "base",
};

export const POST = createProxyRequestHandler((req) => {
  // Last segment of the path is the chain ID
  const chainId = req.nextUrl.pathname.split("/").pop();
  if (!chainId) {
    throw new Error("No chain ID");
  }

  const name = chainIdToName[chainId];
  if (!name) {
    throw new Error(`Invalid chain ID: ${chainId}`);
  }

  return `https://api.developer.coinbase.com/rpc/v1/${name}/${process.env.CDP_API_KEY}`;
});
