import { useInfiniteQuery } from "@tanstack/react-query";
import { LoadingScreen } from "./LoadingScreen";
import { Button } from "./ui/button";
import {
  formatDistanceToNow,
  parseISO,
  differenceInDays,
  format,
} from "date-fns";
import { truncateAddress } from "@/lib/utils";
import { RefreshCw, MoveHorizontal, Send, ArrowDownLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface Transaction {
  toAddress: string;
  fromAddress: string;
  toLabel: string | null;
  fromLabel: string | null;
  typeLabel: string;
  color: string;
  tokenAddress: string;
  tokenLabel: string;
  timestamp: string;
  amount: string;
}

async function fetchTransactions({
  pageParam,
  ...rest
}: {
  pageParam?: { blockNumber: number; index: number };
}) {
  console.log({ rest, pageParam });

  const params = new URLSearchParams();
  if (pageParam) {
    console.log("appending", {
      blockNumber: pageParam.blockNumber,
      index: pageParam.index,
    });

    params.append("blockNumber", pageParam.blockNumber.toString());
    params.append("index", pageParam.index.toString());
  }

  console.log(params.toString());

  const response = await fetch(
    `/api/user/transaction-history?${params.toString()}`
  );
  return response.json();
}

function formatTimestamp(timestamp: string): string {
  try {
    const date = parseISO(timestamp);
    const daysAgo = differenceInDays(new Date(), date);
    if (daysAgo > 7) {
      return format(date, "MMM d, yyyy");
    }
    return formatDistanceToNow(date, { addSuffix: true });
  } catch (error) {
    console.error("Error formatting timestamp:", error);
    return "Unknown time";
  }
}

export function TransactionHistory() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch,
    isRefetching,
  } = useInfiniteQuery({
    queryKey: ["transactions"],
    queryFn: (...args) => fetchTransactions(...args),
    getNextPageParam: (lastPage) => lastPage.nextPageParams,
    initialPageParam: undefined,
  });

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end px-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => refetch()}
          disabled={isRefetching}
          className="h-8 w-8"
        >
          <RefreshCw
            className={cn("h-4 w-4", isRefetching && "animate-spin")}
          />
        </Button>
      </div>
      <div className="divide-y divide-muted-foreground/10">
        {data?.pages.map((page, i) => (
          <div key={i} className="divide-y divide-muted-foreground/10">
            {page.items.map((tx: Transaction, index: number) => {
              const amountPrefix =
                tx.typeLabel === "Transfer"
                  ? ""
                  : tx.typeLabel === "Send"
                    ? "-"
                    : "+";
              const amountColor =
                tx.color === "neutral"
                  ? "text-muted-foreground"
                  : tx.color === "green"
                    ? "text-green-500"
                    : "text-red-500";

              const actionText = (() => {
                switch (tx.typeLabel) {
                  case "Transfer":
                    return "Transfer";
                  case "Send":
                    return "Sent";
                  case "Receive":
                    return "Received";
                  default:
                    return tx.typeLabel;
                }
              })();

              const recipientText = (() => {
                switch (tx.typeLabel) {
                  case "Transfer":
                    return `${tx.fromLabel || truncateAddress(tx.fromAddress)} → ${tx.toLabel || truncateAddress(tx.toAddress)}`;
                  case "Send":
                    return tx.toLabel || truncateAddress(tx.toAddress);
                  case "Receive":
                    return tx.fromLabel || truncateAddress(tx.fromAddress);
                  default:
                    return tx.toLabel || truncateAddress(tx.toAddress);
                }
              })();

              const Icon = (() => {
                switch (tx.typeLabel) {
                  case "Transfer":
                    return MoveHorizontal;
                  case "Send":
                    return Send;
                  case "Receive":
                    return ArrowDownLeft;
                  default:
                    return null;
                }
              })();

              return (
                <div
                  key={`${tx.fromAddress}-${tx.toAddress}-${index}`}
                  className="p-4 text-card-foreground flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    {Icon && <Icon className="w-6 h-6 text-muted-foreground" />}
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground font-medium mb-0.5">
                        {actionText}
                      </span>
                      <span className="text-sm font-medium leading-tight">
                        {recipientText}
                      </span>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <span className={cn("text-sm font-medium", amountColor)}>
                      {amountPrefix} {tx.amount} {tx.tokenLabel}
                    </span>
                    <span className="text-xs text-muted-foreground mt-0.5">
                      {formatTimestamp(tx.timestamp)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {hasNextPage && (
        <div className="flex justify-center">
          <Button
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            variant="outline"
          >
            {isFetchingNextPage ? "Loading..." : "Load More"}
          </Button>
        </div>
      )}
    </div>
  );
}
