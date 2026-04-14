import { useState, useRef, useEffect } from "react";
import { useDispatch } from "react-redux";
import { Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "../Buttons/customButton";
import { addToast } from "../../features/toasts/toastSlice";

const activeBorderColors: Record<string, string> = {
  primary: "border-primary",
  info: "border-info",
  warning: "border-warning",
  success: "border-success",
  failure: "border-failure",
};

interface DateTimePickerProps {
  label: string;
  value: string | null;
  onChange: (value: string) => void;
  roleColor?: "primary" | "info" | "warning" | "success" | "failure";
}

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const parseValue = (val: string | null): Date | null => {
  if (!val) return null;
  const [datePart, timePart] = val.split("T");
  if (!datePart) return null;
  const [y, m, d] = datePart.split("-").map(Number);
  const [hr, min] = (timePart || "00:00").split(":").map(Number);
  return new Date(y, m - 1, d, hr, min);
};

const formatValue = (d: Date | null): string => {
  if (!d) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hr = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${day}T${hr}:${min}`;
};

export const CustomDateTimePicker = ({ label, value, onChange, roleColor = "primary" }: DateTimePickerProps) => {
  const dispatch = useDispatch();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // States for internal picking
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
    const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    if (selectedDate) {
      newDate.setHours(selectedDate.getHours());
      newDate.setMinutes(selectedDate.getMinutes());
    } else {
      newDate.setHours(12);
      newDate.setMinutes(0);
    }
    setSelectedDate(newDate);
  };

  const handleTimeChange = (type: "hr" | "min" | "ampm", val: number | string) => {
    let d = selectedDate ? new Date(selectedDate) : new Date();
    if (!selectedDate) {
      d.setHours(12);
      d.setMinutes(0);
      d.setSeconds(0);
    }
    
    if (type === "hr") {
      const isPM = d.getHours() >= 12;
      const hours12 = val as number;
      if (isPM) d.setHours(hours12 === 12 ? 12 : hours12 + 12);
      else d.setHours(hours12 === 12 ? 0 : hours12);
    } else if (type === "min") {
      d.setMinutes(val as number);
    } else if (type === "ampm") {
      const isPM = d.getHours() >= 12;
      if (val === "AM" && isPM) d.setHours(d.getHours() - 12);
      else if (val === "PM" && !isPM) d.setHours(d.getHours() + 12);
    }
    
    setSelectedDate(d);
  };

  const handleConfirm = () => {
    if (!selectedDate) {
      dispatch(addToast({ message: "Please select a date and time.", type: "failure" }));
      return;
    }
    const now = new Date();
    if (selectedDate < now) {
      dispatch(addToast({ message: "Cannot select a past time.", type: "failure" }));
      return;
    }
    onChange(formatValue(selectedDate));
    setIsOpen(false);
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
        {/* Month Header */}
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

        {/* Days Grid */}
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
            const dateObj = new Date(year, month, d);
            const today = new Date();
            today.setHours(0,0,0,0);
            
            const isPast = dateObj < today;
            const isSaturday = dateObj.getDay() === 6;
            const isSelected = selectedDate?.getDate() === d && selectedDate?.getMonth() === month && selectedDate?.getFullYear() === year;
            const isToday = new Date().getDate() === d && new Date().getMonth() === month && new Date().getFullYear() === year;
            
            let bgClass = "hover:bg-primary/20 hover:text-primary text-text-body cursor-pointer";
            if (isPast) bgClass = "bg-light/5 text-text-muted/30 font-bold cursor-not-allowed";
            else if (isSaturday) bgClass = "bg-failure/40 text-failure font-bold cursor-not-allowed";
            else if (isSelected) bgClass = "bg-primary text-white font-bold shadow-md cursor-pointer";
            else if (isToday) bgClass = "bg-light/10 text-primary font-bold cursor-pointer";

            return (
              <button
                type="button"
                key={d}
                disabled={isPast || isSaturday}
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

  const renderTimePicker = () => {
    const hr = selectedDate ? selectedDate.getHours() : 12;
    const min = selectedDate ? selectedDate.getMinutes() : 0;
    const isPM = hr >= 12;
    const hr12 = hr % 12 === 0 ? 12 : hr % 12;

    return (
      <div className="flex items-center justify-between pt-3 mt-3 border-t-2 border-light/10">
        <div className="flex items-center gap-2 text-text-body font-bold text-xs">
          <Clock size={16} /> TIME
        </div>
        <div className="flex items-center gap-1.5">
          <select 
            value={hr12} 
            onChange={(e) => handleTimeChange("hr", parseInt(e.target.value))}
            className="bg-light/10 text-text-body font-bold text-sm px-2 py-1.5 rounded-lg outline-none cursor-pointer hover:bg-light/20 appearance-none text-center min-w-10"
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
              <option key={h} value={h} className="bg-surface text-text-body">
                {String(h).padStart(2, "0")}
              </option>
            ))}
          </select>
          <span className="text-text-muted font-bold">:</span>
          <select 
            value={min} 
            onChange={(e) => handleTimeChange("min", parseInt(e.target.value))}
            className="bg-light/10 text-text-body font-bold text-sm px-2 py-1.5 rounded-lg outline-none cursor-pointer hover:bg-light/20 appearance-none text-center min-w-10"
          >
            {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map(m => (
              <option key={m} value={m} className="bg-surface text-text-body">
                {String(m).padStart(2, "0")}
              </option>
            ))}
          </select>
          <select 
            value={isPM ? "PM" : "AM"} 
            onChange={(e) => handleTimeChange("ampm", e.target.value)}
            className="bg-light/10 text-primary font-black text-sm px-2 py-1.5 rounded-lg outline-none cursor-pointer hover:bg-light/20 appearance-none text-center ml-1"
          >
            <option value="AM" className="bg-surface">AM</option>
            <option value="PM" className="bg-surface">PM</option>
          </select>
        </div>
      </div>
    );
  };

  const displayFormat = () => {
    if (!value) return "Select date and time";
    const d = parseValue(value);
    if (!d) return "Select date and time";
    const dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    const timeStr = d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
    return `${dateStr} at ${timeStr}`;
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <label className="block text-sm font-semibold text-text-muted mb-1.5 ml-1 items-center gap-2">
        {label}
      </label>

      {/* Input Display */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between px-4 py-3 rounded-2xl border-2 transition-all cursor-pointer bg-light/5 hover:border-light/20 h-12.5 ${
          isOpen ? activeBorderColors[roleColor] : "border-light/10"
        }`}
      >
        <div className="flex items-center h-5 gap-3 min-w-45 sm:min-w-50 flex-1">
          <CalendarIcon size={18} strokeWidth={3} className="text-primary shrink-0" />
          <span className={`text-sm font-bold tracking-wide truncate mt-0.5 ${value ? "text-text-body" : "text-text-muted"}`}>
            {displayFormat()}
          </span>
        </div>
        
        <div className="flex items-center justify-center h-6 w-6 shrink-0 ml-2">
          {value ? (
            <button 
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange("");
                setSelectedDate(null);
              }} 
              className="p-1 hover:bg-failure/20 hover:text-failure rounded-full transition-colors text-text-muted cursor-pointer flex items-center justify-center"
            >
              <X size={15} strokeWidth={3} />
            </button>
          ) : (
            <ChevronRight size={15} strokeWidth={3} className={`text-light/40 transition-transform duration-300 ${isOpen ? "rotate-90" : ""}`} />
          )}
        </div>
      </div>

      {/* Dropdown Popover */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-9998 bg-surface/60 backdrop-blur-sm rounded-4xl" onClick={(e) => { e.stopPropagation(); setIsOpen(false); }} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-9999 p-6 bg-surface/95 backdrop-blur-xl border-2 border-light/10 rounded-3xl w-85 max-w-[90vw] shadow-2xl">
            {renderCalendar()}
          {renderTimePicker()}
          
          <div className="mt-4 pt-4 border-t-2 border-light/10 flex gap-2">
            <Button label="Cancel" onClick={() => { setSelectedDate(parseValue(value)); setIsOpen(false); }} variant='failure' className='w-full' />
            <Button label="Confirm" onClick={handleConfirm} variant='primary' className='w-full' />
          </div>
        </div>
        </>
      )}
    </div>
  );
};