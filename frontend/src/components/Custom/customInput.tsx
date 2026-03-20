import { Plus, Minus } from 'lucide-react';

export const CustomInput = ({ 
  label, 
  icon: Icon, 
  placeholder, 
  type = "text", 
  className = "", 
  containerClassName = "",
  roleColor = "primary", 
  name, 
  value, 
  onChange, 
  ...props }: any
) => {
  const handleAdjust = (adjustment: number) => {
    const currentValue = Number(value) || 0;
    const newValue = Math.max(0, currentValue + adjustment);
    onChange({ target: { value: String(newValue), name } });
  };

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <label className="text-[11px] uppercase font-bold text-text-muted tracking-wider ml-1">
          {label}
        </label>
      )}
      <div className={`flex items-center bg-light/5 border-2 border-light/10 rounded-xl px-3 transition-all text-text-muted duration-300
        ${roleColor === 'info' ? 'focus-within:border-info focus-within:text-info' : 'focus-within:border-primary focus-within:text-primary'} ${containerClassName}`}>
        {Icon && <Icon size={15} strokeWidth={3} />}
        <input 
          name={name}
          value={value}
          onChange={onChange}
          type={type === 'number' ? 'text' : type}
          inputMode={type === 'number' ? 'numeric' : undefined}
          className="bg-transparent w-full p-2 outline-none text-md font-semibold placeholder-text-muted/50 focus-within:placeholder-transparent" 
          placeholder={placeholder}
          {...props} 
        />
        {type === "number" && (
          <div className="flex items-center gap-1 border-l-2 border-light/10 pl-2 ml-1">
            <button
              type="button"
              onClick={() => handleAdjust(-1)}
              className="p-1 hover:bg-light/10 rounded-lg transition-colors hover:text-primary cursor-pointer active:scale-90"
            >
              <Minus size={14} strokeWidth={3} />
            </button>
            <button
              type="button"
              onClick={() => handleAdjust(1)}
              className="p-1 hover:bg-light/10 rounded-lg transition-colors hover:text-primary cursor-pointer active:scale-90"
            >
              <Plus size={14} strokeWidth={3} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
