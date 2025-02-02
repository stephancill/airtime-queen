import { Check, ExternalLink } from "lucide-react";
import { Button } from "./ui/button";

interface TransactionSuccessProps {
  message?: string;
  transactionHash?: string;
  onClose: () => void;
}

export function TransactionSuccess({
  message = "Your transaction has been successfully sent.",
  transactionHash,
  onClose,
}: TransactionSuccessProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-center">
        <Check size={60} className="text-green-500" />
      </div>
      <div className="text-center">{message}</div>
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
      <Button onClick={onClose}>Close</Button>
    </div>
  );
}
