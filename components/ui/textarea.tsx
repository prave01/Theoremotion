import * as React from "react";

import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "placeholder:text-muted-foreground dark:bg-input/30 flex field-sizing-content w-full border-none bg-transparent px-3 py-2 text-base outline-none focus-visible:border-none focus-visible:ring-[0px] disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-none md:text-sm",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
