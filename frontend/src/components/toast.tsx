import { useState, useEffect, memo } from 'react';
import { X } from 'lucide-react';

interface ToastProps {
  toast: {
    message: string;
    type: 'success' | 'failure' | 'info'; 
    id: number;
  };
  onClose: () => void;
}

const DURATION = 4000;

export const Toast = memo(({ toast, onClose }: ToastProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [timeLeft, setTimeLeft] = useState(DURATION);

  useEffect(() => {
    const startTime = Date.now();

    const entranceTimer = setTimeout(() => setIsVisible(true), 10);

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(DURATION - elapsed, 0);
      setTimeLeft(remaining);
    }, 50);

    const lifeTimer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onClose(), 300);
    }, DURATION);

    return () => {
      clearTimeout(entranceTimer);
      clearTimeout(lifeTimer);
      clearInterval(interval);
    };
  }, []);

  const getBaseColor = () => {
    switch (toast.type) {
      case 'failure': return 'var(--color-failureBg)';
      case 'info': return 'var(--color-infoBg)';
      case 'success':
      default: return 'var(--color-successBg)';
    }
  };

  const getProgressColor = () => {
    switch (toast.type) {
      case 'failure': return 'var(--color-failure)';
      case 'info': return 'var(--color-info)';
      case 'success':
      default: return 'var(--color-success)';
    }
  };

  const getBorderColor = () => {
    switch (toast.type) {
      case 'failure': return 'border-failure';
      case 'info': return 'border-info';
      case 'success':
      default: return 'border-success';
    }
  };

  const getLabel = () => {
    if (toast.type === 'failure') return 'Error';
    if (toast.type === 'info') return 'Notice';
    return 'Success';
  };

  return (
    <div
      className={`transition-all duration-300 ease-in-out overflow-hidden ${
        isVisible
          ? 'max-h-40 translate-y-0 opacity-100'
          : 'max-h-0 -translate-y-4 opacity-0'
      }`}
    >
      <div
        className={`relative rounded-xl border-2 shadow-lg w-80 overflow-hidden ${getBorderColor()}`}
        style={{ backgroundColor: getBaseColor() }}
      >
        {/* Shrinking progress overlay */}
        <div
          className="absolute -top-0.5 -left-0.5 -bottom-0.5 transition-all duration-50 origin-left"
          style={{
            width: `${(timeLeft / DURATION) * 100}%`,
            backgroundColor: getProgressColor(),
            zIndex: 0,
          }}
        />

        {/* Content */}
        <div className="relative z-10 px-5 py-3 flex flex-col gap-1">
          <div className="flex items-center justify-between opacity-80">
            <span className="text-xs font-semibold tracking-wide uppercase text-text-heading">
              {getLabel()}
            </span>
          </div>

          <span className="block text-base font-medium leading-tight text-text-heading wrap-break-words">
            {toast.message}
          </span>
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="group absolute top-2 right-2 p-1 rounded-full hover:rotate-90 transition-all duration-300 hover:bg-failure/30 cursor-pointer z-20"
        >
          <X
            size={20}
            strokeWidth={3}
            className="text-text-heading group-hover:text-failure"
          />
        </button>
      </div>
    </div>
  );
});