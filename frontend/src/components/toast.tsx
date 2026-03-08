import { useState, useEffect } from 'react';

interface ToastProps {
  toast: {
    message: string;
    type: 'success' | 'failure' | 'info'; 
    id: number;
  };
  onClose: () => void;
}

export const Toast = ({ toast, onClose }: ToastProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const entranceTimer = setTimeout(() => setIsVisible(true), 10);

    const lifeTimer = setTimeout(() => {
      setIsVisible(false);
      const removeTimer = setTimeout(() => {
        onClose();
      }, 300);
      return () => clearTimeout(removeTimer);
    }, 3000);

    return () => {
      clearTimeout(entranceTimer);
      clearTimeout(lifeTimer);
    };
  }, [onClose]);

  const getTypeStyles = () => {
    switch (toast.type) {
      case 'failure':
        return 'bg-failureBg border-failure';
      case 'info':
        return 'bg-infoBg border-info';
      case 'success':
      default:
        return 'bg-successBg border-success';
    }
  };

  const getLabel = () => {
    if (toast.type === 'failure') return 'Error';
    if (toast.type === 'info') return 'Notice';
    return 'Success';
  };

  return (
    <div
      className={`transition-all duration-300 ease-in-out transform ${
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
    >
      <div className={`flex flex-col gap-1 px-5 py-3 rounded-xl border-2 shadow-lg w-80 ${getTypeStyles()}`}>
        <div className="flex items-center gap-2 opacity-80">
          <span className="text-xs font-semibold tracking-wide uppercase text-text-heading">
            {getLabel()}
          </span>
        </div>
        
        <span className="text-base font-medium leading-tight text-text-heading wrap-break-word">
          {toast.message}
        </span>
      </div>
    </div>
  );
};