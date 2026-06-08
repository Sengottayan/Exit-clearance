import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Link } from "wouter";
import { ChevronRight } from "lucide-react";

interface PageHeaderProps {
  title: string;
  breadcrumbs?: { label: string; href?: string }[];
  action?: ReactNode;
  className?: string;
}

export function PageHeader({ title, breadcrumbs, action, className }: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col gap-2 mb-8", className)}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <div className="flex items-center text-sm text-muted-foreground">
          {breadcrumbs.map((crumb, index) => (
            <div key={index} className="flex items-center">
              {index > 0 && <ChevronRight className="w-4 h-4 mx-1" />}
              {crumb.href ? (
                <Link href={crumb.href} className="hover:text-foreground transition-colors">
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-foreground">{crumb.label}</span>
              )}
            </div>
          ))}
        </div>
      )}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {action && <div>{action}</div>}
      </div>
    </div>
  );
}
