import { Button } from "../ui/button";
import { Bookmark } from "lucide-react";
import { useBookmarks } from "../../context/BookmarksContext";

interface BookmarkButtonProps {
  ideaId: string;
  variant?: "icon" | "full";
}

export function BookmarkButton({ ideaId, variant = "icon" }: BookmarkButtonProps) {
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const bookmarked = isBookmarked(ideaId);

  const handleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleBookmark(ideaId);
  };

  if (variant === "full") {
    return (
      <Button
        variant={bookmarked ? "default" : "outline"}
        onClick={handleBookmark}
        className={bookmarked ? "bg-[#4F46E5] hover:bg-[#4338CA] text-white" : ""}
      >
        <Bookmark className={`w-4 h-4 mr-2 ${bookmarked ? "fill-current" : ""}`} />
        {bookmarked ? "Bookmarked" : "Bookmark Idea"}
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleBookmark}
      className="shrink-0"
    >
      <Bookmark className={`w-5 h-5 ${bookmarked ? "fill-[#4F46E5] text-[#4F46E5]" : "text-[#6B7280]"}`} />
    </Button>
  );
}
