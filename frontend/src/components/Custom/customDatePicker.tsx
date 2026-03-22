import { useState, useRef, useEffect } from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "../Buttons/customButton";

const activeBorderColors: Record<string, string> = {
  primary: "border-primary",
  info: "border-info",
  warning: "border-warning",
  success: "border-success",
  failure: "border-failure",
};

interface DatePickerProps {
  value: string | null;
  onChange: (value: string) => void;
  roleColor?: "primary" | "info" | "warning" | "success" | "failure";
}

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const parseValue = (val: string | null): Date | null => {
  if (!val) return null;
  const [y, m, d] = val.split("-").map(Number);
  return new Date(y, m - 1, d);
};

const formatValue = (d: Date | null): string => {
  if (!d) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export const CustomDatePicker = ({ value, onChange, roleColor = "primary" }: DatePickerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useEffect(() => {
    const d = parseValue(value);
    setSelectedDate(d);
    if (d) setViewDate(d);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const handleDayClick = (day: number) => {
    setSelectedDate(new Date(viewDate.getFullYear(), viewDate.getMonth(), day));
  };

  const renderCalendar = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const emptySlots = Array(firstDay).fill(null);
    const daySlots = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    return (
      <div className="space-y-3 z-10">
        <div className="flex items-center justify-between">
          <button type="button" onClick={handlePrevMonth} className="p-1 hover:bg-light/10 rounded-lg text-text-muted hover:text-text transition-colors cursor-pointer">
            <ChevronLeft size={18} />
          </button>
          <span className="font-bold text-sm text-primary">
            {MONTHS[month]} <span className="text-text-muted">{year}</span>
          </span>
          <button type="button" onClick={handleNextMonth} className="p-1 hover:bg-light/10 rounded-lg text-text-muted hover:text-text transition-colors cursor-pointer">
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center">
          {DAYS.map(d => (
            <div key={d} className="text-[10px] uppercase text-text-body font-semibold py-1">
              {d}
            </div>
          ))}
          {emptySlots.map((_, i) => (
            <div key={`empty-${i}`} className="h-8"></div>
          ))}
          {daySlots.map(d => {
            const isSelected = selectedDate?.getDate() === d && selectedDate?.getMonth() === month && selectedDate?.getFullYear() === year;
            const isToday = new Date().getDate() === d && new Date().getMonth() === month && new Date().getFullYear() === year;
            
            let bgClass = "hover:bg-primary/20 hover:text-primary text-text-body cursor-pointer";
            if (isSelected) bgClass = "bg-primary text-white font-bold shadow-md cursor-pointer";
            else if (isToday) bgClass = "bg-light/10 text-primary font-bold cursor-pointer";

            return (
              <button
                type="button"
                key={d}
                onClick={() => handleDayClick(d)}
                className={`h-8 w-8 rounded-full text-xs transition-all flex items-center justify-center mx-auto ${bgClass}`}
              >
                {d}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div 
      className="relative" 
      ref={dropdownRef}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <div
        className={`flex items-center justify-center rounded-2xl border-2 transition-all cursor-pointer hover:border-light/20 w-auto px-4 h-[45px] shrink-0 gap-2 ${
          isOpen ? activeBorderColors[roleColor] : value ? "bg-primary/20 border-primary/30" : "bg-light/5 border-light/10"
        }`}
      >
        <div className="flex items-center justify-center relative gap-2">
          <CalendarIcon size={18} strokeWidth={3} className={value ? "text-primary" : "text-text-muted"} />
          <span className={`text-xs font-bold tracking-wide uppercase ${value ? "text-primary" : "text-text-muted"}`}>
            Filter
          </span>
          {value && (
             <div className="absolute -top-1 -right-2 w-2 h-2 bg-primary rounded-full" />
          )}
        </div>
      </div>

      {isOpen && (
        <div className="absolute top-[90%] pt-2 right-0 z-[9999]">
            <div className="p-5 bg-surface/95 backdrop-blur-md border-2 border-light/10 rounded-3xl w-72 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center mb-4 pb-2 border-b border-light/10">
                    <span className="text-xs font-black text-text-muted uppercase tracking-widest">Select Date</span>
                    {value && (
                        <button 
                        onClick={() => { onChange(""); setSelectedDate(null); setIsOpen(false); }}
                        className="text-[11.5px] font-semibold text-failure hover:underline cursor-pointer"
                        >
                        Clear search
                        </button>
                    )}
                </div>
                {renderCalendar()}
                
                <div className="mt-4 pt-4 border-t-2 border-light/10 flex gap-2">
                        <Button label="Cancel" onClick={() => { setSelectedDate(parseValue(value)); setIsOpen(false); }} variant='failure' className='w-full text-xs py-2' />
                        <Button label="Confirm" onClick={() => { if (selectedDate) onChange(formatValue(selectedDate)); setIsOpen(false); }} variant='primary' className='w-full text-xs py-2' />
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
