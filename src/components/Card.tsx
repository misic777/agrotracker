import type { HTMLAttributes } from "react";

/** The cream card with a sand border used throughout the design. */
export default function Card({
  className = "",
  ...rest
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-card border border-sand-300 bg-sand-50 px-6 py-[22px] ${className}`}
      {...rest}
    />
  );
}
