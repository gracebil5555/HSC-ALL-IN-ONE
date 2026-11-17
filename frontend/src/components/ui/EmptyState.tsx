"use client";

import React from "react";
import { Inbox } from "lucide-react";

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  action,
  className = "",
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center rounded-2xl border border-dashed border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-white/[0.02] px-6 py-12 shadow-theme-xs ${className}`}
    >
      <div className="relative flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 mb-4 border border-brand-100 dark:border-brand-500/20">
        {icon || <Inbox className="w-6 h-6" />}
        <span
          className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-hsc-orange-500 ring-2 ring-white dark:ring-gray-900"
          aria-hidden="true"
        />
      </div>
      <h3 className="text-base font-semibold text-gray-900 dark:text-white/90">
        {title}
      </h3>
      {description && (
        <p className="mt-1.5 max-w-md text-theme-sm text-gray-500 dark:text-gray-400">
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
};
