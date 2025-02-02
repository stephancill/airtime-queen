import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import { PurchaseDetails } from "../../types/purchase";

interface Props {
  details: PurchaseDetails;
  onDone: () => void;
  onBuyMore: () => void;
}

export function SuccessScreen({ details, onDone, onBuyMore }: Props) {
  return (
    <div className="space-y-6 text-center">
      <div className="flex justify-center">
        <CheckCircle className="h-16 w-16 text-green-500" />
      </div>
      <h2 className="text-xl font-semibold">Purchase successful</h2>
      <div className="flex space-x-4">
        <Button variant="outline" onClick={onBuyMore}>
          Buy more
        </Button>
        <Button onClick={onDone}>Done</Button>
      </div>
    </div>
  );
}
