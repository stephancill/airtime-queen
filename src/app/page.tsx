import { Metadata } from "next";
import HomeView from "@/components/HomeView";
import { truncateAddress } from "../lib/utils";
import { isAddress } from "viem";

export async function generateMetadata(props: {
  searchParams?: { intent: string; recipient: string; amount: string };
}): Promise<Metadata | undefined> {
  if (props.searchParams?.intent === "send") {
    const recipient = isAddress(props.searchParams.recipient)
      ? truncateAddress(props.searchParams.recipient)
      : props.searchParams.recipient;
    const amount = props.searchParams.amount;

    return {
      title: `Airtime Wallet - Payment request from ${recipient}`,
      description: amount
        ? `${recipient} is requesting $${amount}`
        : `${recipient} is requesting a payment`,
    };
  }

  return;
}

export default function HomePage() {
  // This wrapping is necessary for the metadata to be generated
  return <HomeView />;
}
