import { withAuth } from "@/lib/auth";
import { createProxyRequestHandler } from "@/lib/utils";
import { parsePhoneNumber } from "libphonenumber-js/min";

export const GET = withAuth(async (req, user, context) => {
  const parsedPhone = parsePhoneNumber(user.phoneNumber);

  if (parsedPhone.country !== "ZA") {
    return Response.json(
      { error: "No products available in your region yet." },
      {
        status: 400,
      }
    );
  }

  return createProxyRequestHandler(`${process.env.MERCHANT_API_URL}/products`)(
    req,
    context
  );
});
