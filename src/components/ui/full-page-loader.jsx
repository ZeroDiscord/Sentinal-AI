import { Loader2 } from "lucide-react";

export default function FullPageLoader({ text = "Loading..." }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full">
      <Loader2 className="animate-spin h-12 w-12 text-cyan-400 mb-4" />
      <span className="text-lg text-muted-foreground">{text}</span>
    </div>
  );
} 