import { withAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getAddress } from "viem";

export const GET = withAuth(async (req) => {
  const addressRaw = req.nextUrl.searchParams.get("walletAddress");

  if (!addressRaw) {
    return Response.json(
      { error: "Wallet address is required" },
      { status: 400 }
    );
  }

  const parsedAddress = getAddress(addressRaw);

  const user = await db
    .selectFrom("users")
    .where("walletAddress", "=", parsedAddress)
    .select(["phoneNumber"])
    .executeTakeFirst();

  if (!user) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }

  return Response.json({ user });
});
