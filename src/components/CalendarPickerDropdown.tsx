import React, { useState } from 'react';
import { 
  format, 
  parseISO, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  isBefore,
  startOfDay,
  isValid
} from 'date-fns';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface CalendarPickerDropdownProps {
  selectedDate: string; // 'YYYY-MM-DD'
  onChange: (dateIso: string) => void;
  minDate?: string; // 'YYYY-MM-DD'
  onClose: () => void;
  title: string;
}

export const CalendarPickerDropdown: React.FC<CalendarPickerDropdownProps> = ({
  selectedDate,
  onChange,
  minDate,
  onClose,
  title
}) => {
  const initialDate = isValid(parseISO(selectedDate)) ? parseISO(selectedDate) : new Date();
  const [viewMonth, setViewMonth] = useState<Date>(initialDate);

  const minDateParsed = minDate && isValid(parseISO(minDate)) ? startOfDay(parseISO(minDate)) : null;
  const selectedDateParsed = isValid(parseISO(selectedDate)) ? startOfDay(parseISO(selectedDate)) : null;

  const monthStart = startOfMonth(viewMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday start
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days = eachDayOfInterval({ start: startDate, end: endDate });
  const weekDays = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setViewMonth(subMonths(viewMonth, 1));
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setViewMonth(addMonths(viewMonth, 1));
  };

  const handleSelectDay = (day: Date, e: React.MouseEvent) => {
    e.stopPropagation();
    const dayStart = startOfDay(day);
    if (minDateParsed && isBefore(dayStart, minDateParsed)) {
      return; // Disabled
    }
    const isoString = format(day, 'yyyy-MM-dd');
    onChange(isoString);
    onClose();
  };

  return (
    <div 
      onClick={(e) => e.stopPropagation()}
      className="absolute top-full left-0 mt-2 w-72 sm:w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 p-4 animate-in fade-in zoom-in-95 duration-150"
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{title}</span>
          <h4 className="text-sm font-extrabold text-slate-800">{format(viewMonth, 'MMMM yyyy')}</h4>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleNextMonth}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors ml-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 text-center mt-3 mb-1">
        {weekDays.map((wd) => (
          <div key={wd} className="text-[10px] font-bold text-slate-400 uppercase">
            {wd}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, idx) => {
          const isCurrentMonth = isSameMonth(day, viewMonth);
          const dayStart = startOfDay(day);
          const isDisabled = minDateParsed ? isBefore(dayStart, minDateParsed) : false;
          const isSelected = selectedDateParsed ? isSameDay(dayStart, selectedDateParsed) : false;
          const isToday = isSameDay(dayStart, startOfDay(new Date()));

          return (
            <button
              key={idx}
              type="button"
              disabled={isDisabled}
              onClick={(e) => handleSelectDay(day, e)}
              className={`h-8 w-full rounded-lg text-xs font-bold flex items-center justify-center transition-all cursor-pointer ${
                !isCurrentMonth ? 'text-slate-300' : ''
              } ${
                isDisabled ? 'opacity-30 cursor-not-allowed text-slate-300' : ''
              } ${
                isSelected
                  ? 'bg-[#006F3C] text-white shadow-md font-extrabold scale-105'
                  : isToday && isCurrentMonth
                  ? 'border border-[#006F3C] text-[#006F3C] hover:bg-emerald-50'
                  : isCurrentMonth && !isDisabled
                  ? 'hover:bg-slate-100 text-slate-700'
                  : ''
              }`}
            >
              {format(day, 'd')}
            </button>
          );
        })}
      </div>
    </div>
  );
};
