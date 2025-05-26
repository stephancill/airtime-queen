"use client";

import { AuthLayout } from "@/layouts/AuthLayout";
import { useSession } from "@/providers/SessionProvider";
import { Button } from "./ui/button";

export function SettingsView() {
  const { logout } = useSession();

  return (
    <AuthLayout>
      <div className="flex flex-col">
        <div className="flex flex-col gap-8">
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
