"use client";

import * as React from "react";
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { DayButton, DayPicker, getDefaultClassNames } from "react-day-picker";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "label",
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  const defaultClassNames = getDefaultClassNames();

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn(
        "p-4 rounded-2xl border border-border bg-card text-foreground shadow-premium w-fit",
        className
      )}
      captionLayout={captionLayout}
      formatters={{
        formatMonthDropdown: (date) =>
          date.toLocaleString("default", { month: "short" }),
      }}
      classNames={{
        root: cn("w-fit", defaultClassNames.root),
        months: cn("relative flex flex-col gap-4", defaultClassNames.months),
        month: cn("flex w-full flex-col gap-3", defaultClassNames.month),
        nav: cn(
          "absolute right-4 top-4 flex items-center gap-1.5 z-10",
          defaultClassNames.nav
        ),
        button_previous: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 rounded-lg p-0 opacity-70 hover:opacity-100 border-border bg-transparent shadow-none"
        ),
        button_next: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 rounded-lg p-0 opacity-70 hover:opacity-100 border-border bg-transparent shadow-none"
        ),
        month_caption: cn(
          "flex h-7 items-center justify-start text-sm font-bold pl-1 pb-1",
          defaultClassNames.month_caption
        ),
        weekdays: cn("flex w-full justify-between gap-1 border-b border-border/30 pb-2", defaultClassNames.weekdays),
        weekday: cn(
          "text-muted-foreground/80 w-9 text-center select-none text-[9px] font-extrabold uppercase tracking-widest",
          defaultClassNames.weekday
        ),
        week: cn("flex w-full justify-between gap-1 mt-1.5", defaultClassNames.week),
        day: cn(
          "h-9 w-9 text-center p-0 relative rounded-xl flex items-center justify-center text-xs font-semibold focus-within:relative focus-within:z-20 transition-all",
          defaultClassNames.day
        ),
        today: cn("bg-secondary text-primary border border-primary/20", defaultClassNames.today),
        outside: cn("text-muted-foreground/40 opacity-50", defaultClassNames.outside),
        disabled: cn("text-muted-foreground/40 opacity-45 cursor-not-allowed", defaultClassNames.disabled),
        hidden: cn("invisible", defaultClassNames.hidden),
        ...classNames,
      }}
      components={{
        Root: ({ className, rootRef, ...props }) => {
          return (
            <div
              data-slot="calendar"
              ref={rootRef}
              className={cn(className)}
              {...props}
            />
          );
        },
        Chevron: ({ className, orientation, ...props }) => {
          if (orientation === "left") {
            return (
              <ChevronLeftIcon className={cn("size-4", className)} {...props} />
            );
          }
          if (orientation === "right") {
            return (
              <ChevronRightIcon className={cn("size-4", className)} {...props} />
            );
          }
          return (
            <ChevronDownIcon className={cn("size-4", className)} {...props} />
          );
        },
        DayButton: CalendarDayButton,
      }}
      {...props}
    />
  );
}

function CalendarDayButton({
  className,
  day,
  modifiers,
  ...props
}: React.ComponentProps<typeof DayButton>) {
  const ref = React.useRef<HTMLButtonElement>(null);
  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus();
  }, [modifiers.focused]);

  return (
    <button
      ref={ref}
      type="button"
      data-day={day.date.toLocaleDateString()}
      className={cn(
        "h-9 w-9 text-center rounded-xl flex items-center justify-center font-bold text-xs transition-all outline-none border border-transparent cursor-pointer",
        modifiers.selected
          ? "bg-primary text-white shadow-md shadow-primary/10"
          : "hover:bg-muted text-foreground/80 hover:text-foreground",
        modifiers.today && !modifiers.selected && "bg-primary/5 text-primary border-primary/25",
        modifiers.outside && "text-muted-foreground/40 opacity-50",
        modifiers.disabled && "text-muted-foreground/45 opacity-50 cursor-not-allowed",
        className
      )}
      {...props}
    />
  );
}

export { Calendar, CalendarDayButton };
