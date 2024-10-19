import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { parsePhoneNumber } from "libphonenumber-js/min";

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
