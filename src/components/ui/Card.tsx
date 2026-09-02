"use client";

import React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = "", ...props }) => {
  return (
    <div
      className={`rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 shadow-theme-xs ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export interface ComponentCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  desc?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const ComponentCard: React.FC<ComponentCardProps> = ({
  title,
  desc,
  action,
  children,
  className = "",
  ...props
}) => {
  return (
    <div
      className={`rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] shadow-theme-xs ${className}`}
      {...props}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-800">
        <div>
          <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">
            {title}
          </h3>
          {desc && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{desc}</p>
          )}
        </div>
        {action && <div>{action}</div>}
      </div>

      {/* Body */}
      <div className="p-4 sm:p-6">{children}</div>
    </div>
  );
};
