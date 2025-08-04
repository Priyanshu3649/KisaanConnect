import type { FC, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  children?: ReactNode;
  className?: string;
}

const PageHeader: FC<PageHeaderProps> = ({ title, description, children, className }) => {
  return (
    <div className={cn("flex flex-col md:flex-row items-start justify-between gap-4 mb-6", className)}>
      <div className="grid gap-1">
        <h1 className="font-headline text-3xl md:text-4xl font-bold tracking-tight">{title}</h1>
        {description && <p className="text-lg text-muted-foreground">{description}</p>}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
};

export default PageHeader;
