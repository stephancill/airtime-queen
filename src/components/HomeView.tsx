"use client";

import { Button } from "@/components/Button";
import { SavingsView } from "@/components/SavingsView";
import { ShopView } from "@/components/ShopView";
import { WalletView } from "@/components/WalletView";
import { AuthLayout } from "@/layouts/AuthLayout";
import { BASE_TOKEN, YIELD_TOKEN } from "@/lib/constants";
import { useSession } from "@/providers/SessionProvider";
import { useSmartWalletAccount } from "@/providers/SmartWalletAccountProvider";
import { Settings } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { ClaimView } from "./ClaimView";

export default function HomeView() {
  const { user, isLoading: isUserLoading } = useSession();
  useSmartWalletAccount();

  const [redactPhoneNumber, setRedactPhoneNumber] = useState(false);

  if (!isUserLoading && !user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100dvh-65px)] gap-8">
        <div className="text-3xl font-bold">Airtime Wallet</div>

        <div className="flex flex-col gap-4 mt-[30px] w-full px-2 md:px-10">
          <Link href="/sign-up" className="hover:no-underline">
            <Button>
              <div className="text-xl">Create account</div>
            </Button>
          </Link>
          <Link href="/login" className="text-gray-500 text-center">
            Sign in to existing account
          </Link>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
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
            <Link href="/settings" className="border-none text-black">
              <Settings size={28} />
            </Link>
          </div>
          <div className="mt-8 px-4">
            <WalletView token={BASE_TOKEN} />
          </div>
          <div className="bg-gray-100 h-[2px] rounded-full mx-4"></div>
          <div>
            <ShopView />
          </div>
          <div className="bg-gray-100 h-[2px] rounded-full mx-4"></div>
          <div className="px-4">
            <SavingsView token={BASE_TOKEN} yieldToken={YIELD_TOKEN} />
          </div>
          <ClaimView />
        </div>
      </div>
    </AuthLayout>
  );
}
