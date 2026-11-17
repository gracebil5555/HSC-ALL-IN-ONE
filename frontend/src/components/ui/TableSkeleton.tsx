"use client";

import React from "react";

export interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  className?: string;
}

export const TableSkeleton: React.FC<TableSkeletonProps> = ({
  rows = 5,
  columns = 5,
  className = "",
}) => {
  return (
    <div
      className={`overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] shadow-theme-xs ${className}`}
      aria-busy="true"
      aria-label="Chargement des données"
    >
      <div className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/70 dark:bg-white/[0.02] px-5 py-3.5">
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
          {Array.from({ length: columns }).map((_, idx) => (
            <div
              key={idx}
              className="h-3 rounded-full bg-gray-200/80 dark:bg-gray-700/70 animate-pulse"
            />
          ))}
        </div>
      </div>

      <div className="divide-y divide-gray-100 dark:divide-gray-800">
        {Array.from({ length: rows }).map((_, rowIdx) => (
          <div key={rowIdx} className="px-5 py-4">
            <div className="grid gap-4 items-center" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
              {Array.from({ length: columns }).map((_, colIdx) => (
                <div
                  key={colIdx}
                  className={`h-3.5 rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse ${
                    colIdx === 0 ? "w-4/5" : colIdx === columns - 1 ? "w-1/2 ml-auto" : "w-3/4"
                  }`}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
