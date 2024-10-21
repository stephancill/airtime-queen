import { parsePhoneNumber } from "libphonenumber-js/min";
import { withAuth } from "@/lib/auth";
import { db } from "@/lib/db";

export const GET = withAuth(async (req) => {
  const phoneNumberRaw = req.nextUrl.searchParams.get("phoneNumber");

  console.log("phoneNumberRaw", phoneNumberRaw);

  if (!phoneNumberRaw) {
    return Response.json(
      { error: "Phone number is required" },
      { status: 400 }
    );
  }

  const parsedPhoneNumber = parsePhoneNumber(phoneNumberRaw, {
    defaultCountry: "ZA",
  });

  const user = await db
    .selectFrom("users")
    .where("phoneNumber", "=", parsedPhoneNumber.number)
    .select(["walletAddress"])
    .executeTakeFirst();

  if (!user) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }

  return Response.json({ user });
});
