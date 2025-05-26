import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Skeleton } from "@/components/ui/skeleton";
import { LINKDROP_ESCROW_ADDRESS } from "@/lib/addresses";
import { formatTokenAmount, truncateAddress } from "@/lib/utils";
import { Token } from "@/types/token";
import { useMutation } from "@tanstack/react-query";
import { parsePhoneNumber, PhoneNumber } from "libphonenumber-js/min";
import {
  Check,
  Copy,
  ExternalLink,
  Link2,
  MoveDownLeft,
  Send,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useState } from "react";
import {
  erc20Abi,
  getAddress,
  Hex,
  http,
  isAddress,
  maxUint256,
  parseUnits,
} from "viem";
import { mainnet } from "viem/chains";
import {
  createConfig,
  useAccount,
  useEnsAddress,
  usePublicClient,
  useReadContract,
  useSendTransaction,
  useWriteContract,
} from "wagmi";
import { linkdropSdk } from "../lib/linkdrop";
import { Button } from "./ui/button";

const ensConfig = createConfig({
  chains: [mainnet],
  transports: {
    [mainnet.id]: http(),
  },
  connectors: [],
});

export function WalletView({ token }: { token: Token }) {
  const account = useAccount();
  const { writeContractAsync } = useWriteContract();
  const { sendTransactionAsync } = useSendTransaction();
  const searchParams = useSearchParams();
  const publicClient = usePublicClient();

  const [copied, setCopied] = useState(false);
  const [isSendOpen, setIsSendOpen] = useState(false);
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [transactionSuccess, setTransactionSuccess] = useState(false);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  const [isReceiveOpen, setReceiveOpen] = useState(false);
  const [receiveAmount, setReceiveAmount] = useState("");
  const [receiveLink, setReceiveLink] = useState("");
  const [claimLink, setClaimLink] = useState<string | null>(null);
  const [needsApproval, setNeedsApproval] = useState(false);

  const {
    data: tokenBalance,
    isLoading: isLoadingBalances,
    error: errorBalances,
  } = useReadContract({
    address: token.address,
    chainId: token.chainId,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: account.address ? [account.address] : undefined,
    query: {
      refetchInterval: 5_000,
    },
  });

  const {
    data: linkdropEscrowApproval,
    isLoading: isLoadingLinkdropEscrowApproval,
    error: errorLinkdropEscrowApproval,
    refetch: refetchLinkdropEscrowApproval,
  } = useReadContract({
    address: token.address,
    abi: erc20Abi,
    functionName: "allowance",
    args: account.address
      ? [account.address, LINKDROP_ESCROW_ADDRESS]
      : undefined,
    query: {
      enabled: !!account.address && isSendOpen,
    },
  });

  const { data: ensAddress, isLoading: isEnsLoading } = useEnsAddress({
    name: recipient.includes(".") ? recipient : undefined,
    config: ensConfig,
  });

  const [resolvedAddress, setResolvedAddress] = useState<string | null>(null);

  const resolveAddressMutation = useMutation({
    mutationFn: async (phoneNumber: string) => {
      const response = await fetch(
        `/api/resolve-address?phoneNumber=${encodeURIComponent(phoneNumber)}`
      );
      if (!response.ok) {
        throw new Error("Failed to resolve address");
      }
      const data = await response.json();

      return data.user?.walletAddress;
    },
    onSuccess: (address) => {
      setResolvedAddress(address);
    },
    onError: (error) => {
      console.error("Error resolving address:", error);
    },
  });

  const createClaimLinkMutation = useMutation({
    mutationFn: async () => {
      if (!account.address) throw new Error("Account not available");

      const claimLink = await linkdropSdk.createClaimLink({
        from: account.address,
        tokenType: "ERC20",
        chainId: token.chainId,
        token: token.address,
        expiration: new Date(Date.now() + 1000 * 60 * 60 * 24).getTime(), // 1 day
        amount: parseUnits(amount, token.decimals).toString(),
      });

      const {
        claimUrl: claimUrlRaw,
        transferId,
        txHash,
      } = await claimLink.deposit({
        async sendTransaction({ to, value, data }) {
          const hash = await sendTransactionAsync({
            to: getAddress(to),
            value: BigInt(value),
            data: data as Hex,
          });
          return { hash };
        },
      });

      // Fix malformed claim URL and add intent param
      const claimUrl = new URL(claimUrlRaw.replace("/#/code", ""));
      claimUrl.searchParams.set("intent", "claim");

      console.log("claimUrl", claimUrl.toString());
      console.log("transferId", transferId);
      console.log("txHash", txHash);

      return claimUrl.toString();
    },
    onSuccess: (link) => {
      setClaimLink(link);
    },
    onError: (error) => {
      console.error("Error creating claim link:", error);
    },
  });

  const approveMutation = useMutation({
    mutationFn: async () => {
      if (!account.address) throw new Error("Account not available");

      const hash = await writeContractAsync({
        address: token.address,
        abi: erc20Abi,
        functionName: "approve",
        args: [LINKDROP_ESCROW_ADDRESS, maxUint256],
      });

      await publicClient.waitForTransactionReceipt({
        hash,
      });

      return hash;
    },
    onSuccess: () => {
      refetchLinkdropEscrowApproval();
      setNeedsApproval(false);
    },
    onError: (error) => {
      console.error("Error approving tokens:", error);
    },
  });

  const handleCreateClaimLink = () => {
    if (
      linkdropEscrowApproval !== undefined &&
      linkdropEscrowApproval === BigInt(0)
    ) {
      setNeedsApproval(true);
    } else {
      createClaimLinkMutation.mutate();
    }
  };

  useEffect(() => {
    const intent = searchParams.get("intent");
    if (intent === "send") {
      setRecipient(searchParams.get("recipient") ?? "");
      setAmount(searchParams.get("amount") ?? "");
      setIsSendOpen(true);
    }
  }, [searchParams]);

  useEffect(() => {
    if (
      linkdropEscrowApproval !== undefined &&
      linkdropEscrowApproval >= BigInt(0)
    ) {
      setNeedsApproval(false);
    }
  }, [linkdropEscrowApproval]);

  useEffect(() => {
    let phoneNumber: PhoneNumber | null = null;
    try {
      phoneNumber = parsePhoneNumber(recipient.replaceAll(" ", ""), {
        defaultCountry: "ZA",
      });
    } catch {}

    if (recipient.includes(".")) {
      setResolvedAddress(ensAddress ?? null);
    } else if (isAddress(recipient)) {
      setResolvedAddress(recipient);
    } else if (recipient && phoneNumber?.isValid()) {
      resolveAddressMutation.mutate(recipient);
    } else {
      setResolvedAddress(null);
    }
  }, [recipient, ensAddress]);

  const sendMutation = useMutation({
    mutationFn: async () => {
      if (!account.address || !tokenBalance || !resolvedAddress)
        throw new Error("Account, balance, or recipient address not available");

      const parsedAmount = parseUnits(amount, token.decimals);
      const hash = await writeContractAsync({
        address: token.address,
        abi: erc20Abi,
        functionName: "transfer",
        args: [getAddress(resolvedAddress), parsedAmount],
      });

      return hash;
    },
    onSuccess: (hash) => {
      console.log("Transaction hash:", hash);
      setTransactionHash(hash);
      setTransactionSuccess(true);
      // Don't close the sheet or reset fields here
    },
    onError: (error) => {
      console.error("Error sending tokens:", error);
    },
  });

  const handleCopy = () => {
    navigator.clipboard.writeText(account.address ?? "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSend = () => {
    sendMutation.mutate();
  };

  const resetSendModal = () => {
    setTransactionSuccess(false);
    setTransactionHash(null);
    setIsSendOpen(false);
    setRecipient("");
    setAmount("");
  };

  const handleReceive = () => {
    if (!account.address) return;

    const baseUrl = window.location.origin;
    const searchParams = new URLSearchParams({
      intent: "send",
      recipient: account.address,
      amount: receiveAmount,
    });
    const link = `${baseUrl}?${searchParams.toString()}`;
    setReceiveLink(link);
  };

  const handleBackReceive = () => {
    setReceiveLink("");
    setReceiveAmount("");
  };

  const handleCopyReceiveLink = () => {
    navigator.clipboard.writeText(receiveLink);
    setCopied(true);
  };

  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  if (!account.address) return null;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col items-center justify-between">
        {tokenBalance !== undefined ? (
          <div className="text-[60px] font-bold">
            {formatTokenAmount(tokenBalance, token)}
          </div>
        ) : isLoadingBalances ? (
          <Skeleton className="h-[60px] w-[200px]" />
        ) : (
          <div>Error: {errorBalances?.message}</div>
        )}
        <button
          className="flex items-center text-gray-500 gap-2 border-none"
          onClick={handleCopy}
        >
          <div>{truncateAddress(account.address)}</div>
          <div>{copied ? <Check size={16} /> : <Copy size={16} />}</div>
        </button>
      </div>
      <div className="flex flex-row gap-4">
        <Button onClick={() => setIsSendOpen(true)}>
          <div className="text-xl">Send</div>
          <div>
            <Send size={18} />
          </div>
        </Button>
        <Button variant="secondary" onClick={() => setReceiveOpen(true)}>
          <div className="text-xl">Receive</div>
          <div>
            <MoveDownLeft size={18} />
          </div>
        </Button>
      </div>

      <Drawer open={isSendOpen} onOpenChange={setIsSendOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Send</DrawerTitle>
          </DrawerHeader>
          <div className="p-4">
            <div className="flex flex-col gap-6">
              {!transactionSuccess ? (
                <>
                  {needsApproval ? (
                    <div className="flex flex-col gap-4">
                      <div className="text-center">
                        Approval needed to create claim links. This is a
                        one-time approval.
                      </div>
                      <Button
                        onClick={() => approveMutation.mutate()}
                        disabled={approveMutation.isPending}
                      >
                        {approveMutation.isPending ? "Approving..." : "Approve"}
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => setNeedsApproval(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <>
                      {claimLink ? (
                        <>
                          <div className="flex justify-center">
                            <QRCodeSVG value={claimLink} size={200} />
                          </div>
                          <div className="text-sm text-gray-500 text-center">
                            Share this claim link with the recipient
                          </div>
                          <div className="flex flex-row gap-2">
                            <Button
                              variant="secondary"
                              onClick={() => setClaimLink(null)}
                            >
                              Back
                            </Button>
                            <Button
                              onClick={() => {
                                navigator.clipboard.writeText(claimLink);
                                setCopied(true);
                              }}
                            >
                              <div>{copied ? "Copied" : "Copy"}</div>
                              <div>
                                {copied ? (
                                  <Check size={16} />
                                ) : (
                                  <Copy size={16} />
                                )}
                              </div>
                            </Button>
                          </div>
                        </>
                      ) : (
                        <>
                          <input
                            type="number"
                            placeholder="Amount"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="p-2 border rounded"
                          />
                          <div className="flex flex-row gap-2">
                            <div>
                              <Button
                                onClick={handleCreateClaimLink}
                                disabled={
                                  !amount || createClaimLinkMutation.isPending
                                }
                                variant="secondary"
                                className="flex-shrink p-3"
                              >
                                <Link2 size={18} />
                              </Button>
                            </div>
                            <div className="mt-2 text-gray-500">or</div>
                            <div className="flex-grow">
                              <input
                                type="text"
                                placeholder="Recipient address, username, or phone number"
                                value={recipient}
                                onChange={(e) => setRecipient(e.target.value)}
                                className="p-2 border rounded w-full"
                              />
                              {isEnsLoading && (
                                <div className="text-sm text-gray-500">
                                  Resolving ENS...
                                </div>
                              )}
                              {resolvedAddress && (
                                <div className="text-sm text-gray-500">
                                  Sending to {truncateAddress(resolvedAddress)}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-row gap-2">
                            <Button
                              onClick={() => setIsSendOpen(false)}
                              variant="secondary"
                            >
                              Cancel
                            </Button>
                            <Button
                              onClick={handleSend}
                              disabled={
                                !resolvedAddress ||
                                !amount ||
                                sendMutation.isPending
                              }
                            >
                              {sendMutation.isPending ? "Sending..." : "Send"}
                            </Button>
                          </div>
                          {sendMutation.isError && (
                            <div className="text-red-500">
                              Error: {sendMutation.error.message}
                            </div>
                          )}
                        </>
                      )}
                    </>
                  )}
                </>
              ) : (
                <>
                  <div className="flex justify-center">
                    <Check size={60} className="text-green-500" />
                  </div>
                  <div className="text-center">
                    Your transaction has been successfully sent.
                  </div>
                  {transactionHash && (
                    <a
                      href={`https://blockscan.com/tx/${transactionHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 text-blue-500 hover:underline"
                    >
                      View Transaction <ExternalLink size={16} />
                    </a>
                  )}
                  <Button onClick={resetSendModal}>Close</Button>
                </>
              )}
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      <Drawer open={isReceiveOpen} onOpenChange={setReceiveOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Receive</DrawerTitle>
          </DrawerHeader>
          <div className="p-4">
            <div className="flex flex-col gap-6">
              {!receiveLink ? (
                <>
                  <input
                    type="number"
                    placeholder="Amount (optional)"
                    value={receiveAmount}
                    onChange={(e) => setReceiveAmount(e.target.value)}
                    className="p-2 border rounded"
                  />
                  <div className="flex flex-row gap-2">
                    <Button
                      variant="secondary"
                      onClick={() => setReceiveOpen(false)}
                    >
                      Close
                    </Button>
                    <Button onClick={handleReceive}>Next</Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-center">
                    <QRCodeSVG value={receiveLink} size={200} />
                  </div>
                  <div className="text-sm text-gray-500 text-center">
                    Ask the sender to scan this QR code or share this link with
                    them
                  </div>
                  <div className="flex flex-row gap-2">
                    <Button variant="secondary" onClick={handleBackReceive}>
                      Back
                    </Button>
                    <Button onClick={handleCopyReceiveLink}>
                      <div>{copied ? "Copied" : "Copy"}</div>
                      <div>
                        {copied ? <Check size={16} /> : <Copy size={16} />}
                      </div>
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
