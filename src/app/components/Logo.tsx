import { FlaskConical, Rocket } from "lucide-react";
import { forwardRef } from "react";

interface LogoProps {
  size?: "sm" | "md" | "lg";
}

export const Logo = forwardRef<HTMLDivElement, LogoProps>(
  ({ size = "md" }, ref) => {
    const sizes = {
      sm: { icon: 20, text: "text-lg" },
      md: { icon: 28, text: "text-2xl" },
      lg: { icon: 36, text: "text-4xl" },
    };

    const config = sizes[size];

    return (
      <div ref={ref} className="flex items-center gap-2">
        <div className="relative">
          <FlaskConical
            size={config.icon}
            className="text-[#4F46E5]"
            strokeWidth={2}
          />
          <Rocket
            size={config.icon * 0.5}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[#06B6D4]"
            strokeWidth={2.5}
          />
        </div>
        <span className={`${config.text} font-bold text-[#111827]`}>
          VentureLab
        </span>
      </div>
    );
  }
);

Logo.displayName = "Logo";