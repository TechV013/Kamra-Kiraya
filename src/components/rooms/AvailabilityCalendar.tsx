"use client";

import React, { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface DateStatus {
  date: string;
  effectiveAvailable: number;
  isBlocked: boolean;
  availableCount: number;
  reservedCount: number;
}

interface Props {
  roomId: string;
  year: number;
  month: number;
  calendarData?: DateStatus[];
  onMonthChange?: (year: number, month: number) => void;
  mode?: "view" | "edit" | "select";
  onDateToggle?: (date: string, currentStatus: { isBlocked: boolean; availableCount: number }) => void;
  onBulkUpdate?: (updates: Array<{ date: string; isBlocked?: boolean; availableCount?: number }>) => void;
  selectedDate?: string | null;
  onDateSelect?: (date: string) => void;
  minDate?: Date;
  loading?: boolean;
}

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function AvailabilityCalendar({
  year,
  month,
  calendarData = [],
  onMonthChange,
  mode = "view",
  onDateToggle,
  onBulkUpdate,
  selectedDate,
  onDateSelect,
  minDate,
  loading = false,
}: Props) {
  const [bulkCount, setBulkCount] = useState(1);

  const dateMap = useMemo(() => {
    const map = new Map<string, DateStatus>();
    for (const d of calendarData) map.set(d.date, d);
    return map;
  }, [calendarData]);

  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDayOfWeek = new Date(year, month - 1, 1).getDay();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const weeks = useMemo(() => {
    const cells: Array<{ date: Date | null; key: string }[]> = [];
    let week: { date: Date | null; key: string }[] = [];

    for (let i = 0; i < firstDayOfWeek; i++) {
      week.push({ date: null, key: `empty-${i}` });
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day);
      week.push({ date, key: date.toISOString().split("T")[0] });
      if (week.length === 7) {
        cells.push(week);
        week = [];
      }
    }

    if (week.length > 0) cells.push(week);
    return cells;
  }, [year, month, daysInMonth, firstDayOfWeek]);

  const prevMonth = () => {
    const newMonth = month - 1 <= 0 ? 12 : month - 1;
    const newYear = month - 1 <= 0 ? year - 1 : year;
    onMonthChange?.(newYear, newMonth);
  };

  const nextMonth = () => {
    const newMonth = month + 1 > 12 ? 1 : month + 1;
    const newYear = month + 1 > 12 ? year + 1 : year;
    onMonthChange?.(newYear, newMonth);
  };

  const handleDateClick = (date: Date) => {
    const key = date.toISOString().split("T")[0];

    if (minDate && date < minDate) return;
    if (date < today) return;

    if (mode === "select") {
      onDateSelect?.(key);
      return;
    }

    if (mode === "edit") {
      const status = dateMap.get(key);
      const isBlocked = status?.isBlocked || false;
      const effectiveAvailable = status ? status.effectiveAvailable : 1;
      onDateToggle?.(key, { isBlocked, availableCount: effectiveAvailable });
    }
  };

  const handleBulkBlock = () => {
    if (!onBulkUpdate) return;
    const updates = calendarData
      .filter((d) => {
        const date = new Date(d.date);
        return !(minDate && date < minDate) && !(date < today) && !d.isBlocked;
      })
      .map((d) => ({ date: d.date, isBlocked: true }));
    if (updates.length > 0) onBulkUpdate(updates);
  };

  const handleBulkOpen = () => {
    if (!onBulkUpdate) return;
    const updates = calendarData
      .filter((d) => {
        const date = new Date(d.date);
        return !(minDate && date < minDate) && !(date < today) && d.isBlocked;
      })
      .map((d) => ({ date: d.date, isBlocked: false }));
    if (updates.length > 0) onBulkUpdate(updates);
  };

  const handleBulkSetCount = () => {
    if (!onBulkUpdate) return;
    const updates = calendarData
      .filter((d) => {
        const date = new Date(d.date);
        return !(minDate && date < minDate) && !(date < today) && !d.isBlocked;
      })
      .map((d) => ({ date: d.date, availableCount: bulkCount }));
    if (updates.length > 0) onBulkUpdate(updates);
  };

  const getDateStyle = (date: Date): string => {
    const key = date.toISOString().split("T")[0];
    const status = dateMap.get(key);
    const isPast = date < today;
    const isMinBlocked = minDate && date < minDate;

    if (isPast || isMinBlocked) return "text-gray-300 dark:text-gray-600 cursor-not-allowed bg-gray-50 dark:bg-gray-800/50";
    if (status?.isBlocked) return "text-red-500 bg-red-50 dark:bg-red-900/20 dark:text-red-400 cursor-pointer font-medium";
    if (status && status.effectiveAvailable <= 0) return "text-orange-500 bg-orange-50 dark:bg-orange-900/20 dark:text-orange-400 cursor-pointer";
    if (status && status.reservedCount > 0) return "text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 dark:text-yellow-400 cursor-pointer";
    if (key === selectedDate) return "text-white bg-maroon-600 rounded-full cursor-pointer font-bold";
    return "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer";
  };

  const getDateLabel = (date: Date): string => {
    const key = date.toISOString().split("T")[0];
    const status = dateMap.get(key);
    if (mode === "edit" && status) {
      if (status.isBlocked) return "X";
      if (status.effectiveAvailable >= 0) return String(status.effectiveAvailable);
    }
    return String(date.getDate());
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
        <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition">
          <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
        <h3 className="font-semibold text-gray-900 dark:text-white">
          {MONTHS[month - 1]} {year}
        </h3>
        <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition">
          <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      {mode === "edit" && (
        <div className="flex flex-wrap gap-2 p-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
          <button onClick={handleBulkBlock} className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 transition">Block All Visible</button>
          <button onClick={handleBulkOpen} className="px-3 py-1.5 text-xs font-medium rounded-lg bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 transition">Open All Visible</button>
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-500 ml-2">Set count:</span>
            <input type="number" min={0} max={99} value={bulkCount} onChange={(e) => setBulkCount(Math.max(0, parseInt(e.target.value) || 0))} className="w-14 px-2 py-1 text-xs rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 text-center" />
            <button onClick={handleBulkSetCount} className="px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 transition">Apply</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="p-8 text-center">
          <div className="w-6 h-6 border-2 border-maroon-600 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : (
        <div className="p-3">
          <div className="grid grid-cols-7 mb-1">
            {DAYS.map((day) => (
              <div key={day} className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 py-1.5">
                {day}
              </div>
            ))}
          </div>

          <div className="space-y-1">
            {weeks.map((week, wi) => (
              <div key={wi} className="grid grid-cols-7">
                {week.map((cell) => (
                  <div key={cell.key} className="aspect-square p-0.5">
                    {cell.date && (
                      <button
                        onClick={() => handleDateClick(cell.date!)}
                        disabled={cell.date < today || (minDate ? cell.date < minDate : false)}
                        className={`w-full h-full flex items-center justify-center text-sm rounded-lg transition ${getDateStyle(cell.date)}`}
                        title={cell.date ? `${cell.date.toLocaleDateString()}` : ""}
                      >
                        {getDateLabel(cell.date)}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-3 p-3 border-t border-gray-100 dark:border-gray-800 text-xs">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700" /> Blocked</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700" /> Partial</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-50 dark:bg-green-900/20 border border-green-300 dark:border-green-700" /> Available</span>
        {mode === "edit" && <span className="text-gray-400 ml-auto">Click to toggle block</span>}
        {mode === "select" && <span className="text-gray-400 ml-auto">Select check-in date</span>}
      </div>
    </div>
  );
}
