import { Button } from "@/components/ui/button";
import type { PurchaseDetails } from "../../types/purchase";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { Address, erc20Abi } from "viem";
import { Product } from "../../types/products";
import { formatTokenAmount } from "../../lib/utils";

interface Props {
  details: PurchaseDetails;
  onNext: () => void;
  onBack: () => void;
}

export type Quote = {
  id: string;
  tokenQuote: {
    address: Address;
    decimals: number;
    chainId: number;
    amount: string;
    symbol: string;
  };
  paymentDestination: Address;
  expiresAt: string;
  metadata: Record<string, string>;
  productId: string;
  quantity: number;
  status: "PENDING" | "PAYMENT_RECEIVED" | "COMPLETED" | "FULFILLMENT_ERROR";
};

type QuoteResponse = {
  quote: Quote;
  signatureParameters: {
    messagePartial: {
      quoteId: string;
    };
    types: any;
    domain: any;
  };
  product: Product;
};

const fetchQuote = async (
  productId: string,
  quantity: number = 1,
  metadata: Record<string, string> = {}
): Promise<QuoteResponse> => {
  const response = await fetch("/api/merchant/quote", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ productId, quantity, metadata }),
  });
  if (!response.ok) {
    throw new Error("Failed to fetch quote");
  }
  return response.json();
};

const fulfillOrder = async ({
  quoteId,
  transactionHash,
  signer,
}: {
  quoteId: string;
  transactionHash: string;
  signer: Address;
}): Promise<void> => {
  const response = await fetch("/api/merchant/fulfill", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      quoteId,
      transactionHash,
      signature: "0x123",
      signer,
    }),
  });
  if (!response.ok) {
    throw new Error("Failed to fulfill order");
  }
};

export function PurchaseReview({ details, onNext, onBack }: Props) {
  const { writeContractAsync, isPending: isWriteContractPending } =
    useWriteContract();
  const { address } = useAccount();

  const quoteQuery = useQuery({
    queryKey: ["quote", details.productId, details.msisdn],
    queryFn: () => {
      if (!details.msisdn || !details.productId)
        throw new Error("Missing phone number or product id");

      return fetchQuote(details.productId, 1, {
        phoneNumber: details.msisdn,
      });
    },
    enabled: Boolean(details.productId && details.msisdn),
  });

  const account = useAccount();

  const {
    data: tokenBalance,
    isLoading: isLoadingBalances,
    error: errorBalances,
  } = useReadContract({
    address: quoteQuery.data?.quote.tokenQuote.address,
    chainId: quoteQuery.data?.quote.tokenQuote.chainId as any, // TODO: properly type this
    abi: erc20Abi,
    functionName: "balanceOf",
    args: account.address ? [account.address] : undefined,
    query: {
      refetchInterval: 5_000,
      enabled: !!quoteQuery.data,
    },
  });

  const fulfillMutation = useMutation({
    mutationFn: ({
      quoteId,
      transactionHash,
    }: {
      quoteId: string;
      transactionHash: string;
    }) => {
      if (!address) throw new Error("Missing address");
      return fulfillOrder({ quoteId, transactionHash, signer: address });
    },
  });

  const hasInsufficientFunds = Boolean(
    quoteQuery.data &&
      tokenBalance !== undefined &&
      BigInt(tokenBalance) < BigInt(quoteQuery.data.quote.tokenQuote.amount)
  );

  const handlePurchase = async () => {
    try {
      if (!quoteQuery.data) throw new Error("Quote not available");
      const { quote } = quoteQuery.data;

      // Execute the payment transaction
      const hash = await writeContractAsync({
        address: quote.tokenQuote.address,
        abi: erc20Abi,
        functionName: "transfer",
        args: [quote.paymentDestination, BigInt(quote.tokenQuote.amount)],
      });

      // Fulfill the order
      await fulfillMutation.mutateAsync({
        quoteId: quote.id,
        transactionHash: hash,
      });

      onNext();
    } catch (error) {
      console.error("Error during purchase:", error);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Review your purchase</h2>
      <div className="space-y-4">
        <div className="bg-gray-50 p-4 rounded-lg space-y-2">
          <p className="text-sm text-gray-600">For: {details.msisdn}</p>
          <p className="text-sm text-gray-600">Network: {details.network}</p>
          <p className="text-sm text-gray-600">Type: {details.productType}</p>
          <p className="text-sm text-gray-600">
            Validity: {details.validityLabel}
          </p>
          <p className="text-sm text-gray-600">Product: {details.bundle}</p>
          <p className="text-sm text-gray-600">
            Amount:{" "}
            {quoteQuery.isPending ? (
              <span className="inline-block w-16 h-4 bg-gray-200 animate-pulse rounded" />
            ) : quoteQuery.isSuccess ? (
              `${formatTokenAmount(
                BigInt(quoteQuery.data.quote.tokenQuote.amount),
                {
                  ...quoteQuery.data.quote.tokenQuote,
                  chainId: quoteQuery.data.quote.tokenQuote.chainId as any, // TODO: properly type this
                }
              )}`
            ) : (
              "Not available"
            )}
          </p>
          {hasInsufficientFunds && (
            <p className="text-red-500 text-sm">
              Insufficient funds. Please add more{" "}
              {quoteQuery.data?.quote.tokenQuote.symbol} to your wallet.
            </p>
          )}
        </div>
        <Button
          onClick={handlePurchase}
          className="w-full"
          disabled={
            quoteQuery.isPending ||
            fulfillMutation.isPending ||
            isWriteContractPending ||
            hasInsufficientFunds
          }
        >
          {quoteQuery.isPending ||
          fulfillMutation.isPending ||
          isWriteContractPending
            ? "Processing..."
            : hasInsufficientFunds
              ? "Insufficient Funds"
              : "Purchase"}
        </Button>
        {(quoteQuery.isError || fulfillMutation.isError) && (
          <p className="text-red-500 text-sm">
            {quoteQuery.error?.message || fulfillMutation.error?.message}
          </p>
        )}
      </div>
    </div>
  );
}
