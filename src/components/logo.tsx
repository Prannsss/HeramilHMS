import { Stethoscope } from "lucide-react";

export default function Logo() {
  return (
    <div className="flex items-center gap-2">
      <Stethoscope className="h-8 w-8 text-primary" />
      <h1 className="text-2xl font-bold text-primary">HeramilHMS</h1>
    </div>
  );
}
