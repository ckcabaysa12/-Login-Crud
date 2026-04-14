import * as React from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { Check, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const DropdownMenu = React.forwardRef(({ className, children, ...props }, ref) => {
    const [open, setOpen] = React.useState(false);

    return (
        <DropdownMenuPrimitive.Root
            ref={ref}
            open={open}
            onOpenChange={setOpen}
            {...props}
        >
            <DropdownMenuPrimitive.Trigger asChild>
                {children}
            </DropdownMenuPrimitive.Trigger>
            <DropdownMenuPrimitive.Portal>
                <DropdownMenuPrimitive.Content
                    className={cn(
                        "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0",
                        className
                    )}
                    {...props}
                >
                    {children}
                </DropdownMenuPrimitive.Content>
            </DropdownMenuPrimitive.Portal>
        </DropdownMenuPrimitive.Root>
    );
});
DropdownMenu.displayName = "DropdownMenu";

const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;
const DropdownMenuContent = DropdownMenuPrimitive.Content;
const DropdownMenuItem = React.forwardRef(({ className, inset, children, ...props }, ref) => {
    return (
        <DropdownMenuPrimitive.Item
            ref={ref}
            className={cn(
                "relative flex cursor-default select-none py-1.5 px-2 rounded-sm outline-none focus:bg-accent focus:text-accent-foreground data-[state=highlighted]:bg-accent",
                inset && "pl-8",
                className
            )}
            {...props}
        >
            {children}
        </DropdownMenuPrimitive.Item>
    );
});
DropdownMenuItem.displayName = "DropdownMenuItem";

export { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem };
