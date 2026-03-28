"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "icon";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      className = "",
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const base =
      "inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

    const variants = {
      primary:
        "bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white shadow-sm",
      secondary:
        "bg-white border-2 border-brand-600 text-brand-600 hover:bg-brand-50 active:bg-brand-100",
      ghost:
        "text-brand-600 hover:bg-brand-50 active:bg-brand-100",
      danger:
        "bg-rating-again hover:bg-rose-600 active:bg-rose-700 text-white shadow-sm",
      icon:
        "text-stone-500 hover:text-stone-900 hover:bg-stone-100 active:bg-stone-200 rounded-xl",
    };

    const sizes = {
      sm: "px-3 py-1.5 text-sm gap-1.5",
      md: "px-5 py-2.5 text-sm gap-2",
      lg: "px-6 py-3 text-base gap-2",
    };

    const iconSizes = {
      sm: "p-1.5",
      md: "p-2",
      lg: "p-2.5",
    };

    const sizeClass = variant === "icon" ? iconSizes[size] : sizes[size];

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`${base} ${variants[variant]} ${sizeClass} ${className}`}
        {...props}
      >
        {loading ? (
          <>
            <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            {children}
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = "Button";
