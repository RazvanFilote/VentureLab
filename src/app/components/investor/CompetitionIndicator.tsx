import { Flame } from "lucide-react";
import { useOffers } from "../../context/OffersContext";

interface CompetitionIndicatorProps {
  ideaId: string;
  variant?: "compact" | "full";
}

function computeCompetition(offerCount: number) {
  if (offerCount === 0) return { level: "None", color: "#9CA3AF" };
  if (offerCount <= 2) return { level: "Low", color: "#10B981" };
  if (offerCount <= 5) return { level: "Medium", color: "#F59E0B" };
  return { level: "High", color: "#EF4444" };
}

export function CompetitionIndicator({ ideaId, variant = "compact" }: CompetitionIndicatorProps) {
  const { offers } = useOffers();
  const count = offers.filter((o) => o.ideaId === ideaId).length;
  const { level, color } = computeCompetition(count);

  if (count === 0 && variant === "compact") {
    return null;
  }

  return (
    <div
      className={`flex items-center gap-2 ${
        variant === "full" ? "p-4 rounded-lg border-2" : "px-2.5 py-1 rounded-full"
      }`}
      style={
        variant === "full"
          ? { borderColor: color, backgroundColor: `${color}15` }
          : {}
      }
    >
      <Flame
        className={variant === "full" ? "w-5 h-5" : "w-4 h-4"}
        style={{ color }}
        fill={color}
      />
      <div className="flex items-center gap-2">
        <span
          className={`${variant === "full" ? "text-base" : "text-xs"} font-semibold`}
          style={{ color }}
        >
          {count} {count === 1 ? "investor" : "investors"}
        </span>
        {variant === "full" && (
          <>
            <span className="text-gray-400">•</span>
            <span className="text-sm font-medium" style={{ color }}>
              Competition: {level}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
