export const CustomInput = ({ label, icon: Icon, placeholder, type = "text", className = "", roleColor = "primary", name, value, onChange, ...props }: any) => (
  <div className={`space-y-1.5 ${className}`}>
    <label className="text-[11px] uppercase font-bold text-text-muted tracking-wider ml-1">{label}</label>
    <div className={`flex items-center bg-light/5 border-2 border-light/10 rounded-xl px-3 transition-all text-text-muted 
      ${roleColor === 'info' ? 'focus-within:border-info focus-within:text-info' : 'focus-within:border-primary focus-within:text-primary'}`}>
      {Icon && <Icon size={15} strokeWidth={3} />}
      <input 
        name={name}
        value={value}
        onChange={onChange}
        type={type} 
        className="bg-transparent w-full p-2.5 outline-none text-md font-semibold placeholder-text-muted/50 focus-within:placeholder-transparent" 
        placeholder={placeholder}
        {...props} 
      />
    </div>
  </div>
);