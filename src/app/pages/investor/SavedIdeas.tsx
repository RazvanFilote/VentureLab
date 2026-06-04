import { StartupIdeaCard } from "../../components/investor/StartupIdeaCard";
import { Bookmark } from "lucide-react";
import { useBookmarks } from "../../context/BookmarksContext";
import { useIdeas } from "../../context/IdeasContext";

export function SavedIdeas() {
  const { savedIdeaIds } = useBookmarks();
  const { ideas } = useIdeas();

  const savedIdeas = ideas.filter((idea) => savedIdeaIds.includes(idea.id));

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Bookmark className="w-8 h-8 text-[#4F46E5]" />
        <div>
          <h1 className="text-4xl font-bold text-[#111827]">Saved Ideas</h1>
          <p className="text-lg text-[#6B7280]">
            Your bookmarked startup ideas ({savedIdeas.length})
          </p>
        </div>
      </div>

      {savedIdeas.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {savedIdeas.map((idea) => (
            <StartupIdeaCard key={idea.id} idea={idea} />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg border p-12 text-center">
          <Bookmark className="w-16 h-16 mx-auto mb-4 text-[#6B7280]" />
          <h3 className="text-xl font-semibold text-[#111827] mb-2">No saved ideas yet</h3>
          <p className="text-[#6B7280]">
            Start exploring the marketplace and bookmark ideas that interest you!
          </p>
        </div>
      )}
    </div>
  );
}
