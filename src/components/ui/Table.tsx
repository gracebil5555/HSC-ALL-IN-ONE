"use client";

import React from "react";

export const TableContainer: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = "",
}) => {
  return (
    <div
      className={`overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] shadow-theme-xs ${className}`}
    >
      <div className="max-w-full overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse">{children}</table>
      </div>
    </div>
  );
};

export const TableHead: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <thead>
      <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-white/[0.01]">
        {children}
      </tr>
    </thead>
  );
};

export const TableHeaderCell: React.FC<React.ThHTMLAttributes<HTMLTableCellElement>> = ({
  children,
  className = "",
  ...props
}) => {
  return (
    <th
      className={`px-5 py-3.5 text-theme-xs font-semibold text-gray-500 uppercase tracking-wider dark:text-gray-400 ${className}`}
      {...props}
    >
      {children}
    </th>
  );
};

export const TableBody: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <tbody>{children}</tbody>;
};

export const TableRow: React.FC<React.HTMLAttributes<HTMLTableRowElement>> = ({
  children,
  className = "",
  ...props
}) => {
  return (
    <tr
      className={`border-b border-gray-100 transition-colors last:border-b-0 hover:bg-gray-50/60 dark:border-gray-800 dark:hover:bg-white/[0.02] ${className}`}
      {...props}
    >
      {children}
    </tr>
  );
};

export const TableCell: React.FC<React.TdHTMLAttributes<HTMLTableCellElement>> = ({
  children,
  className = "",
  ...props
}) => {
  return (
    <td
      className={`px-5 py-4 text-theme-sm text-gray-700 dark:text-gray-300 align-middle ${className}`}
      {...props}
    >
      {children}
    </td>
  );
};
