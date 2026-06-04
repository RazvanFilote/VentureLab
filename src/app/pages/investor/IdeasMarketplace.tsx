import { useState, useCallback } from "react";
import { FilterBar } from "../../components/investor/FilterBar";
import { StartupIdeaCard } from "../../components/investor/StartupIdeaCard";
import { useIdeas } from "../../context/IdeasContext";
import { useActivity } from "../../context/ActivityContext";
import { FadeInItem } from "../../components/PageTransition";
import { motion } from "motion/react";
import { Loader2 } from "lucide-react";
import { useInfiniteScroll } from "../../hooks/useInfiniteScroll";
import { ideasApi, isApiMode } from "../../api/client";
import type { IdeaApiItem, PageResult } from "../../api/types";
import type { Idea } from "../../data/mockData";

const PAGE_SIZE = 12;

type ListIdea = Idea | IdeaApiItem;

function toCard(item: ListIdea): Idea {
  if ("createdBy" in item) return item as Idea;
  const api = item as IdeaApiItem;
  return {
    id: api.id, title: api.title, industry: api.industry, stage: api.stage,
    description: api.description, createdBy: api.createdBy, createdAt: api.createdAt,
    avgRating: 0, feedbackCount: 0,
  };
}

export function IdeasMarketplace() {
  const { ideas } = useIdeas();
  const { trackFilterUsed } = useActivity();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIndustry, setSelectedIndustry] = useState("all");
  const [selectedStage, setSelectedStage] = useState("all");
  const [minRating, setMinRating] = useState("0");

  function handleIndustryChange(val: string) {
    setSelectedIndustry(val);
    if (val !== "all") trackFilterUsed(val);
  }

  const fetchPage = useCallback(
    async (page: number): Promise<PageResult<ListIdea>> => {
      if (isApiMode) {
        return ideasApi.list(page, PAGE_SIZE) as Promise<PageResult<ListIdea>>;
      }
      const total = ideas.length;
      const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
      const start = (page - 1) * PAGE_SIZE;
      return { items: ideas.slice(start, start + PAGE_SIZE) as ListIdea[], total, page, pageSize: PAGE_SIZE, pages };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isApiMode, ideas.length]
  );

  const { items, loading, hasMore, sentinelRef } = useInfiniteScroll<ListIdea>({ fetchPage, pageSize: PAGE_SIZE });

  const filteredItems = items.map(toCard).filter((idea) => {
    const matchesSearch =
      idea.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      idea.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesIndustry = selectedIndustry === "all" || idea.industry === selectedIndustry;
    const matchesStage = selectedStage === "all" || idea.stage === selectedStage;
    const matchesRating = idea.avgRating >= parseFloat(minRating);
    return matchesSearch && matchesIndustry && matchesStage && matchesRating;
  });

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-6"
      >
        <h1 className="text-2xl sm:text-4xl font-bold text-[#111827] mb-2">Ideas Marketplace</h1>
        <p className="text-sm sm:text-lg text-[#6B7280]">
          Explore startup ideas and find your next investment
        </p>
      </motion.div>

      <FilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedIndustry={selectedIndustry}
        onIndustryChange={handleIndustryChange}
        selectedStage={selectedStage}
        onStageChange={setSelectedStage}
        minRating={minRating}
        onMinRatingChange={setMinRating}
      />

      <div className="mb-4">
        <p className="text-sm text-[#6B7280]">
          Showing {filteredItems.length} {filteredItems.length === 1 ? "idea" : "ideas"}
        </p>
      </div>

      {filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredItems.map((idea, i) => (
            <FadeInItem key={idea.id} index={i}>
              <StartupIdeaCard idea={idea} />
            </FadeInItem>
          ))}
        </div>
      ) : !loading ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-2xl border p-12 text-center"
        >
          <p className="text-lg text-[#6B7280]">
            No ideas match your filters. Try adjusting your search criteria.
          </p>
        </motion.div>
      ) : null}

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="py-8 flex justify-center">
        {loading && <Loader2 className="w-6 h-6 animate-spin text-[#4F46E5]" />}
        {!loading && !hasMore && items.length > 0 && (
          <p className="text-sm text-gray-400">All ideas loaded</p>
        )}
      </div>
    </div>
  );
}
