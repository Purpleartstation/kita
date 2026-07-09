import { useState } from 'react';
import { ChevronLeft, ChevronRight, RefreshCw, CalendarDays } from 'lucide-react';

export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export function getOrdinal(n: number) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

// ─── Monthly DayPicker ────────────────────────────────────────────────────────
interface MonthlyDayPickerProps {
  selectedDay: number;
  onChange: (day: number) => void;
}

export function MonthlyDayPicker({ selectedDay, onChange }: MonthlyDayPickerProps) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const startDow = new Date(viewYear, viewMonth, 1).getDay();

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewYear(y => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth(m => m - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewYear(y => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth(m => m + 1);
    }
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-amber-500 text-white">
        <button type="button" onClick={prevMonth} className="p-1.5 rounded-full hover:bg-amber-600/30 text-white transition-colors">
          <ChevronLeft size={18} />
        </button>
        <p className="font-bold text-sm">{MONTHS[viewMonth]} {viewYear}</p>
        <button type="button" onClick={nextMonth} className="p-1.5 rounded-full hover:bg-amber-600/30 text-white transition-colors">
          <ChevronRight size={18} />
        </button>
      </div>

      <p className="text-[10px] text-center text-slate-400 pt-2 font-semibold">Pick a day to recur monthly</p>

      {/* Weekdays */}
      <div className="grid grid-cols-7 px-3 pt-1 pb-1">
        {WEEKDAYS.map(d => (
          <div key={d} className="text-center text-[10px] font-bold text-slate-400 py-1">{d}</div>
        ))}
      </div>

      {/* Days */}
      <div className="grid grid-cols-7 px-3 pb-3 gap-y-1">
        {Array.from({ length: startDow }).map((_, i) => <div key={`e-${i}`} />)}
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
          const isSelected = selectedDay === day;
          return (
            <button
              key={day}
              type="button"
              onClick={() => onChange(day)}
              className={`h-9 w-full rounded-full flex items-center justify-center text-xs font-bold transition-all
                ${isSelected
                  ? 'bg-amber-500 text-white shadow-md scale-105 ring-2 ring-amber-300'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
                }`}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Specific Multi-Date Picker ───────────────────────────────────────────────
interface SpecificDatePickerProps {
  selectedDates: number[];
  onToggle: (ts: number) => void;
}

export function SpecificDatePicker({ selectedDates, onToggle }: SpecificDatePickerProps) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const startDow = new Date(viewYear, viewMonth, 1).getDay();
  const isCurrentMonth = viewYear === today.getFullYear() && viewMonth === today.getMonth();

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewYear(y => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth(m => m - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewYear(y => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth(m => m + 1);
    }
  };

  // Build a Set of "YYYY-MM-DD" strings for fast lookup
  const selectedSet = new Set(
    selectedDates.map(ts => {
      const d = new Date(ts);
      return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    })
  );

  const toggleDay = (day: number) => {
    const ts = new Date(viewYear, viewMonth, day, 12, 0, 0).getTime();
    onToggle(ts);
  };

  const key = (day: number) => `${viewYear}-${viewMonth}-${day}`;

  return (
    <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-indigo-500">
        <button type="button" onClick={prevMonth} className="p-1.5 rounded-full hover:bg-indigo-600/30 text-white transition-colors">
          <ChevronLeft size={18} />
        </button>
        <div className="text-center">
          <p className="text-white font-bold text-sm">{MONTHS[viewMonth]} {viewYear}</p>
          <p className="text-indigo-100 text-xs mt-0.5">
            {selectedDates.length === 0 ? 'Tap dates to schedule' : `${selectedDates.length} date${selectedDates.length > 1 ? 's' : ''} scheduled`}
          </p>
        </div>
        <button type="button" onClick={nextMonth} className="p-1.5 rounded-full hover:bg-indigo-600/30 text-white transition-colors">
          <ChevronRight size={18} />
        </button>
      </div>

      <p className="text-[10px] text-center text-slate-400 pt-2 font-semibold">Tap to add · Tap again to remove · Navigate months for more</p>

      {/* Weekdays */}
      <div className="grid grid-cols-7 px-3 pt-1 pb-1">
        {WEEKDAYS.map(d => (
          <div key={d} className="text-center text-[10px] font-bold text-slate-400 py-1">{d}</div>
        ))}
      </div>

      {/* Days */}
      <div className="grid grid-cols-7 px-3 pb-3 gap-y-1">
        {Array.from({ length: startDow }).map((_, i) => <div key={`e-${i}`} />)}
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
          const isSelected = selectedSet.has(key(day));
          const isToday = isCurrentMonth && today.getDate() === day;
          const isPast = isCurrentMonth && day < today.getDate();

          return (
            <button
              key={day}
              type="button"
              onClick={() => !isPast && toggleDay(day)}
              disabled={isPast}
              className={`h-9 w-full rounded-full flex items-center justify-center text-xs font-bold transition-all relative
                ${isSelected
                  ? 'bg-indigo-500 text-white shadow-md scale-105 ring-2 ring-indigo-300'
                  : isToday
                  ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 ring-1 ring-indigo-400'
                  : isPast
                  ? 'text-slate-300 dark:text-slate-700 cursor-not-allowed'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
                }`}
            >
              {day}
              {isToday && !isSelected && (
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-indigo-500 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
