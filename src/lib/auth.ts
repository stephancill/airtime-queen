import { User } from "@/types/user";
import { parsePhoneNumber } from "libphonenumber-js/min";
import { Lucia } from "lucia";
import { NextRequest, NextResponse } from "next/server";
import { Address } from "viem";
import { Hex } from "webauthn-p256";
import { AUTH_SESSION_COOKIE_NAME } from "./constants";
import { getAuthAdapter } from "./db";
import { AuthError } from "./errors";

const adapter = getAuthAdapter();

export const lucia = new Lucia(adapter, {
  sessionCookie: {
    attributes: {
      // set to `true` when using HTTPS
      secure: process.env.NODE_ENV === "production",
    },
    name: AUTH_SESSION_COOKIE_NAME,
  },
  getUserAttributes: (attributes) => {
    return {
      id: attributes.id,
      walletAddress: attributes.wallet_address,
      passkeyId: attributes.passkey_id,
      passkeyPublicKey: attributes.passkey_public_key,
      createdAt: attributes.created_at,
      updatedAt: attributes.updated_at,
      phoneNumber: attributes.phone_number,
      countryCode: parsePhoneNumber(attributes.phone_number).country!, // This should never fail because phone number is already validated
      verifiedAt: attributes.verified_at,
    } satisfies User;
  },
});

export type UserRouteHandler<T extends Record<string, object | string> = {}> = (
  req: NextRequest,
  user: NonNullable<Awaited<ReturnType<typeof lucia.validateSession>>["user"]>,
  context: T
) => Promise<Response>;

export function withAuth<T extends Record<string, object | string> = {}>(
  handler: UserRouteHandler<T>,
  {
    requireVerified = true,
  }: {
    requireVerified?: boolean;
  } = {}
) {
  return async (req: NextRequest, context: T): Promise<Response> => {
    try {
      const cookieHeader = req.headers.get("Cookie");
      const authorizationHeader = req.headers.get("Authorization");
      const token =
        lucia.readBearerToken(authorizationHeader ?? "") ||
        lucia.readSessionCookie(cookieHeader ?? "");

      const result = await lucia.validateSession(token ?? "");
      if (!result.session) {
        throw new AuthError("Invalid session");
      }

      if (requireVerified && !result.user.verifiedAt) {
        throw new AuthError("User not verified");
      }

      return handler(req, result.user, context);
    } catch (error) {
      if (error instanceof AuthError) {
        return NextResponse.json({ error: error.message }, { status: 401 });
      }
      console.error("Unexpected error in withAuth:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  };
}

declare module "lucia" {
  interface Register {
    Lucia: typeof lucia;
    DatabaseUserAttributes: {
      id: string;
      wallet_address: Address;
      passkey_id: string;
      passkey_public_key: Hex;
      created_at: Date;
      updated_at: Date;
      phone_number: string;
      verified_at: Date | null;
    };
  }
}
