"use client";

import { Button } from "@/components/Button";
import { ShopView } from "@/components/ShopView";
import { WalletView } from "@/components/WalletView";
import { AuthLayout } from "@/layouts/AuthLayout";
import { useSession } from "@/providers/SessionProvider";
import { useSmartWalletAccount } from "@/providers/SmartWalletAccountProvider";
import { Settings } from "lucide-react";
import Link from "next/link";

export default function Home() {
  const { user, isLoading: isUserLoading } = useSession();
  useSmartWalletAccount();

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
        <div className="flex flex-col gap-8">
          <div className="flex px-4 items-center">
            <div className="text-3xl font-bold flex-grow">
              {user.phoneNumber}
            </div>
            <Link href="/settings" className="border-none text-black">
              <Settings size={28} />
            </Link>
          </div>
          <div className="mt-8 px-4">
            <WalletView />
          </div>
          <div className="bg-gray-100 h-[2px] rounded-full mx-4"></div>
          <div className="pb">
            <ShopView />
          </div>
        </div>
      </div>
    </AuthLayout>
  );
}
