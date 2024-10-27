"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { AuthLayout } from "../../layouts/AuthLayout";
import { useQuery, useMutation } from "@tanstack/react-query";
import { linkdropSdk } from "../../lib/linkdrop";
import { LoadingScreen } from "../../components/LoadingScreen";
import { useEffect } from "react";
import { Button } from "../../components/Button";
import { useAccount } from "wagmi";

export default function ClaimPage() {
  const searchParams = useSearchParams();
  const account = useAccount();
  const router = useRouter();

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

  const { mutate: redeem, isPending } = useMutation({
    mutationFn: async (address: string) => {
      return claimLink?.redeem(address);
    },
    onSuccess: (data) => {
      console.log(data);
      router.push("/");
    },
  });

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <AuthLayout>
      <div>Claim</div>
      {claimLink ? (
        <div>
          <pre>{JSON.stringify(claimLink, null, 2)}</pre>
          {account?.address !== undefined && (
            <Button
              onClick={() => redeem(account.address!)}
              disabled={isPending || claimLink.status === "redeemed"}
            >
              {isPending
                ? "Redeeming..."
                : claimLink.status === "redeemed"
                  ? "Already Redeemed"
                  : "Redeem"}
            </Button>
          )}
        </div>
      ) : null}
      {error ? <pre>{JSON.stringify(error, null, 2)}</pre> : null}
    </AuthLayout>
  );
}
