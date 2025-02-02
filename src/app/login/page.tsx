"use client";

import { useSession } from "@/providers/SessionProvider";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { LoadingScreen } from "@/components/LoadingScreen";
import { Button } from "../../components/ui/button";
import { useSignInWithPasskey } from "../../hooks/useSignInWithPasskey";

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

  const { signInWithPasskey, isPending, error } = useSignInWithPasskey({
    onSuccess: (user) => {
      refetch();
      const redirectUrl = searchParams.get("redirect");
      if (redirectUrl) {
        router.push(decodeURIComponent(redirectUrl));
      } else {
        router.push("/");
      }
    },
  });

  if (isPending) return <LoadingScreen />;
  if (error) return <div>Error: {(error as Error).message}</div>;

  return (
    <div className="flex flex-col items-center justify-center gap-8 min-h-screen">
      <div className="text-3xl font-bold">Airtime Queen</div>

      <div className="flex flex-col gap-4 mt-[30px] w-full px-2 md:px-10">
        <Button onClick={signInWithPasskey}>
          <div className="text-xl">
            {isPending ? "Signing in..." : "Sign in"}
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
}
