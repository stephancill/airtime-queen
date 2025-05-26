import { withAuth } from "@/lib/auth";
import { ZARP_TOKEN, ZARP_YIELD_TOKEN } from "@/lib/addresses";
import { getKnownAddressLabel } from "@/lib/addresses";
import { db } from "@/lib/db";
import { Address, getAddress } from "viem";

interface TransactionResponse {
  items: Array<{
    from: {
      hash: string;
      name?: string;
      ens_domain_name?: string;
      private_tags?: Array<{ label: string }>;
      public_tags?: Array<{ label: string }>;
    };
    to: {
      hash: string;
      name?: string;
      ens_domain_name?: string;
      private_tags?: Array<{ label: string }>;
      public_tags?: Array<{ label: string }>;
    };
    token: {
      address: string;
      name: string;
      decimals: string;
    };
    type: string;
    timestamp: string;
    total: {
      value: string;
      decimals: string;
    };
  }>;
  next_page_params?: {
    block_number: number;
    index: number;
  };
}

export const GET = withAuth(async (req, user) => {
  const { walletAddress } = user;

  const pageParams = new URLSearchParams({
    type: "ERC-20",
    filter: "to | from",
    token: ZARP_TOKEN.address,
  });

  // Add pagination parameters if they exist
  const blockNumber = req.nextUrl.searchParams.get("blockNumber");
  const index = req.nextUrl.searchParams.get("index");

  if (blockNumber && index) {
    pageParams.append("block_number", blockNumber);
    pageParams.append("index", index);
  }

  const response = await fetch(
    `https://base.blockscout.com/api/v2/addresses/${walletAddress}/token-transfers?${pageParams.toString()}`
  );

  const data: TransactionResponse = await response.json();

  // Get a map of all mentioned addresses
  const mentionedAddresses = new Set<Address>();
  data.items.forEach((item) => {
    mentionedAddresses.add(getAddress(item.to.hash));
    mentionedAddresses.add(getAddress(item.from.hash));
  });

  // Get labels for all mentioned addresses from database where available
  // TODO: Use usernames instead of phone numbers in future
  const userLabels = await db
    .selectFrom("users")
    .select(["walletAddress", "phoneNumber"])
    .where("walletAddress", "in", Array.from(mentionedAddresses))
    .execute();

  console.log("userLabels", userLabels);

  const userLabelsMap: Record<Address, string> = {};
  userLabels.forEach((user) => {
    userLabelsMap[user.walletAddress as Address] = user.phoneNumber;
  });

  // Transform the response to include only the requested fields
  const transformedItems = data.items.map((item) => {
    const isIncoming =
      item.to.hash.toLowerCase() === walletAddress.toLowerCase();

    // Calculate the actual amount using the decimals
    const amount =
      Number(item.total.value) / Math.pow(10, Number(item.total.decimals));

    // Get known address labels first
    const toKnownLabel =
      getKnownAddressLabel(item.to.hash) ||
      userLabelsMap[getAddress(item.to.hash)];
    const fromKnownLabel =
      getKnownAddressLabel(item.from.hash) ||
      userLabelsMap[getAddress(item.from.hash)];
    const tokenLabel =
      getKnownAddressLabel(item.token.address) || item.token.name;

    // Determine Cash label precedence
    const toIsCash = item.to.hash.toLowerCase() === walletAddress.toLowerCase();
    const fromIsCash =
      item.from.hash.toLowerCase() === walletAddress.toLowerCase();

    // Determine type and color based on token and direction
    let typeLabel = isIncoming ? "Receive" : "Send";
    let color = isIncoming ? "green" : "red";

    if (
      item.to.hash.toLowerCase() === ZARP_YIELD_TOKEN.address.toLowerCase() ||
      item.from.hash.toLowerCase() === ZARP_YIELD_TOKEN.address.toLowerCase()
    ) {
      typeLabel = "Transfer";
      color = "neutral";
    }

    return {
      toAddress: item.to.hash,
      fromAddress: item.from.hash,
      toLabel:
        toKnownLabel ||
        (toIsCash ? "Cash" : null) ||
        item.to.name ||
        item.to.ens_domain_name ||
        item.to.private_tags?.[0]?.label ||
        item.to.public_tags?.[0]?.label ||
        null,
      fromLabel:
        fromKnownLabel ||
        (fromIsCash ? "Cash" : null) ||
        item.from.name ||
        item.from.ens_domain_name ||
        item.from.private_tags?.[0]?.label ||
        item.from.public_tags?.[0]?.label ||
        null,
      typeLabel,
      color,
      tokenAddress: item.token.address,
      tokenLabel,
      timestamp: item.timestamp,
      amount: amount.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 6,
      }),
    };
  });

  return Response.json({
    items: transformedItems,
    nextPageParams: data.next_page_params
      ? {
          blockNumber: data.next_page_params?.block_number,
          index: data.next_page_params?.index,
        }
      : undefined,
  });
});
