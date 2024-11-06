import { USDC_TOKEN, ZARP_TOKEN } from "@/lib/addresses";
import { linkdropSdk } from "@/lib/linkdrop";
import { formatTokenAmount } from "@/lib/utils";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getAddress } from "viem";
import { useAccount } from "wagmi";
import { BottomSheetModal } from "./BottomSheetModal";
import { Button } from "./Button";
import { TransactionSuccess } from "./TransactionSuccess";

export function ClaimView() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const account = useAccount();

  const [isOpen, setOpen] = useState(false);
  const [transactionSuccess, setTransactionSuccess] = useState(false);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);

  const {
    data: claimLink,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["claim"],
    queryFn: async () => {
      const claimLink = await linkdropSdk.getClaimLink(window.location.href);
      return claimLink;
    },
  });

  const { data: resolvedNumber } = useQuery({
    queryKey: ["resolve-number", claimLink?.sender],
    queryFn: async () => {
      const response = await fetch(
        `/api/resolve-number?walletAddress=${encodeURIComponent(claimLink?.sender!)}`
      );
      if (!response.ok) {
        throw new Error("Failed to resolve number");
      }
      const data = await response.json();
      return data.user?.phoneNumber;
    },
    enabled: !!claimLink?.sender,
  });

  const { mutate: redeem, isPending } = useMutation({
    mutationFn: async (address: string) => {
      return claimLink?.redeem(address);
    },
    onSuccess: (claimTxHash) => {
      if (!claimTxHash) return;

      setTransactionHash(claimTxHash);
      setTransactionSuccess(true);
    },
  });

  useEffect(() => {
    const intent = searchParams.get("intent");
    if (intent === "claim") {
      setOpen(true);
    }
  }, [searchParams]);

  const handleClose = () => {
    setTransactionSuccess(false);
    setTransactionHash(null);
    setOpen(false);
    router.push("/");
  };

  return (
    <div>
      <BottomSheetModal isOpen={isOpen} setOpen={setOpen}>
        <div className="text-2xl">Claim</div>
        {isLoading ? <div>Loading...</div> : null}
        {error ? <div>{error.message}</div> : null}
        {transactionSuccess ? (
          <TransactionSuccess
            message="Your tokens have been successfully claimed!"
            transactionHash={transactionHash ?? undefined}
            onClose={handleClose}
          />
        ) : (
          claimLink &&
          account?.address !== undefined && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col items-center justify-center gap-2">
                {getAddress(claimLink.token) ===
                getAddress(USDC_TOKEN.address) ? (
                  <div className="text-[50px] font-bold p-4 text-center">
                    {formatTokenAmount(BigInt(claimLink.amount), USDC_TOKEN)}
                  </div>
                ) : getAddress(claimLink.token) ===
                  getAddress(ZARP_TOKEN.address) ? (
                  <div className="text-[50px] font-bold p-4 text-center">
                    {formatTokenAmount(BigInt(claimLink.amount), ZARP_TOKEN)}
                  </div>
                ) : (
                  <div>
                    {claimLink.amount} of {claimLink.token}
                  </div>
                )}
                <div className="text-sm text-center">
                  from {resolvedNumber ?? claimLink.sender}
                </div>
              </div>
              <Button
                onClick={() => redeem(account.address!)}
                disabled={isPending || claimLink.status === "redeemed"}
              >
                {isPending
                  ? "Claiming..."
                  : claimLink.status === "redeemed"
                    ? "Already Claimed"
                    : "Claim"}
              </Button>
            </div>
          )
        )}
      </BottomSheetModal>
    </div>
  );
}
