import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Product } from "../../types/products";
import { PurchaseDetails } from "../../types/purchase";

interface Props {
  details: PurchaseDetails;
  setDetails: (details: PurchaseDetails) => void;
  onNext: () => void;
  onBack: () => void;
  products: Product[];
}

export function BundleSelection({
  details,
  setDetails,
  onNext,
  onBack,
  products,
}: Props) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Select a bundle</h2>
      <Select
        onValueChange={(value) => {
          const product = products.find((p) => p.id === value);

          if (!product) return;

          setDetails({
            ...details,
            productId: value,
            bundle: product.product,
          });
          onNext();
        }}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select a bundle" />
        </SelectTrigger>
        <SelectContent>
          {products.map((product) => (
            <SelectItem key={product.id} value={product.id}>
              {product.product}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
