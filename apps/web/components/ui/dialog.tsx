"use client";

import { useEffect } from "react";
import clsx from "clsx";
import { IconClose } from "./icons";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Modal mínimo y accesible — no había ninguno en components/ui/ todavía.
 * Reemplaza los `prompt()`/`alert()` del navegador, que no se pueden
 * estilizar y (según el feedback del usuario) no dan una buena
 * experiencia para pedir datos como el destinatario de WhatsApp.
 */
export function Dialog({ open, onClose, title, description, children, className }: DialogProps) {
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={clsx(
          "relative w-full max-w-md rounded-xl border border-border bg-card p-5 shadow-card",
          className,
        )}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold">{title}</h2>
            {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
            aria-label="Cerrar"
          >
            <IconClose className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
