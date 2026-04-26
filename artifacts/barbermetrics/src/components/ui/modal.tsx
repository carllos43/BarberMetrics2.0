import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
  className?: string;
  title?: string;
}

export function Modal({ open, onOpenChange, children, className, title }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    document.addEventListener("keydown", onKey);

    const prevOverflow = document.body.style.overflow;
    const prevPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      document.body.style.paddingRight = prevPaddingRight;
    };
  }, [open, onOpenChange]);

  if (!open) return null;

  const onOverlayMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === overlayRef.current) {
      onOpenChange(false);
    }
  };

  const node = (
    <div
      ref={overlayRef}
      onMouseDown={onOverlayMouseDown}
      role="dialog"
      aria-modal="true"
      aria-label={title ?? "Diálogo"}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-150"
    >
      <div
        className={cn(
          "relative w-full max-w-md max-h-[85vh] overflow-y-auto overscroll-contain bg-[#1C1C1E] rounded-3xl shadow-2xl shadow-black/60 outline-none px-4 py-6",
          className
        )}
        style={{ WebkitOverflowScrolling: "touch" }}
        tabIndex={-1}
      >
        {children}
      </div>
    </div>
  );

  return createPortal(node, document.body);
}
