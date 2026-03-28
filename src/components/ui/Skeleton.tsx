"use client";

import { HTMLAttributes } from "react";

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "text" | "rect" | "circle";
  width?: string | number;
  height?: string | number;
}

export function Skeleton({
  variant = "rect",
  width,
  height,
  className = "",
  style,
  ...props
}: SkeletonProps) {
  const base = "animate-pulse bg-stone-200";

  const variants = {
    text: "rounded",
    rect: "rounded-xl",
    circle: "rounded-full",
  };

  return (
    <div
      className={`${base} ${variants[variant]} ${className}`}
      style={{
        width: typeof width === "number" ? `${width}px` : width,
        height: typeof height === "number" ? `${height}px` : height,
        ...style,
      }}
      {...props}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-card">
      <Skeleton variant="rect" height={20} width="60%" className="mb-3" />
      <Skeleton variant="rect" height={14} className="mb-2" />
      <Skeleton variant="rect" height={14} width="80%" />
    </div>
  );
}
