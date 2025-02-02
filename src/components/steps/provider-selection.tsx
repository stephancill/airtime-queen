import { useSession } from "../../providers/SessionProvider";
import { useEffect, useMemo, useState } from "react";
import { PurchaseDetails } from "../../types/purchase";
import { Button } from "../ui/button";
import PhoneInput, { parsePhoneNumber } from "react-phone-number-input";
import { E164Number } from "libphonenumber-js/min";
import "react-phone-number-input/style.css";

interface Props {
  details: PurchaseDetails;
  setDetails: (details: PurchaseDetails) => void;
  onNext: () => void;
  providers: {
    id: string;
    logo: string;
  }[];
}

export function ProviderSelection({
  details,
  setDetails,
  onNext,
  providers,
}: Props) {
  const { user } = useSession();

  const [phoneNumber, setPhoneNumber] = useState<string | undefined>(
    user?.phoneNumber
  );

  const parsedPhoneNumber = useMemo(() => {
    if (!phoneNumber) return undefined;
    return parsePhoneNumber(phoneNumber);
  }, [phoneNumber]);

  useEffect(() => {
    if (parsedPhoneNumber) {
      setDetails({ ...details, msisdn: parsedPhoneNumber.number });
    }
  }, [parsedPhoneNumber, details, setDetails]);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Buy Airtime</h2>
      <div className="space-y-4">
        <label className="text-sm text-gray-600">For number</label>
        <PhoneInput
          placeholder="Enter phone number"
          value={phoneNumber}
          onChange={setPhoneNumber}
          defaultCountry="ZA"
          countries={["ZA"]}
          className="w-full p-2 border rounded-md"
        />
        <p className="text-sm text-gray-500">Select network provider</p>
        <div className="grid grid-cols-2 gap-4">
          {providers.map((provider) => (
            <Button
              key={provider.id}
              variant={details.network === provider.id ? "default" : "outline"}
              onClick={() => {
                setDetails({ ...details, network: provider.id as any });
                onNext();
              }}
            >
              {provider.id}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
