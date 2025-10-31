/**
 * Date Range Picker Component
 *
 * Allows users to select custom date ranges for analytics dashboards
 * Includes preset options for common ranges (7 days, 30 days, 90 days, 1 year)
 *
 * Pan-African Design:
 * - Configurable date formats per country
 * - Accessible keyboard navigation
 * - Mobile-friendly interface
 */

"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "lucide-react";

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  maxRangeDays?: number;
  className?: string;
}

export function DateRangePicker({
  value,
  onChange,
  maxRangeDays = 365,
  className = "",
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [startDate, setStartDate] = useState(
    value.startDate.toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState(
    value.endDate.toISOString().split("T")[0]
  );
  const [error, setError] = useState<string | null>(null);

  const applyDateRange = () => {
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Validation
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      setError("Invalid date format");
      return;
    }

    if (start >= end) {
      setError("Start date must be before end date");
      return;
    }

    const rangeDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    if (rangeDays > maxRangeDays) {
      setError(`Date range cannot exceed ${maxRangeDays} days`);
      return;
    }

    setError(null);
    onChange({ startDate: start, endDate: end });
    setIsOpen(false);
  };

  const setPreset = (days: number) => {
    const end = new Date();
    const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000);
    setStartDate(start.toISOString().split("T")[0]);
    setEndDate(end.toISOString().split("T")[0]);
  };

  const formatDisplayDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className={`justify-start gap-2 ${className}`}>
          <Calendar className="h-4 w-4" />
          <span>
            {formatDisplayDate(value.startDate)} - {formatDisplayDate(value.endDate)}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <div className="space-y-4">
          <div>
            <h4 className="mb-3 font-semibold">Select Date Range</h4>

            {/* Preset Buttons */}
            <div className="mb-4 grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPreset(7)}
              >
                Last 7 Days
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPreset(30)}
              >
                Last 30 Days
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPreset(90)}
              >
                Last 90 Days
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPreset(365)}
              >
                Last Year
              </Button>
            </div>

            {/* Custom Date Inputs */}
            <div className="space-y-3">
              <div>
                <Label htmlFor="start-date" className="text-sm">
                  Start Date
                </Label>
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="end-date" className="text-sm">
                  End Date
                </Label>
                <Input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <p className="mt-2 text-xs text-red-600 dark:text-red-400">
                {error}
              </p>
            )}
          </div>

          {/* Apply Button */}
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </Button>
            <Button size="sm" onClick={applyDateRange}>
              Apply
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
