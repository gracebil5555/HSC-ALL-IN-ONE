"use client";

import React from "react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

export interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  trend?: "up" | "down" | "neutral";
  subtitle?: string;
  icon: React.ReactNode;
  iconBgColor?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  change,
  trend = "up",
  subtitle,
  icon,
  iconBgColor = "bg-gray-100 dark:bg-gray-800",
}) => {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 shadow-theme-xs">
      <div
        className={`flex items-center justify-center w-12 h-12 rounded-xl ${iconBgColor} text-gray-800 dark:text-white/90`}
      >
        {icon}
      </div>

      <div className="flex items-end justify-between mt-5">
        <div>
          <span className="text-sm text-gray-500 dark:text-gray-400">{title}</span>
          <h4 className="mt-1 font-bold text-gray-800 text-title-sm dark:text-white/90">
            {value}
          </h4>
          {subtitle && (
            <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
              {subtitle}
            </p>
          )}
        </div>

        {change && (
          <span
            className={`flex items-center gap-1 rounded-full py-0.5 pl-2 pr-2.5 text-xs font-semibold ${
              trend === "up"
                ? "bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-400"
                : trend === "down"
                ? "bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-400"
                : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
            }`}
          >
            {trend === "up" ? (
              <ArrowUpRight className="w-3.5 h-3.5" />
            ) : trend === "down" ? (
              <ArrowDownRight className="w-3.5 h-3.5" />
            ) : null}
            {change}
          </span>
        )}
      </div>
    </div>
  );
};
