import { Button } from "@/components/ui/button";
import { PurchaseDetails } from "../../types/purchase";
interface Props {
  details: PurchaseDetails;
  setDetails: (details: PurchaseDetails) => void;
  onNext: () => void;
  onBack: () => void;
  productTypes: string[];
}

export function ServiceTypeSelection({
  details,
  setDetails,
  onNext,
  onBack,
  productTypes,
}: Props) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">What do you need?</h2>
      <div className="grid grid-cols-2 gap-4">
        {productTypes.map((type) => (
          <Button
            key={type}
            variant={details.productType === type ? "default" : "outline"}
            onClick={() => {
              setDetails({ ...details, productType: type as any });
              onNext();
            }}
          >
            {type}
          </Button>
        ))}
      </div>
    </div>
  );
}
