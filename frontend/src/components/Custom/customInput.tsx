import { useRef } from "react";
import { Plus, Minus } from "lucide-react";

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
  suffix,
  ...props
}: any) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleAdjust = (adjustment: number) => {
    const currentValue = Number(value) || 0;
    const newValue = Math.max(0, currentValue + adjustment);
    onChange({ target: { value: String(newValue), name } });
  };

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    onChange({ target: { files: e.target.files, file, name } });
  };

  const isFile = type === "file";
  const isNumber = type === "number";

  return (
    <div className={`flex flex-col gap-1 ${className} ${containerClassName}`}>
      {label && (
        <label className="text-[11px] uppercase font-bold text-text-muted tracking-wider ml-1">
          {label}
        </label>
      )}

      <div
        onClick={isFile ? handleFileClick : undefined}
        className={`flex items-center bg-light/5 border-2 border-light/10 rounded-xl px-3 transition-all text-text-muted duration-300
        ${
          roleColor === "info"
            ? "focus-within:border-info focus-within:text-info hover:border-info hover:text-info"
            : "focus-within:border-primary focus-within:text-primary hover:border-primary hover:text-primary"
        }
        ${isFile ? "cursor-pointer" : ""}
        `}
      >
        {Icon && <Icon size={15} strokeWidth={3} />}

        {isFile ? (
          <div className="w-full p-2 text-md font-semibold">
            {value?.name || placeholder || "Choose file..."}
          </div>
        ) : (
          <input
            name={name}
            value={value}
            onChange={onChange}
            type={isNumber ? "text" : type}
            inputMode={isNumber ? "numeric" : undefined}
            className="bg-transparent w-full p-2 outline-none text-md font-semibold placeholder-text-muted/50 focus-within:placeholder-transparent"
            placeholder={placeholder}
            {...props}
          />
        )}

        {/* SUFFIX CONTENT */}
        {suffix && <div className="flex items-center shrink-0">{suffix}</div>}

        {/* NUMBER CONTROLS */}
        {isNumber && !props.disabled && !props.readOnly && (
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

      {/* HIDDEN FILE INPUT */}
      {isFile && (
        <input
          ref={fileInputRef}
          type="file"
          name={name}
          onChange={handleFileChange}
          className="hidden"
          {...props}
        />
      )}
    </div>
  );
};