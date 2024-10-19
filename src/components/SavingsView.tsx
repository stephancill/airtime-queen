import { aaveL2PoolAbi } from "@/abi/aaveL2Pool";
import { BASE_TOKEN_AAVE_POOL } from "@/lib/constants";
import { useSession } from "@/providers/SessionProvider";
import { Token } from "@/types/token";
import { useMutation } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Check, ExternalLink } from "lucide-react";
import { useMemo, useState } from "react";
import { erc20Abi, formatUnits, Hex, maxUint256, parseUnits } from "viem";
import {
  useAccount,
  usePublicClient,
  useReadContracts,
  useWriteContract,
} from "wagmi";
import { BottomSheetModal } from "./BottomSheetModal";
import { Button } from "./Button";

export function SavingsView({
  token,
  yieldToken,
}: {
  token: Token;
  yieldToken: Token;
}) {
  const { user } = useSession();
  const account = useAccount();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();

  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");

  const [transactionHash, setTransactionHash] = useState<Hex | null>(null);
  const [transactionSuccess, setTransactionSuccess] = useState(false);
  const {
    data: readContractsData,
    isLoading: isLoadingBalances,
    error: errorBalances,
    refetch: refetchContractsData,
  } = useReadContracts({
    contracts: [
      {
        address: yieldToken.address,
        chainId: yieldToken.chainId,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: account.address ? [account.address] : undefined,
      },
      {
        address: BASE_TOKEN_AAVE_POOL,
        abi: aaveL2PoolAbi,
        functionName: "getReserveData",
        args: [token.address],
      },
      {
        address: token.address,
        chainId: token.chainId,
        abi: erc20Abi,
        functionName: "allowance",
        args: account.address
          ? [account.address, BASE_TOKEN_AAVE_POOL]
          : undefined,
      },
      {
        address: token.address,
        chainId: token.chainId,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: account.address ? [account.address] : undefined,
      },
    ],
  });

  const { yieldTokenBalance, reserveData, poolAllowance, tokenBalance } =
    useMemo(() => {
      if (!readContractsData) return {};
      return {
        yieldTokenBalance: readContractsData[0].result,
        reserveData: readContractsData[1].result,
        poolAllowance: readContractsData[2].result,
        tokenBalance: readContractsData[3].result,
      };
    }, [readContractsData]);

  const depositMutation = useMutation({
    mutationFn: async () => {
      if (!account.address || !tokenBalance)
        throw new Error("Account, balance, or recipient address not available");

      const parsedAmount = parseUnits(depositAmount, token.decimals);
      const hash = await writeContractAsync({
        address: BASE_TOKEN_AAVE_POOL,
        abi: aaveL2PoolAbi,
        functionName: "deposit",
        args: [token.address, parsedAmount, account.address, 0],
      });

      return hash;
    },
    onSuccess: (hash) => {
      setTransactionHash(hash);
      setTransactionSuccess(true);
      refetchContractsData();
    },
    onError: (error) => {
      console.error("Error sending tokens:", error);
    },
  });

  const approveMutation = useMutation({
    mutationFn: async () => {
      if (!account.address) throw new Error("Account not available");

      const hash = await writeContractAsync({
        address: token.address,
        abi: erc20Abi,
        functionName: "approve",
        args: [BASE_TOKEN_AAVE_POOL, maxUint256],
      });

      await publicClient.waitForTransactionReceipt({ hash });

      return hash;
    },
    onSuccess: (hash) => {
      refetchContractsData();
    },
    onError: (error) => {
      console.error("Error approving tokens:", error);
    },
  });

  const withdrawMutation = useMutation({
    mutationFn: async () => {
      if (!account.address || !yieldTokenBalance)
        throw new Error("Account, balance, or recipient address not available");

      const parsedAmount = parseUnits(withdrawAmount, yieldToken.decimals);
      const hash = await writeContractAsync({
        address: BASE_TOKEN_AAVE_POOL,
        abi: aaveL2PoolAbi,
        functionName: "withdraw",
        args: [token.address, parsedAmount, account.address],
      });

      return hash;
    },
    onSuccess: (hash) => {
      setTransactionHash(hash);
      setTransactionSuccess(true);
      refetchContractsData();
    },
    onError: (error) => {
      console.error("Error withdrawing tokens:", error);
    },
  });

  const resetDepositModal = () => {
    setTransactionSuccess(false);
    setTransactionHash(null);
    setIsDepositOpen(false);
    setDepositAmount("");
  };

  const resetWithdrawModal = () => {
    setTransactionSuccess(false);
    setTransactionHash(null);
    setIsWithdrawOpen(false);
    setWithdrawAmount("");
  };

  return (
    <div>
      <div className="text-2xl">Savings</div>
      <div className="flex gap-2 items-end">
        {yieldTokenBalance !== undefined ? (
          <div className="text-[60px] font-bold">
            $
            {parseFloat(
              formatUnits(yieldTokenBalance, yieldToken.decimals)
            ).toFixed(2)}
          </div>
        ) : isLoadingBalances ? null : (
          <div>Error: {errorBalances?.message}</div>
        )}
        {reserveData && (
          <div className="pb-4">
            earning{" "}
            {parseFloat(
              formatUnits(reserveData.currentLiquidityRate, 25)
            ).toFixed(2)}
            %
          </div>
        )}
      </div>
      <div className="flex flex-row gap-2">
        <Button variant="secondary" onClick={() => setIsDepositOpen(true)}>
          <div className="flex flex-row gap-2 items-center">
            <div>Deposit </div> <ArrowDown size={20} />
          </div>
        </Button>
        <Button variant="secondary" onClick={() => setIsWithdrawOpen(true)}>
          <div className="flex flex-row gap-2 items-center">
            <div>Withdraw </div> <ArrowUp size={20} />
          </div>
        </Button>
      </div>
      <BottomSheetModal isOpen={isDepositOpen} setOpen={setIsDepositOpen}>
        <div className="flex flex-col gap-6">
          <div className="text-2xl">Deposit</div>
          {!transactionSuccess ? (
            <>
              <div className="flex flex-col gap-2">
                <input
                  type="number"
                  placeholder="Amount"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="p-2 border rounded"
                />
                {tokenBalance !== undefined && (
                  <div
                    className="text-sm text-gray-500 cursor-pointer"
                    onClick={() =>
                      setDepositAmount(
                        formatUnits(tokenBalance, token.decimals)
                      )
                    }
                  >
                    $
                    {parseFloat(
                      formatUnits(tokenBalance, token.decimals)
                    ).toFixed(2)}{" "}
                    available
                  </div>
                )}
              </div>
              {poolAllowance !== undefined && poolAllowance > 0 ? (
                <div>
                  <div className="flex flex-row gap-2">
                    <Button
                      onClick={() => setIsDepositOpen(false)}
                      variant="secondary"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() => {
                        depositMutation.mutate();
                      }}
                      disabled={
                        !account.address ||
                        !depositAmount ||
                        depositMutation.isPending
                      }
                    >
                      {depositMutation.isPending ? "Depositing..." : "Deposit"}
                    </Button>
                  </div>
                  {depositMutation.error && (
                    <div className="text-red-500">
                      Error: {depositMutation.error.message}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <div className="text-sm text-gray-500 text-center">
                    You need to approve the pool to deposit. Click the button
                    below to approve.
                  </div>
                  <Button
                    onClick={() => approveMutation.mutate()}
                    disabled={approveMutation.isPending}
                  >
                    {approveMutation.isPending ? "Approving..." : "Approve"}
                  </Button>

                  {approveMutation.error && (
                    <div className="text-red-500">
                      Error: {approveMutation.error.message}
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <>
              <div className="flex justify-center">
                <Check size={60} className="text-green-500" />
              </div>
              <div className="text-center">
                Your deposit has been successfully processed.
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
              <Button onClick={resetDepositModal}>Close</Button>
            </>
          )}
        </div>
      </BottomSheetModal>
      <BottomSheetModal isOpen={isWithdrawOpen} setOpen={setIsWithdrawOpen}>
        <div className="flex flex-col gap-6">
          <div className="text-2xl">Withdraw</div>
          {!transactionSuccess ? (
            <>
              <div className="flex flex-col gap-2">
                <input
                  type="number"
                  placeholder="Amount"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="p-2 border rounded"
                />
                {yieldTokenBalance !== undefined && (
                  <div
                    className="text-sm text-gray-500 cursor-pointer"
                    onClick={() =>
                      setWithdrawAmount(
                        formatUnits(yieldTokenBalance, yieldToken.decimals)
                      )
                    }
                  >
                    $
                    {parseFloat(
                      formatUnits(yieldTokenBalance, yieldToken.decimals)
                    ).toFixed(2)}{" "}
                    available
                  </div>
                )}
              </div>
              <div className="flex flex-row gap-2">
                <Button
                  onClick={() => setIsWithdrawOpen(false)}
                  variant="secondary"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    withdrawMutation.mutate();
                  }}
                  disabled={
                    !account.address ||
                    !withdrawAmount ||
                    withdrawMutation.isPending
                  }
                >
                  {withdrawMutation.isPending ? "Withdrawing..." : "Withdraw"}
                </Button>
              </div>
              {withdrawMutation.error && (
                <div className="text-red-500">
                  Error: {withdrawMutation.error.message}
                </div>
              )}
            </>
          ) : (
            <>
              <div className="flex justify-center">
                <Check size={60} className="text-green-500" />
              </div>
              <div className="text-center">
                Your withdrawal has been successfully processed.
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
              <Button onClick={resetWithdrawModal}>Close</Button>
            </>
          )}
        </div>
      </BottomSheetModal>
    </div>
  );
}
