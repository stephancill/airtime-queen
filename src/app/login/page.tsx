"use client";

import { Button } from "@/components/Button";
import { CHALLENGE_DURATION_SECONDS } from "@/lib/constants";
import { createUUID, serializeSignReturnType } from "@/lib/utils";
import { useSession } from "@/providers/SessionProvider";
import { useMutation, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import { Hex } from "viem";
import { sign, SignReturnType, WebAuthnData } from "webauthn-p256";
import { LoadingScreen } from "@/components/LoadingScreen";

/**
 * Lets the user sign in using a passkey and stores the user metadata in local storage.
 *
 * To do this, it needs to:
 * [x] Get a challenge from the server
 * [x] Sign the challenge
 * [x] Send the signed challenge to the server
 */

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refetch } = useSession();

  const [nonce] = useState(() => createUUID());

  const {
    data: challenge,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["challenge", nonce],
    queryFn: async () => {
      const response = await fetch("/api/challenge", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ nonce }),
      });
      if (!response.ok) {
        throw new Error("Failed to fetch challenge");
      }
      const { challenge } = (await response.json()) as { challenge: Hex };

      return challenge;
    },
    refetchInterval: CHALLENGE_DURATION_SECONDS * 1000,
  });

  const signInMutation = useMutation({
    mutationFn: async (credential: SignReturnType) => {
      const credentialToSend: {
        signature: Hex;
        webauthn: WebAuthnData;
        raw: { id: string };
      } = serializeSignReturnType(credential);

      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          credential: {
            ...credentialToSend,
          },
          nonce,
        }),
      });
      if (!response.ok) {
        try {
          const { error } = await response.json();
          console.error(error);
          throw new Error(error);
        } catch (error) {
          throw new Error("Failed to login");
        }
      }
      const { user } = await response.json();

      return user;
    },
    onSuccess: (user) => {
      refetch();

      const redirectUrl = searchParams.get("redirect");

      if (redirectUrl) {
        router.push(decodeURIComponent(redirectUrl));
      } else {
        router.push("/");
      }
    },
    onError: (error) => {
      console.error(error);
    },
  });

  const signInWithPasskey = useCallback(async () => {
    if (!challenge) return;

    const credential = await sign({ hash: challenge });
    signInMutation.mutate(credential);
  }, [challenge, signInMutation]);

  if (isLoading) return <LoadingScreen />;
  if (error) return <div>Error: {(error as Error).message}</div>;

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100dvh-65px)] gap-8">
      <div className="text-3xl font-bold">Airtime Wallet</div>

      <div className="flex flex-col gap-4 mt-[30px] w-full px-2 md:px-10">
        <Button onClick={() => signInWithPasskey()}>
          <div className="text-xl">
            {signInMutation.isPending ? "Signing in..." : "Sign in"}
          </div>
        </Button>
        <Link
          href={{
            pathname: "/sign-up",
            query: { redirect: searchParams.get("redirect") },
          }}
          className="text-gray-500 text-center"
        >
          Don't have an account? Sign up
        </Link>
      </div>
    </div>
  );

  return (
    <div>
      <button
        onClick={() => signInWithPasskey()}
        disabled={signInMutation.isPending || !challenge}
      >
        {signInMutation.isPending ? "Signing in..." : "Sign in with passkey"}
      </button>
      {signInMutation.isError && (
        <div>Error: {(signInMutation.error as Error).message}</div>
      )}
      <div>
        <Link
          href={{
            pathname: "/sign-up",
            query: { redirect: searchParams.get("redirect") },
          }}
        >
          Don't have an account? Sign up
        </Link>
      </div>
    </div>
  );
}
