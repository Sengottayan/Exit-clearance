import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChecklistItem as ItemType } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ChecklistItemProps {
  item: ItemType;
  onChange: (checked: boolean) => void;
  onInputChange?: (value: string) => void;
  disabled?: boolean;
  highlightError?: boolean;
}

export function ChecklistItem({ item, onChange, onInputChange, disabled = false, highlightError = false }: ChecklistItemProps) {
  return (
    <div className={cn(
      "flex flex-col gap-3 p-3 rounded-lg transition-colors border",
      item.checked ? "bg-muted/30 border-border" : "bg-card border-border",
      highlightError && item.isMandatory && !item.checked ? "border-amber-400 bg-amber-50 dark:bg-amber-500/10 dark:border-amber-500/30" : ""
    )}>
      <div className="flex items-start gap-3">
        <Checkbox 
          id={item.id} 
          checked={item.checked} 
          onCheckedChange={onChange}
          disabled={disabled}
          className="mt-0.5"
        />
        <div className="flex-1 space-y-1 leading-none">
          <Label 
            htmlFor={item.id} 
            className={cn(
              "text-sm font-medium leading-tight cursor-pointer",
              item.checked && "text-muted-foreground line-through opacity-70",
              disabled && "cursor-not-allowed opacity-70"
            )}
          >
            {item.label}
          </Label>
          {item.isMandatory && (
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Required</p>
          )}
        </div>
      </div>
      
      {item.hasInput && item.checked && (
        <div className="ml-7 animate-in slide-in-from-top-1 duration-200">
          <Label className="text-xs text-muted-foreground mb-1 block">{item.inputLabel || "Value"}</Label>
          <Input 
            value={item.inputValue || ""} 
            onChange={(e) => onInputChange?.(e.target.value)}
            disabled={disabled}
            className="h-8 text-sm"
            placeholder="Enter details..."
          />
        </div>
      )}
    </div>
  );
}
