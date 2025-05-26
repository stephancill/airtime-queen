import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { redis } from "@/lib/redis";
import { createPublicClient, getAddress, Hex, http } from "viem";
import {
  toCoinbaseSmartAccount,
  toWebAuthnAccount,
} from "viem/account-abstraction";
import { base } from "viem/chains";
import { lucia } from "@/lib/auth";
import { parsePhoneNumber } from "libphonenumber-js/min";

export async function POST(req: NextRequest) {
  const {
    phoneNumber: phoneNumberRaw,
    passkeyId,
    passkeyPublicKey,
    nonce,
  } = await req.json();

  // Validate the phone number
  const parsedPhoneNumber = parsePhoneNumber(phoneNumberRaw, {
    defaultCountry: "ZA",
  });
  if (!parsedPhoneNumber.isValid()) {
    return Response.json(
      {
        error: "Invalid phone number. Must start with +27 followed by 9 digits",
      },
      { status: 400 }
    );
  }

  // Validate the challenge
  const challenge = (await redis.get(`challenge:${nonce}`)) as Hex | null;

  if (!challenge) {
    return Response.json({ error: "Challenge not found" }, { status: 404 });
  }

  // Check if the phone number is already registered
  const existingUser = await db
    .selectFrom("users")
    .where("phoneNumber", "=", parsedPhoneNumber.number)
    .where("verifiedAt", "is not", null)
    .selectAll()
    .executeTakeFirst();

  if (existingUser) {
    return Response.json(
      { error: "Phone number already exists" },
      { status: 400 }
    );
  }

  const baseClient = createPublicClient({
    chain: base,
    transport: http(),
  });
  const account = await toCoinbaseSmartAccount({
    owners: [
      toWebAuthnAccount({
        credential: {
          id: passkeyId,
          publicKey: passkeyPublicKey,
        },
      }),
    ],
    client: baseClient,
  });

  // Create the new user
  const newUser = await db
    .insertInto("users")
    .values({
      phoneNumber: parsedPhoneNumber.number,
      passkeyId,
      passkeyPublicKey,
      walletAddress: getAddress(account.address),
    })
    .returningAll()
    .executeTakeFirst();

  if (!newUser) {
    return Response.json({ error: "Failed to create user" }, { status: 500 });
  }

  // Delete the used challenge
  await redis.del(`challenge:${nonce}`);

  const session = await lucia.createSession(newUser.id, {});

  return Response.json(
    {
      success: true,
      user: newUser,
      session,
    },
    {
      headers: {
        "Set-Cookie": lucia.createSessionCookie(session.id).serialize(),
      },
    }
  );
}

export async function GET(req: NextRequest) {
  const phoneNumberRaw = req.nextUrl.searchParams.get("phoneNumber");

  if (!phoneNumberRaw) {
    return Response.json(
      {
        error: "Phone number is required.",
      },
      { status: 400 }
    );
  }

  // Validate the phone number
  const parsedPhoneNumber = parsePhoneNumber(phoneNumberRaw, {
    defaultCountry: "ZA",
  });
  if (!parsedPhoneNumber.isValid()) {
    return Response.json(
      {
        error: "Invalid phone number.",
      },
      { status: 400 }
    );
  }

  // Check if the phone number is already registered and verified
  const existingUser = await db
    .selectFrom("users")
    .where("phoneNumber", "=", parsedPhoneNumber.number)
    .where("verifiedAt", "is not", null)
    .selectAll()
    .executeTakeFirst();

  if (existingUser) {
    return Response.json(
      { error: "Phone number already registered and verified" },
      { status: 400 }
    );
  }

  return Response.json({ available: true });
}
