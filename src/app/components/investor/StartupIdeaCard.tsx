import { useNavigate } from "react-router";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { BookmarkButton } from "./BookmarkButton";
import { CompetitionIndicator } from "./CompetitionIndicator";
import { Star } from "lucide-react";
import { Idea } from "../../data/mockData";
import { useFeedback } from "../../context/FeedbackContext";

interface StartupIdeaCardProps {
  idea: Idea;
  showBookmark?: boolean;
  compact?: boolean;
}

export function StartupIdeaCard({ idea, showBookmark = true, compact = false }: StartupIdeaCardProps) {
  const navigate = useNavigate();
  const { getIdeaStats } = useFeedback();
  const { avgRating, feedbackCount } = getIdeaStats(idea.id);

  return (
    <Card className="h-full flex flex-col hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <CardTitle className={compact ? "text-lg" : "text-xl"}>{idea.title}</CardTitle>
            <CardDescription className="flex items-center gap-2 mt-2">
              <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-[#4F46E5]/10 text-[#4F46E5]">
                {idea.industry}
              </span>
              <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-[#06B6D4]/10 text-[#06B6D4]">
                {idea.stage}
              </span>
            </CardDescription>
          </div>
          {showBookmark && <BookmarkButton ideaId={idea.id} />}
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="flex items-center gap-1 mb-3">
          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
          <span className="font-semibold">{avgRating.toFixed(1)}</span>
          <span className="text-sm text-[#6B7280]">({feedbackCount} reviews)</span>
        </div>
        
        {/* Competition Indicator */}
        <div className="mb-3">
          <CompetitionIndicator ideaId={idea.id} variant="compact" />
        </div>
        
        {!compact && (
          <p className="text-[#6B7280] text-sm line-clamp-3">{idea.description}</p>
        )}
      </CardContent>
      <CardFooter>
        <Button
          onClick={() => navigate(`/investor/ideas/${idea.id}`)}
          className="w-full bg-[#4F46E5] hover:bg-[#4338CA] text-white"
        >
          View Details
        </Button>
      </CardFooter>
    </Card>
  );
}