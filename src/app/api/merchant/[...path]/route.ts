import { createProxyRequestHandler } from "@/lib/utils";
import { withAuth } from "@/lib/auth";
import jwt from "jsonwebtoken";

function createJWT(user: object): string {
  return jwt.sign(user, process.env.MERCHANT_JWT_SECRET, { expiresIn: "1h" });
}

export const POST = withAuth(async (req, user, context) => {
  const jwt = createJWT({
    id: user.id,
    walletAddress: user.walletAddress,
  });

  return createProxyRequestHandler(process.env.MERCHANT_API_URL, {
    headers: {
      "x-trusted-user-data": jwt,
    },
  })(req, context);
});

export const GET = createProxyRequestHandler(process.env.MERCHANT_API_URL);
