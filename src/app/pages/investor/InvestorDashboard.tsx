import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { StartupIdeaCard } from "../../components/investor/StartupIdeaCard";
import {
  TrendingUp, Clock, Bookmark, Activity, Eye, Filter, DollarSign, MessageSquare, Trash2
} from "lucide-react";
import { useIdeas } from "../../context/IdeasContext";
import { useBookmarks } from "../../context/BookmarksContext";
import { useActivity } from "../../context/ActivityContext";
import { FadeInItem } from "../../components/PageTransition";
import { motion } from "motion/react";

export function InvestorDashboard() {
  const { ideas } = useIdeas();
  const { savedIdeaIds } = useBookmarks();
  const { activity, clearActivity } = useActivity();

  const trendingIdeas = [...ideas]
    .sort((a, b) => b.avgRating - a.avgRating)
    .slice(0, 3);

  const recentIdeas = [...ideas]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);

  const savedIdeas = ideas.filter((idea) => savedIdeaIds.includes(idea.id)).slice(0, 2);

  const recentlyViewedIdeas = ideas
    .filter((idea) => activity.recentlyViewedIdeas.includes(idea.id))
    .sort(
      (a, b) =>
        activity.recentlyViewedIdeas.indexOf(a.id) -
        activity.recentlyViewedIdeas.indexOf(b.id)
    )
    .slice(0, 3);

  const recentVisits = activity.pageVisits.slice(-5).reverse();

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-6 sm:mb-8"
      >
        <h1 className="text-2xl sm:text-4xl font-bold text-[#111827] mb-2">Investor Dashboard</h1>
        <p className="text-sm sm:text-lg text-[#6B7280]">
          Discover and evaluate promising startup ideas
        </p>
      </motion.div>

      {/* ── Activity Insights Panel (Cookie Monitoring) ──── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.05 }}
        className="mb-8"
      >
        <Card className="border-[#06B6D4]/20 bg-gradient-to-br from-[#06B6D4]/5 to-[#4F46E5]/5">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-[#06B6D4]" />
                <CardTitle className="text-base font-semibold text-gray-900">
                  Your Activity
                </CardTitle>
                <span className="text-xs text-gray-400 font-normal">(tracked via cookies)</span>
              </div>
              <button
                onClick={clearActivity}
                className="p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                title="Clear activity data"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              {[
                { icon: Eye, label: "Pages Visited", value: activity.pageVisits.length, color: "#4F46E5" },
                { icon: Filter, label: "Last Filter", value: activity.lastFilter || "—", color: "#06B6D4" },
                { icon: DollarSign, label: "Offers Sent", value: activity.offersSentCount, color: "#10B981" },
                { icon: MessageSquare, label: "Feedback Given", value: activity.feedbackGivenCount, color: "#F59E0B" },
              ].map(({ icon: Icon, label, value, color }) => (
                <div key={label} className="bg-white rounded-xl p-3 text-center shadow-sm">
                  <Icon className="w-4 h-4 mx-auto mb-1" style={{ color }} />
                  <p className="text-lg font-bold text-gray-900">{value}</p>
                  <p className="text-xs text-gray-500">{label}</p>
                </div>
              ))}
            </div>

            {recentVisits.length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-500 mb-2">Recent pages:</p>
                <div className="flex flex-wrap gap-1.5">
                  {recentVisits.map((v, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 text-xs bg-white border border-gray-200 rounded-full text-gray-600"
                    >
                      {v.path}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Trending Ideas */}
      <section className="mb-10 sm:mb-12">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-[#4F46E5]" />
          <h2 className="text-xl sm:text-2xl font-bold text-[#111827]">Trending Ideas</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {trendingIdeas.map((idea, i) => (
            <FadeInItem key={idea.id} index={i}>
              <StartupIdeaCard idea={idea} />
            </FadeInItem>
          ))}
        </div>
      </section>

      {/* Recently Viewed (from cookies) */}
      {recentlyViewedIdeas.length > 0 && (
        <section className="mb-10 sm:mb-12">
          <div className="flex items-center gap-2 mb-4">
            <Eye className="w-5 h-5 text-[#06B6D4]" />
            <h2 className="text-xl sm:text-2xl font-bold text-[#111827]">Recently Viewed</h2>
            <span className="text-xs text-gray-400">(from cookies)</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {recentlyViewedIdeas.map((idea, i) => (
              <FadeInItem key={idea.id} index={i}>
                <StartupIdeaCard idea={idea} />
              </FadeInItem>
            ))}
          </div>
        </section>
      )}

      {/* Recently Added */}
      <section className="mb-10 sm:mb-12">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-[#06B6D4]" />
          <h2 className="text-xl sm:text-2xl font-bold text-[#111827]">Recently Added</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {recentIdeas.map((idea, i) => (
            <FadeInItem key={idea.id} index={i}>
              <StartupIdeaCard idea={idea} />
            </FadeInItem>
          ))}
        </div>
      </section>

      {/* Saved Ideas */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Bookmark className="w-5 h-5 text-[#4F46E5]" />
          <h2 className="text-xl sm:text-2xl font-bold text-[#111827]">My Saved Ideas</h2>
        </div>
        {savedIdeas.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {savedIdeas.map((idea, i) => (
              <FadeInItem key={idea.id} index={i}>
                <StartupIdeaCard idea={idea} compact />
              </FadeInItem>
            ))}
          </div>
        ) : (
          <p className="text-[#6B7280] text-sm">
            No saved ideas yet. Bookmark ideas from the marketplace!
          </p>
        )}
      </section>
    </div>
  );
}
