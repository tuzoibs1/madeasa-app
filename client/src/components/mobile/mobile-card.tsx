import { ReactNode } from "react";
import { Link } from "wouter";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileCardProps {
  children: ReactNode;
  className?: string;
  to?: string;
  onClick?: () => void;
}

export function MobileCard({ 
  children, 
  className, 
  to, 
  onClick 
}: MobileCardProps) {
  const classes = cn(
    "bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700",
    to ? "flex items-center justify-between" : "",
    className
  );
  
  if (to) {
    return (
      <Link href={to}>
        <a className={classes}>
          {children}
          <ChevronRight className="h-5 w-5 text-slate-400" />
        </a>
      </Link>
    );
  }
  
  return (
    <div className={classes} onClick={onClick}>
      {children}
    </div>
  );
}