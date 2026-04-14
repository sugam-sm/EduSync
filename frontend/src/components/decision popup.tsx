import { useState } from "react";
import { Portal } from "./Portal";

interface PopupOptions {
  question: string;
  confirmText?: string;
  cancelText?: string;
  variant: "primary" | "secondary";
  onConfirm: () => void;
}

export const DecisionPopup = () => {
  const [options, setOptions] = useState<PopupOptions | null>(null);

  const openDecidePopup = (popupOptions: PopupOptions) => {
    setOptions(popupOptions);
  };

  const closePopup = () => {
    setOptions(null);
  };

  const DecidePopup = () => {
    if (!options) return null;

    return (
      <Portal>
        <div className="fixed inset-0 z-1000 flex items-center justify-center p-4 bg-surface/60 backdrop-blur-sm">
          <div className="bg-surface/50 rounded-3xl p-6 border-light/10 border-2 w-full max-w-md shadow-2xl">
            <p className="text-lg text-text-heading font-semibold mb-6 wrap-break-words whitespace-normal">
              {options.question}
            </p>

            <div className="flex justify-end gap-4">
              <button
                onClick={closePopup}
                className={`cursor-pointer px-4 py-2 font-bold rounded-xl border-2 transition-all duration-500
                  ${
                    options.variant === "secondary"
                      ? "text-failure border-failure hover:bg-failure/20"
                      : "text-light border-light hover:bg-light/30"
                  }`}
              >
                {options.cancelText ?? "Cancel"}
              </button>

              <button
                onClick={() => {
                  options.onConfirm();
                  closePopup();
                }}
                className={`cursor-pointer px-4 py-2 rounded-xl font-bold border-2 transition-all duration-500
                  ${
                    options.variant === "primary"
                      ? "text-failure border-failure hover:bg-failure/20"
                      : "text-light border-light hover:bg-light/30"
                  }`}
              >
                {options.confirmText ?? "Confirm"}
              </button>
            </div>
          </div>
        </div>
      </Portal>
    );
  };

  return { openDecidePopup, DecidePopup };
};