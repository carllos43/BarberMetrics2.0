import React from "react";
import { Drawer } from "vaul";
import { cn } from "@/lib/utils";

interface BottomSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  className?: string;
}

export function BottomSheet({ open, onOpenChange, children, className }: BottomSheetProps) {
  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm" />
        <Drawer.Content
          className={cn(
            "bg-[#1C1C1E] flex flex-col rounded-t-3xl h-fit mt-24 max-h-[96vh] fixed bottom-0 left-0 right-0 z-50 focus:outline-none",
            className
          )}
        >
          <div className="mx-auto w-10 h-1 flex-shrink-0 rounded-full bg-gray-600 mt-2 mb-4" />
          <div className="max-w-md w-full mx-auto flex-1 overflow-y-auto pb-[env(safe-area-inset-bottom)] px-4">
            {children}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
