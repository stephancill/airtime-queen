import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { useState } from "react";
import { AirtimePurchaseFlow } from "./PurchaseFlow";
import { Button } from "./ui/button";

export function ShopView() {
  const [isOpen, setOpen] = useState(false);
  return (
    <div className="flex flex-col gap-4">
      <div className="text-2xl ml-4">Shop</div>
      <div className="flex flex-row overflow-x-scroll gap-4 px-4">
        <Button onClick={() => setOpen(true)}>Buy Airtime</Button>
      </div>

      <Drawer open={isOpen} onOpenChange={setOpen}>
        <DrawerContent className="min-h-[400px]">
          <div className="p-4">
            <AirtimePurchaseFlow onDone={() => setOpen(false)} />
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
