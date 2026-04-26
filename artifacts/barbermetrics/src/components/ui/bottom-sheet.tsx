import React from "react";
import { Drawer } from "vaul";
import { cn } from "@/lib/utils";

interface BottomSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  className?: string;
  title?: string;
}

export function BottomSheet({ open, onOpenChange, children, className, title }: BottomSheetProps) {
  return (
    <Drawer.Root
      open={open}
      onOpenChange={onOpenChange}
      handleOnly
      shouldScaleBackground={false}
    >
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm" />
        <Drawer.Content
          className={cn(
            "bg-[#1C1C1E] flex flex-col rounded-t-3xl h-fit mt-24 max-h-[96vh] fixed bottom-0 left-0 right-0 z-50 focus:outline-none outline-none",
            className
          )}
        >
          <Drawer.Handle className="!mx-auto !mt-2 !mb-4 !w-10 !h-1 !rounded-full !bg-gray-600 flex-shrink-0 cursor-grab active:cursor-grabbing" />
          <Drawer.Title className="sr-only">{title ?? "Painel"}</Drawer.Title>
          <Drawer.Description className="sr-only">
            Painel deslizante com formulário ou opções.
          </Drawer.Description>
          <div
            data-vaul-no-drag
            className="max-w-md w-full mx-auto flex-1 overflow-y-auto overscroll-contain pb-[env(safe-area-inset-bottom)] px-4 touch-pan-y"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            {children}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
