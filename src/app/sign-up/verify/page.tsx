"use client";

import { useSession } from "@/providers/SessionProvider";
import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import { Button } from "../../../components/ui/button";

export default function VerifyPhonePage() {
  const { user } = useSession();
  const [verificationCode, setVerificationCode] = useState("");
  const [isCodeSent, setIsCodeSent] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();

  const sendVerificationMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/sign-up/phone-verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phoneNumber: user?.phoneNumber }),
      });
      if (!response.ok) {
        const { error } = await response.json();
        throw new Error(error || "Failed to send verification code");
      }
      return response.json();
    },
    onSuccess: () => {
      setIsCodeSent(true);
    },
  });

  const verifyCodeMutation = useMutation({
    mutationFn: async ({ code }: { code: string }) => {
      const response = await fetch("/api/sign-up/phone-verify", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phoneNumber: user?.phoneNumber, code }),
      });
      if (!response.ok) {
        const { error } = await response.json();
        throw new Error(error || "Failed to verify code");
      }
      return response.json();
    },
    onSuccess: (data) => {
      if (data.valid) {
        const redirectUrl = searchParams.get("redirect") || "/";
        window.location.href = redirectUrl;
      }
    },
  });

  const handleSendVerification = useCallback(() => {
    sendVerificationMutation.mutate();
  }, [sendVerificationMutation, user?.phoneNumber]);

  const handleVerifyCode = useCallback(() => {
    verifyCodeMutation.mutate({ code: verificationCode });
  }, [verifyCodeMutation, verificationCode]);

  return (
    <div className="flex flex-col px-2 md:px-10">
      <div className="text-3xl font-bold">Airtime Queen</div>
      <div className="flex flex-col gap-8 h-full my-auto">
        <h1 className="text-2xl font-semibold">Verify Phone Number</h1>
        <div className="flex flex-col gap-2">
          <label className="text-lg" htmlFor="phoneNumber">
            Phone Number
          </label>
          <input
            type="tel"
            id="phoneNumber"
            value={user?.phoneNumber ?? "Loading..."}
            placeholder="Enter your phone number"
            disabled={true}
            className="border border-gray-300 rounded-md p-4 text-lg bg-gray-100"
          />
        </div>
        <div className="flex flex-col gap-2">
          {!isCodeSent && (
            <Button
              onClick={handleSendVerification}
              disabled={
                sendVerificationMutation.isPending || !user?.phoneNumber
              }
            >
              {sendVerificationMutation.isPending
                ? "Sending Code..."
                : "Send Verification Code"}
            </Button>
          )}
          {isCodeSent && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-lg" htmlFor="verificationCode">
                  Verification Code
                </label>
                <input
                  type="text"
                  id="verificationCode"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="e.g. 123456"
                  className="border border-gray-300 rounded-md p-4 text-lg"
                />
              </div>
              <Button
                onClick={handleVerifyCode}
                disabled={
                  verifyCodeMutation.isPending || verificationCode.length < 6
                }
              >
                {verifyCodeMutation.isPending ? "Verifying..." : "Verify Code"}
              </Button>
            </div>
          )}
          {(sendVerificationMutation.isError || verifyCodeMutation.isError) && (
            <div className="text-red-500">
              Error:{" "}
              {
                (
                  (sendVerificationMutation.error ||
                    verifyCodeMutation.error) as Error
                ).message
              }
            </div>
          )}
          <Link href="/sign-up" className="text-gray-500 text-center">
            Back to Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
}
