import { ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

export const CustomDropdown = ({
  options,
  value,
  onChange,
  icon: Icon,
  label,
  className,
}: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getDisplayLabel = () => {
    if (options.length === 0) return "No values found";
    const selected = options.find((opt: any) => {
      const optVal = opt.value !== undefined ? opt.value : opt;
      return String(optVal) === String(value);
    });
    return selected?.label ?? selected ?? "Select Option";
  };

  return (
    <div className={`relative flex flex-col justify-end gap-0.5 ${className}`} ref={dropdownRef}>
      {label && (
        <label className="text-[11px] uppercase font-bold text-text-muted tracking-wider ml-1">
          {label}
        </label>
      )}

      {isOpen && (
        <div
          className={`absolute top-full mt-1 z-999 bg-surface/80 border-2 border-light/10 rounded-xl backdrop-blur-sm overflow-hidden duration-300 ${className}`} >
          <div className="max-h-33 overflow-y-auto">
            {options.length > 0 ? (
              options.map((opt: any, index: number) => {
                const label = opt.label ?? opt;
                const val = opt.value ?? opt;
                return (
                  <div
                    key={index}
                    onClick={() => { onChange(val); setIsOpen(false); }}
                    className="px-4 py-3 text-sm font-bold text-primary hover:bg-primary hover:text-white transition-colors duration-300 cursor-pointer"
                  >
                    {label}
                  </div>
                );
              })
            ) : (
              <div className="px-4 py-3 text-sm font-bold text-text-muted italic">
                No values found
              </div>
            )}
          </div>
        </div>
      )}

      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between bg-light/5 border-2 rounded-xl px-3 py-2.5 cursor-pointer transition-all ${isOpen ? 'border-primary' : 'border-light/10 hover:border-light/20'} ${className}`} >
        <div className="flex items-center h-5 gap-2">
          {Icon && <Icon size={16} className="text-light/40" />}
          <span className="text-sm font-semibold text-text-muted">{getDisplayLabel()}</span>
        </div>
        <ChevronDown size={16} className={`text-light/40 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </div>
    </div>
  );
};