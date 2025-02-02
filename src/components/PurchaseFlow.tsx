import { Progress } from "@/components/ui/progress";
import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import { PurchaseDetails } from "../types/purchase";
import { BundleSelection } from "./steps/bundle-selection";
import { DurationSelection } from "./steps/duration-selection";
import { ProviderSelection } from "./steps/provider-selection";
import { PurchaseReview } from "./steps/purchase-review";
import { ServiceTypeSelection } from "./steps/service-type-selection";
import { SuccessScreen } from "./steps/success-screen";
import { useQuery } from "@tanstack/react-query";
import { LoadingScreen } from "./LoadingScreen";
import { ArrowLeftIcon } from "lucide-react";

interface Product {
  id: string;
  network: string;
  category: string;
  validityDays: string;
  validityLabel: string;
  product: string;
  vendorProductId: string;
  vendorProductName: string;
}

type ProductsResponse = {
  products: Product[];
};

const fetchProducts = async (): Promise<ProductsResponse> => {
  const response = await fetch("/api/merchant/products");
  if (!response.ok) {
    let errorMessage = "Failed to fetch products";
    try {
      const json = await response.json();
      if (json.error) {
        errorMessage = json.error;
      }
    } catch (error) {
      console.error("Failed to fetch products", error);
    }
    throw new Error(errorMessage);
  }
  return response.json();
};

export function AirtimePurchaseFlow({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(1);
  const [details, setDetails] = useState<PurchaseDetails>({});

  const {
    data: productsData,
    isLoading,
    error,
  } = useQuery<ProductsResponse, Error>({
    queryKey: ["products"],
    queryFn: fetchProducts,
    retry: false,
  });

  const networks = useMemo(() => {
    return productsData?.products.reduce((acc, product) => {
      if (!acc.includes(product.network)) {
        acc.push(product.network);
      }
      return acc;
    }, [] as string[]);
  }, [productsData]);

  const productTypes = useMemo(() => {
    return productsData?.products.reduce((acc, product) => {
      if (
        !acc.includes(product.category) &&
        (!details.network || product.network === details.network)
      ) {
        acc.push(product.category);
      }
      return acc;
    }, [] as string[]);
  }, [productsData, details]);

  const validityOptions = useMemo(() => {
    return productsData?.products.reduce((acc, product) => {
      if (
        !acc.includes(product.validityLabel) &&
        (!details.network || product.network === details.network) &&
        (!details.productType || product.category === details.productType)
      ) {
        acc.push(product.validityLabel);
      }
      return acc;
    }, [] as string[]);
  }, [productsData, details]);

  const filteredProducts = useMemo(() => {
    if (!productsData) return [];
    if (!details.network) return productsData.products;
    return productsData.products.filter(
      (product) =>
        product.network === details.network &&
        product.category === details.productType &&
        product.validityLabel === details.validityLabel
    );
  }, [productsData, details]);

  const totalSteps = 6;
  const progress = (step / totalSteps) * 100;

  const goBack = () => setStep((step) => Math.max(1, step - 1));
  const goNext = () => setStep((step) => Math.min(totalSteps, step + 1));

  if (isLoading) return <LoadingScreen />;

  if (!productsData || !networks || !productTypes || !validityOptions)
    return <div>No products found</div>;

  return (
    <div className="max-w-md mx-auto">
      <Progress value={progress} className="h-1" />

      {/* Content */}
      <div className="p-4">
        {/* Navigation Buttons */}
        <div className="flex justify-between mt-2">
          {step > 1 && step < totalSteps && (
            <button
              onClick={goBack}
              className="py-2 text-sm font-medium text-gray-600 border-none hover:bg-gray-200 flex items-center"
            >
              <ArrowLeftIcon className="w-4 h-4 mr-2" />
              <div className="flex items-center">Back</div>
            </button>
          )}
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {step === 1 && (
              <ProviderSelection
                details={details}
                setDetails={setDetails}
                onNext={goNext}
                providers={networks.map((network) => ({
                  id: network,
                  logo: `https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot%202025-02-02%20at%2017.44.03-eu391CCszCW3ficvKNDrVuEHN5kbRS.png`,
                }))}
              />
            )}
            {step === 2 && (
              <ServiceTypeSelection
                details={details}
                setDetails={setDetails}
                onNext={goNext}
                onBack={goBack}
                productTypes={productTypes}
              />
            )}
            {step === 3 && (
              <DurationSelection
                details={details}
                setDetails={setDetails}
                onNext={goNext}
                onBack={goBack}
                validityOptions={validityOptions}
              />
            )}
            {step === 4 && (
              <BundleSelection
                details={details}
                setDetails={setDetails}
                onNext={goNext}
                onBack={goBack}
                products={filteredProducts}
              />
            )}
            {step === 5 && (
              <PurchaseReview
                details={details}
                onNext={goNext}
                onBack={goBack}
              />
            )}
            {step === 6 && (
              <SuccessScreen
                details={details}
                onDone={onDone}
                onBuyMore={() => {
                  setDetails({});
                  setStep(1);
                }}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
