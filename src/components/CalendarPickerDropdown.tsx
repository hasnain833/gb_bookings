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
    <>
      {/* Mobile Backdrop Sheet Overlay */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 sm:hidden animate-in fade-in duration-200 touch-none overscroll-none"
      />

      <div 
        onClick={(e) => e.stopPropagation()}
        className="fixed bottom-0 left-0 right-0 sm:absolute sm:bottom-auto sm:top-full sm:left-1/2 sm:-translate-x-1/2 md:translate-x-0 md:left-0 sm:mt-2 w-full sm:w-80 bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-200 z-50 p-4 sm:p-4 pb-safe animate-in slide-in-from-bottom-6 sm:slide-in-from-top-2 duration-200"
      >
        {/* Mobile Bottom Sheet Handle */}
        <div className="sm:hidden sheet-drag-handle" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{title}</span>
            <h4 className="text-base sm:text-sm font-extrabold text-slate-800">{format(viewMonth, 'MMMM yyyy')}</h4>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-2 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center app-tap"
              aria-label="Previous month"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-2 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center app-tap"
              aria-label="Next month"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors ml-0.5 cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center app-tap"
              aria-label="Close calendar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-1 text-center mt-3 mb-1">
          {weekDays.map((wd) => (
            <div key={wd} className="text-[11px] font-bold text-slate-400 uppercase">
              {wd}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-1 my-2">
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
                className={`min-h-[44px] sm:min-h-[40px] w-full rounded-xl text-sm font-bold flex items-center justify-center transition-all cursor-pointer app-tap ${
                  !isCurrentMonth ? 'text-slate-300' : ''
                } ${
                  isDisabled ? 'opacity-25 cursor-not-allowed text-slate-300' : ''
                } ${
                  isSelected
                    ? 'bg-[#006F3C] text-white shadow-md font-extrabold scale-105'
                    : isToday && isCurrentMonth
                    ? 'border-2 border-[#006F3C] text-[#006F3C] bg-emerald-50/50'
                    : isCurrentMonth && !isDisabled
                    ? 'hover:bg-slate-100 text-slate-800 active:bg-slate-200'
                    : ''
                }`}
              >
                {format(day, 'd')}
              </button>
            );
          })}
        </div>

        {/* Bottom confirmation for mobile */}
        <div className="sm:hidden pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full btn-primary-mobile"
          >
            Done
          </button>
        </div>
      </div>
    </>
  );
};
