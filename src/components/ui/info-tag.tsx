import { Info } from "lucide-react";

export default function InfoTag({ children }) {
  return (
    <span className="inline-flex items-center text-muted-foreground text-xs col-span-2 space-x-2">
      <Info className="size-4 mr-1" />
      {children}
    </span>
  );
}
