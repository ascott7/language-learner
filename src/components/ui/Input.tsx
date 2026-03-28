"use client";

import { InputHTMLAttributes, TextareaHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const inputBase =
  "w-full bg-stone-50 border border-stone-300 rounded-xl px-4 py-3 text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-brand-600 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed";

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className = "", ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-sm font-medium text-stone-700">{label}</label>
        )}
        <input
          ref={ref}
          className={`${inputBase} ${error ? "border-rating-again focus:ring-rating-again focus:border-rating-again" : ""} ${className}`}
          {...props}
        />
        {error && <p className="text-xs text-rating-again">{error}</p>}
        {hint && !error && <p className="text-xs text-stone-500">{hint}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, className = "", ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-sm font-medium text-stone-700">{label}</label>
        )}
        <textarea
          ref={ref}
          className={`${inputBase} resize-none ${error ? "border-rating-again focus:ring-rating-again focus:border-rating-again" : ""} ${className}`}
          {...props}
        />
        {error && <p className="text-xs text-rating-again">{error}</p>}
        {hint && !error && <p className="text-xs text-stone-500">{hint}</p>}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";
