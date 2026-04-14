import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const Select = React.forwardRef(({ className, children, ...props }, ref) => {
    const [open, setOpen] = React.useState(false);

    return (
        <SelectPrimitive.Root
            ref={ref}
            open={open}
            onOpenChange={setOpen}
            {...props}
        >
            <SelectPrimitive.Trigger
                className={cn(
                    "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                    className
                )}
            >
                <SelectPrimitive.Value placeholder="Select an option" />
                <SelectPrimitive.Icon className="ml-2 h-4 w-4 shrink-0 opacity-50">
                    <ChevronDown className="h-4 w-4" />
                </SelectPrimitive.Icon>
            </SelectPrimitive.Trigger>
            <SelectPrimitive.Portal>
                <SelectPrimitive.Content
                    className={cn(
                        "relative z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0",
                        className
                    )}
                >
                    <SelectPrimitive.Viewport className="p-1">
                        <SelectPrimitive.Group>
                            {children}
                        </SelectPrimitive.Group>
                    </SelectPrimitive.Viewport>
                </SelectPrimitive.Content>
            </SelectPrimitive.Portal>
        </SelectPrimitive.Root>
    );
});
Select.displayName = "Select";

export { Select };
