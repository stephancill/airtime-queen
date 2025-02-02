import { sign, SignReturnType, WebAuthnData } from "webauthn-p256";
import { Hex } from "viem";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createUUID, serializeSignReturnType } from "@/lib/utils";
import { useCallback, useState } from "react";
import { CHALLENGE_DURATION_SECONDS } from "@/lib/constants";
import { useSession } from "../providers/SessionProvider";

interface UseSignInWithPasskeyProps {
  onSuccess?: (user: any) => void;
}

export function useSignInWithPasskey({ onSuccess }: UseSignInWithPasskeyProps) {
  const [nonce] = useState(() => createUUID());
  const { user, isLoading: isUserLoading } = useSession();

  const {
    data: challenge,
    isLoading: isChallengeLoading,
    error: challengeError,
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
    enabled: !user && !isUserLoading,
  });

  const signInMutation = useMutation({
    mutationFn: async (credential: SignReturnType) => {
      const credentialToSend = serializeSignReturnType(credential);

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
    onSuccess,
    onError: (error) => {
      console.error(error);
    },
  });

  const signInWithPasskey = useCallback(async () => {
    if (!challenge) return;

    const credential = await sign({ hash: challenge });
    signInMutation.mutate(credential);
  }, [challenge, signInMutation]);

  return {
    signInWithPasskey,
    isPending: signInMutation.isPending || isChallengeLoading,
    error: signInMutation.error || challengeError,
    ready: !!challenge,
  };
}
