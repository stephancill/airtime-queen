import { useAnimatedVirtualKeyboard } from "@/hooks/keyboard";
import { Sheet } from "react-modal-sheet";
import { twMerge } from "tailwind-merge";

export function BottomSheetModal({
  isOpen,
  setOpen,
  children,
}: {
  isOpen: boolean;
  setOpen: (open: boolean) => void;
  children: React.ReactNode;
}) {
  const { keyboardHeight, isKeyboardOpen } = useAnimatedVirtualKeyboard();

  return (
    <Sheet
      isOpen={isOpen}
      onClose={() => setOpen(false)}
      className="max-w-[400px] mx-auto"
      detent="content-height"
      snapPoints={[1]}
    >
      <Sheet.Container>
        <Sheet.Header />
        <Sheet.Content
          className={twMerge(`${!isKeyboardOpen ? "p-4" : ""}`, "px-4")}
          style={{
            paddingBottom: keyboardHeight,
          }}
        >
          <div className="pb-4">{children}</div>
        </Sheet.Content>
      </Sheet.Container>
      <Sheet.Backdrop onTap={() => setOpen(false)} />
    </Sheet>
  );
}
