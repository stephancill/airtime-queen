import { Button } from "@/components/ui/button";
import type { PurchaseDetails } from "../../types/purchase";

interface Props {
  details: PurchaseDetails;
  setDetails: (details: PurchaseDetails) => void;
  onNext: () => void;
  onBack: () => void;
  validityOptions: string[];
}

export function DurationSelection({
  details,
  setDetails,
  onNext,
  onBack,
  validityOptions,
}: Props) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">For how long do you need it?</h2>
      <div className="grid grid-cols-2 gap-4">
        {validityOptions.map((duration) => (
          <Button
            key={duration}
            variant={details.validityLabel === duration ? "default" : "outline"}
            onClick={() => {
              setDetails({ ...details, validityLabel: duration as any });
              onNext();
            }}
          >
            {duration}
          </Button>
        ))}
      </div>
    </div>
  );
}
