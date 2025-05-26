"use client";

import { SavingsView } from "@/components/SavingsView";
import { ShopView } from "@/components/ShopView";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WalletView } from "@/components/WalletView";
import { useSignInWithPasskey } from "@/hooks/useSignInWithPasskey";
import { AuthLayout } from "@/layouts/AuthLayout";
import { getBaseToken, getYieldToken, ZARP_TOKEN } from "@/lib/addresses";
import { useSession } from "@/providers/SessionProvider";
import { useSmartWalletAccount } from "@/providers/SmartWalletAccountProvider";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Token } from "../types/token";
import { ClaimView } from "./ClaimView";
import { SettingsView } from "./SettingsView";
import { TransactionHistory } from "./TransactionHistory";
import { Button } from "./ui/button";

export default function HomeView() {
  const { user, isLoading: isUserLoading, refetch, logout } = useSession();
  useSmartWalletAccount();
  const router = useRouter();
  const searchParams = useSearchParams();

  const {
    signInWithPasskey,
    isPending: isSigningIn,
    ready,
  } = useSignInWithPasskey({
    onSuccess: () => {
      refetch();
      const redirectUrl = searchParams.get("redirect");
      if (redirectUrl) {
        router.push(decodeURIComponent(redirectUrl));
      } else {
        router.push("/");
      }
    },
  });

  const [redactPhoneNumber, setRedactPhoneNumber] = useState(false);
  const [baseToken, setBaseToken] = useState<Token>(
    getBaseToken(user?.countryCode ?? "default")
  );

  const yieldToken = useMemo(() => getYieldToken(baseToken), [baseToken]);

  useEffect(() => {
    setBaseToken(getBaseToken(user?.countryCode ?? "default"));
  }, [user]);

  if (!isUserLoading && !user) {
    const currentPath = window.location.pathname;
    const searchParams = window.location.search;

    const redirectUrl = `${currentPath}${searchParams}`;

    return (
      <div className="flex flex-col items-center justify-center gap-4 min-h-screen">
        <div className="text-3xl font-bold">Airtime Queen</div>

        <div className="flex flex-col gap-4 mt-[30px] w-full px-2 md:px-10">
          <Link
            href={{ pathname: "/sign-up", query: { redirect: redirectUrl } }}
            className="hover:no-underline"
          >
            <Button>
              <div className="text-xl">Create account</div>
            </Button>
          </Link>
          <Button
            variant={"secondary"}
            onClick={signInWithPasskey}
            disabled={isSigningIn || !ready}
          >
            <div className="text-xl">
              {isSigningIn ? "Signing in..." : "Sign in to existing account"}
            </div>
          </Button>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <Tabs defaultValue="home" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="home">Home</TabsTrigger>
        <TabsTrigger value="activity">Activity</TabsTrigger>
        <TabsTrigger value="settings">Settings</TabsTrigger>
      </TabsList>
      <TabsContent value="home" className="mt-6">
        <AuthLayout>
          <div className="flex flex-col">
            <div className="flex flex-col gap-8 mb-[100px]">
              <div className="flex px-4 items-center">
                <div className="text-3xl font-bold flex-grow cursor-pointer">
                  <div
                    className="text-3xl font-bold flex-grow cursor-pointer"
                    onClick={() => setRedactPhoneNumber(!redactPhoneNumber)}
                  >
                    {redactPhoneNumber
                      ? user.phoneNumber.slice(0, 3) +
                        "*****" +
                        user.phoneNumber.slice(-4)
                      : user.phoneNumber}
                  </div>
                </div>
              </div>
              <div className="mt-8">
                {/*<div className="flex justify-center mb-4 mx-4">
                  <div className="inline-flex rounded-lg p-1 gap-1 border border-gray-200">
                    {ALL_TOKENS.map((token) => (
                      <button
                        key={token.symbol}
                        className={`px-4 border-none py-2 rounded-md text-sm ${
                          baseToken.symbol === token.symbol
                            ? "bg-gray-900 text-white"
                            : "text-gray-600 hover:text-gray-900"
                        }`}
                        onClick={() => setBaseToken(token)}
                      >
                        {token.symbol}
                      </button>
                    ))}
                  </div>
                </div>*/}
                <div className="px-4">
                  <WalletView token={baseToken} />
                </div>
              </div>
              {/* Shop only supports ZARP for now */}
              {baseToken.address === ZARP_TOKEN.address && (
                <>
                  <div className="bg-gray-100 h-[2px] rounded-full mx-4"></div>
                  <div>
                    <ShopView />
                  </div>
                </>
              )}
              {yieldToken && (
                <>
                  <div className="bg-gray-100 h-[2px] rounded-full mx-4"></div>
                  <div className="px-4">
                    <SavingsView token={baseToken} yieldToken={yieldToken!} />
                  </div>
                </>
              )}
              <ClaimView />
            </div>
          </div>
        </AuthLayout>
      </TabsContent>
      <TabsContent value="activity" className="mt-6">
        <TransactionHistory />
      </TabsContent>
      <TabsContent value="settings" className="mt-6">
        <SettingsView />
      </TabsContent>
    </Tabs>
  );
}
