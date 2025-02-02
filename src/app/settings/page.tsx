"use client";

import { AuthLayout } from "@/layouts/AuthLayout";
import { useSession } from "@/providers/SessionProvider";
import { ArrowLeft, Settings } from "lucide-react";
import Link from "next/link";
import { Button } from "../../components/ui/button";

export default function SettingsPage() {
  const { logout } = useSession();

  return (
    <AuthLayout>
      <div className="flex flex-col">
        <div className="flex flex-col gap-8">
          <div className="flex px-4 items-center">
            <Link href="/" className="border-none text-black mr-auto">
              <ArrowLeft size={28} />
            </Link>
            <Link href="/settings" className="border-none text-black ml-auto">
              <Settings size={28} />
            </Link>
          </div>
          <div>
            <Button variant="secondary" onClick={logout}>
              Logout
            </Button>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
}
