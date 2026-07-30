import React from "react";
import { Scissors } from "lucide-react";

interface BarberIconProps {
  type?: "scissors" | "mustache" | "comb" | "pole" | "wallet" | "cash" | "card";
  className?: string;
}

export function BarberIcon({ type = "scissors", className = "w-5 h-5" }: BarberIconProps) {
  if (type === "scissors") {
    return <Scissors className={className} />;
  }

  if (type === "mustache") {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6.5 12c-2.5 0-4.5 1.5-4.5 3 0 1.5 2 2.5 4.5 2.5s4-1.5 4.5-3.5c.5 2 2 3.5 4.5 3.5s4.5-1 4.5-2.5c0-1.5-2-3-4.5-3-2.5 0-4 1.5-4.5 3-.5-1.5-2-3-4.5-3z" />
      </svg>
    );
  }

  if (type === "comb") {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 6h16v3H4z" />
        <path d="M6 9v9M9 9v9M12 9v9M15 9v9M18 9v9" />
      </svg>
    );
  }

  return <Scissors className={className} />;
}
