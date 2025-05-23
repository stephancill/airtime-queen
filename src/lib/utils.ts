import { NextRequest, NextResponse } from "next/server";
import { fallback, formatUnits, Hex, http } from "viem";
import { SignReturnType, WebAuthnData } from "webauthn-p256";
import { Token } from "../types/token";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function createProxyRequestHandler(
  targetUrl: string | ((req: NextRequest) => string),
  {
    searchParams = {},
    headers = {},
  }: {
    searchParams?: Record<string, string>;
    headers?: Record<string, string>;
  } = {}
) {
  return async function handler(
    req: NextRequest,
    context: { params?: { path: string[] } }
  ): Promise<NextResponse> {
    const url = new URL(
      typeof targetUrl === "function" ? targetUrl(req) : targetUrl
    );

    if (typeof targetUrl !== "function")
      url.pathname = [
        ...url.pathname.split("/").slice(1),
        ...(context?.params?.path ?? []),
      ].join("/");

    url.search = req.nextUrl.search;

    Object.entries(searchParams).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });

    const newReqHeaders = new Headers(req.headers);
    newReqHeaders.delete("host");

    Object.entries(headers).forEach(([key, value]) => {
      newReqHeaders.set(key, value);
    });

    try {
      const response = await fetch(url, {
        method: req.method,
        headers: newReqHeaders,
        body: req.method === "POST" ? await req.text() : undefined,
      });

      const data = await response.text();

      const newResHeaders = new Headers(response.headers);
      newResHeaders.delete("host");
      newResHeaders.delete("content-encoding");

      return new NextResponse(data, {
        status: response.status,
        statusText: response.statusText,
        headers: newResHeaders,
      });
    } catch (error) {
      console.error("Proxy error:", error);
      return new NextResponse("Internal Server Error", { status: 500 });
    }
  };
}

export function getTransportByChainId(chainId: number) {
  if (process.env[`EVM_RPC_URL_${chainId}`]) {
    return fallback([http(process.env[`EVM_RPC_URL_${chainId}`]), http()]);
  } else {
    return http();
  }
}

export function truncateAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function createUUID() {
  var s = [];
  var hexDigits = "0123456789abcdef";
  for (var i = 0; i < 36; i++) {
    s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
  }
  s[14] = "4"; // bits 12-15 of the time_hi_and_version field to 0010
  // @ts-ignore
  s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1); // bits 6-7 of the clock_seq_hi_and_reserved to 01
  s[8] = s[13] = s[18] = s[23] = "-";
  return s.join("");
}

export function serializeSignReturnType(credential: SignReturnType) {
  const credentialToSend: {
    signature: Hex;
    webauthn: WebAuthnData;
    raw: { id: string };
  } = {
    signature: credential.signature,
    webauthn: {
      authenticatorData: credential.webauthn.authenticatorData,
      challengeIndex: credential.webauthn.challengeIndex,
      clientDataJSON: credential.webauthn.clientDataJSON,
      typeIndex: credential.webauthn.typeIndex,
      userVerificationRequired: credential.webauthn.userVerificationRequired,
    },
    raw: {
      id: credential.raw.id,
    },
  };

  return credentialToSend;
}

export function bigintReplacer(key: string, value: any) {
  if (typeof value === "bigint") {
    return value.toString();
  }
  return value;
}

export function formatTokenAmount(amount: bigint, token: Token) {
  const amountFormatted = `${parseFloat(formatUnits(amount, token.decimals)).toFixed(2)}`;

  if (token.symbol === "USDC" || token.symbol === "aBasUSDC") {
    return `$${amountFormatted}`;
  }

  if (token.symbol === "ZARP" || token.symbol === "aBasZARP") {
    return `R${amountFormatted}`;
  }

  return `${amountFormatted} ${token.symbol}`;
}
