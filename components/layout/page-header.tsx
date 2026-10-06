"use client";

import React from "react";
import { Plus, LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PageHeaderProps {
  title: string;
  description?: string;
  actionLabel?: string;
  actionIcon?: LucideIcon;
  onAction?: () => void;
  children?: React.ReactNode;
}

export function PageHeader({
  title,
  description,
  actionLabel,
  actionIcon: ActionIcon = Plus,
  onAction,
  children,
}: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-1">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-800">{title}</h2>
        {description && <p className="mt-0.5 text-xs text-slate-500">{description}</p>}
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        {children}

        {actionLabel && onAction && (
          <Button
            onClick={onAction}
            size="sm"
            className="h-9 gap-1.5 rounded-xl bg-[#3157a8] px-3.5 text-xs font-semibold text-white shadow-2xs hover:bg-[#25468b] transition-colors"
          >
            <ActionIcon size={15} />
            <span>{actionLabel}</span>
          </Button>
        )}
      </div>
    </div>
  );
}
