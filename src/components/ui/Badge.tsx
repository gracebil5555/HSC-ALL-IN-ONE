"use client";

import React from "react";

export type BadgeColor =
  | "primary"
  | "success"
  | "error"
  | "warning"
  | "info"
  | "light"
  | "dark";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "light" | "solid";
  color?: BadgeColor;
  size?: "sm" | "md";
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "light",
  color = "primary",
  size = "sm",
  startIcon,
  endIcon,
  className = "",
  ...props
}) => {
  const base =
    "inline-flex items-center justify-center gap-1.5 rounded-full font-medium select-none";

  const sizeStyles = {
    sm: "px-2.5 py-0.5 text-xs",
    md: "px-3 py-1 text-sm",
  };

  const variants = {
    light: {
      primary: "bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400",
      success: "bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-400",
      error: "bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-400",
      warning: "bg-warning-50 text-warning-600 dark:bg-warning-500/15 dark:text-warning-400",
      info: "bg-blue-light-50 text-blue-light-600 dark:bg-blue-light-500/15 dark:text-blue-light-400",
      light: "bg-gray-100 text-gray-700 dark:bg-white/5 dark:text-white/80",
      dark: "bg-gray-700 text-white dark:bg-white/10 dark:text-white",
    },
    solid: {
      primary: "bg-brand-500 text-white",
      success: "bg-success-500 text-white",
      error: "bg-error-500 text-white",
      warning: "bg-warning-500 text-white",
      info: "bg-blue-light-500 text-white",
      light: "bg-gray-200 text-gray-800 dark:bg-white/10 dark:text-white",
      dark: "bg-gray-800 text-white dark:bg-gray-700",
    },
  };

  return (
    <span
      className={`${base} ${sizeStyles[size]} ${variants[variant][color]} ${className}`}
      {...props}
    >
      {startIcon && <span className="flex items-center">{startIcon}</span>}
      {children}
      {endIcon && <span className="flex items-center">{endIcon}</span>}
    </span>
  );
};
