import { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import {
  ArrowLeft, Rocket, TrendingUp, CheckCircle, Star, Plus, Pencil, Trash2, Eye, Users, DollarSign,
  Play, Square, Wifi, WifiOff,
} from "lucide-react";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, LineChart, Line,
} from "recharts";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "../components/ui/alert-dialog";
import { Button } from "../components/ui/button";
import { useIdeas } from "../context/IdeasContext";
import { useOffers } from "../context/OffersContext";
import { useFeedback } from "../context/FeedbackContext";
import { useAuth } from "../context/AuthContext";
import { useActivity } from "../context/ActivityContext";
import { useWebSocket } from "../context/WebSocketContext";

const PIE_COLORS = {
  Pending: "#FBBF24",
  Accepted: "#10B981",
  Rejected: "#EF4444",
};

const INDUSTRY_COLORS: Record<string, string> = {
  HealthTech: "#06B6D4",
  FinTech: "#4F46E5",
  EdTech: "#8B5CF6",
  AI: "#F59E0B",
  SaaS: "#10B981",
  "E-commerce": "#EF4444",
  Other: "#6B7280",
};

const ITEMS_PER_PAGE = 5;

export function AnalyticsDashboard() {
  const navigate = useNavigate();
  const { ideas, deleteIdea } = useIdeas();
  const { offers } = useOffers();
  const { getIdeaStats } = useFeedback();
  const { currentUser } = useAuth();
  const { trackPageVisit } = useActivity();
  const { wsConnected, generatorRunning, startGenerator, stopGenerator } = useWebSocket();

  const [view, setView] = useState<"parallel" | "analytics">("parallel");
  const [currentPage, setCurrentPage] = useState(1);
  const [ideaToDelete, setIdeaToDelete] = useState<string | null>(null);

  // ── Scope data to the current user's ideas (Admin sees all) ─────────────
  const myIdeas = useMemo(() =>
    currentUser?.role === "Admin"
      ? ideas
      : ideas.filter((i) => i.createdBy === currentUser?.name),
    [ideas, currentUser]
  );

  const myIdeaIds = useMemo(() => new Set(myIdeas.map((i) => i.id)), [myIdeas]);

  const myOffers = useMemo(() =>
    offers.filter((o) => myIdeaIds.has(o.ideaId)),
    [offers, myIdeaIds]
  );

  // ── Derived data from real context ──────────────────────────────────────
  const enrichedIdeas = useMemo(() =>
    myIdeas.map((idea) => {
      const stats = getIdeaStats(idea.id);
      const ideaOffers = myOffers.filter((o) => o.ideaId === idea.id);
      return {
        ...idea,
        avgRating: stats.avgRating,
        feedbackCount: stats.feedbackCount,
        totalOffers: ideaOffers.length,
        acceptedOffers: ideaOffers.filter((o) => o.status === "Accepted").length,
      };
    }),
    [myIdeas, myOffers, getIdeaStats]
  );

  const totalStartups = enrichedIdeas.length;
  const totalOffers = myOffers.length;
  const acceptedOffers = myOffers.filter((o) => o.status === "Accepted").length;
  const avgRating = enrichedIdeas.length > 0
    ? (enrichedIdeas.reduce((s, i) => s + i.avgRating, 0) / enrichedIdeas.length).toFixed(1)
    : "0.0";

  // ── Chart data ───────────────────────────────────────────────────────────
  const offerStatusData = useMemo(() => {
    const counts = { Pending: 0, Accepted: 0, Rejected: 0 };
    myOffers.forEach((o) => { counts[o.status as keyof typeof counts]++; });
    return Object.entries(counts).map(([name, value]) => ({
      name, value, color: PIE_COLORS[name as keyof typeof PIE_COLORS],
    }));
  }, [myOffers]);

  const barChartData = useMemo(() =>
    enrichedIdeas.map((i) => ({
      name: i.title.length > 14 ? i.title.slice(0, 14) + "…" : i.title,
      offers: i.totalOffers,
      rating: parseFloat(i.avgRating.toFixed(1)),
    })),
    [enrichedIdeas]
  );

  const industryData = useMemo(() => {
    const map: Record<string, number> = {};
    enrichedIdeas.forEach((i) => { map[i.industry] = (map[i.industry] ?? 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [enrichedIdeas]);

  const ratingTrendData = useMemo(() =>
    [...enrichedIdeas]
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .map((i) => ({
        name: i.title.length > 10 ? i.title.slice(0, 10) + "…" : i.title,
        rating: parseFloat(i.avgRating.toFixed(1)),
      })),
    [enrichedIdeas]
  );

  // ── Ownership per idea ───────────────────────────────────────────────────
  const ownershipData = useMemo(() =>
    myIdeas.map(idea => {
      const accepted = offers.filter(o => o.ideaId === idea.id && o.status === "Accepted");
      const totalEquity = accepted.reduce((sum, o) => sum + o.equity, 0);
      const ownerPct = Math.max(0, 100 - totalEquity);
      const shareholders = [
        { name: idea.createdBy, percent: ownerPct, isOwner: true },
        ...accepted.map(o => ({ name: o.investorName, percent: o.equity, isOwner: false })),
      ];
      return { idea, ownerPct, shareholders };
    }),
    [myIdeas, offers]
  );

  // ── Top pending offers ───────────────────────────────────────────────────
  const topPendingOffers = useMemo(() =>
    myOffers
      .filter(o => o.status === "Pending")
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 8),
    [myOffers]
  );

  // ── Pagination ───────────────────────────────────────────────────────────
  const totalPages = Math.ceil(enrichedIdeas.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentItems = enrichedIdeas.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  function handleDeleteConfirm() {
    if (ideaToDelete) {
      deleteIdea(ideaToDelete);
      setIdeaToDelete(null);
      if (currentItems.length === 1 && currentPage > 1) setCurrentPage((p) => p - 1);
    }
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <div className="max-w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-[#4F46E5] mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl sm:text-3xl text-[#111827] mb-1 font-semibold">
                Analytics Dashboard
              </h1>
              <p className="text-gray-500 text-sm">
                Live insights into startup performance and investor engagement
              </p>
            </div>
            {/* Generator Controls */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-full border ${wsConnected ? "border-green-300 bg-green-50 text-green-700" : "border-gray-200 bg-gray-50 text-gray-400"}`}>
                {wsConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                {wsConnected ? "Live" : "Disconnected"}
              </div>
              {generatorRunning ? (
                <button
                  onClick={stopGenerator}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors font-medium border border-red-200"
                >
                  <Square className="w-3 h-3 fill-red-600" />
                  Stop Generator
                </button>
              ) : (
                <button
                  onClick={startGenerator}
                  disabled={!wsConnected}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-[#4F46E5]/10 text-[#4F46E5] hover:bg-[#4F46E5]/20 transition-colors font-medium border border-[#4F46E5]/20 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Play className="w-3 h-3 fill-[#4F46E5]" />
                  Start Generator
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          {[
            { label: "Total Startups", value: totalStartups, icon: Rocket, color: "#4F46E5", bg: "bg-[#4F46E5]/10" },
            { label: "Total Offers", value: totalOffers, icon: TrendingUp, color: "#06B6D4", bg: "bg-[#06B6D4]/10" },
            { label: "Accepted", value: acceptedOffers, icon: CheckCircle, color: "#10B981", bg: "bg-green-100" },
            { label: "Avg Rating", value: avgRating, icon: Star, color: "#F59E0B", bg: "bg-yellow-100" },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="bg-white rounded-xl shadow-sm p-4 sm:p-5 flex items-center gap-3 sm:gap-4">
              <div className={`p-2.5 sm:p-3 ${bg} rounded-lg shrink-0`}>
                <Icon className="w-5 h-5 sm:w-6 sm:h-6" style={{ color }} />
              </div>
              <div>
                <p className="text-xs text-gray-500">{label}</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* View Toggle */}
        <div className="bg-white rounded-lg shadow-sm p-1 inline-flex mb-6 gap-1">
          <button
            onClick={() => setView("parallel")}
            className={`px-4 sm:px-6 py-2 rounded-md text-sm transition-all font-medium ${
              view === "parallel" ? "bg-[#4F46E5] text-white shadow-sm" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Side-by-Side
          </button>
          <button
            onClick={() => setView("analytics")}
            className={`px-4 sm:px-6 py-2 rounded-md text-sm transition-all font-medium ${
              view === "analytics" ? "bg-[#4F46E5] text-white shadow-sm" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Analytics View
          </button>
        </div>

        {/* ── PARALLEL (Side-by-Side) VIEW ────────────────────────── */}
        {view === "parallel" && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 items-start">
            {/* Left: Tabular data */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="font-semibold text-gray-900">Ideas Table</h2>
                {(currentUser?.role === "Admin" || currentUser?.role === "StartupOwner") && (
                  <Button
                    size="sm"
                    onClick={() => navigate("/app/ideas/new")}
                    className="bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs h-8"
                  >
                    <Plus className="w-3 h-3 mr-1" /> New Idea
                  </Button>
                )}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">Industry</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stage</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Rating</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Offers</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Ownership</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {currentItems.map((idea) => (
                      <tr key={idea.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-3 font-medium text-gray-900 max-w-[120px] truncate">{idea.title}</td>
                        <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{idea.industry}</td>
                        <td className="px-4 py-3">
                          <span
                            className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                            style={{
                              backgroundColor: `${INDUSTRY_COLORS[idea.industry] ?? "#6B7280"}18`,
                              color: INDUSTRY_COLORS[idea.industry] ?? "#6B7280",
                            }}
                          >
                            {idea.stage}
                          </span>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <div className="flex items-center gap-1">
                            <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                            <span className="text-gray-700">{idea.avgRating.toFixed(1)}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-700 hidden md:table-cell">{idea.totalOffers}</td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          {(() => {
                            const accepted = offers.filter(o => o.ideaId === idea.id && o.status === "Accepted");
                            const pct = Math.max(0, 100 - accepted.reduce((s, o) => s + o.equity, 0));
                            return (
                              <span className={`text-sm font-medium ${pct < 51 ? "text-orange-600" : "text-green-600"}`}>
                                {pct}%
                              </span>
                            );
                          })()}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => navigate(`/app/ideas/${idea.id}`)}
                              className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 hover:text-[#4F46E5] transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            {(currentUser?.role === "Admin" || idea.createdBy === currentUser?.name) && (
                              <>
                                <button
                                  onClick={() => navigate(`/app/ideas/${idea.id}/edit`)}
                                  className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 hover:text-[#4F46E5] transition-colors"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setIdeaToDelete(idea.id)}
                                  className="p-1.5 rounded-md hover:bg-red-50 text-gray-500 hover:text-red-600 transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {currentItems.length === 0 && (
                      <tr>
                        <td colSpan={6} className="text-center text-gray-400 py-10">
                          No ideas yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                  <span>
                    {startIndex + 1}–{Math.min(startIndex + ITEMS_PER_PAGE, enrichedIdeas.length)} of{" "}
                    {enrichedIdeas.length}
                  </span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-2 py-1 border rounded text-xs hover:bg-gray-50 disabled:opacity-40"
                    >
                      Prev
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                      <button
                        key={p}
                        onClick={() => setCurrentPage(p)}
                        className={`px-2 py-1 border rounded text-xs ${
                          p === currentPage
                            ? "bg-[#4F46E5] text-white border-[#4F46E5]"
                            : "hover:bg-gray-50"
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-2 py-1 border rounded text-xs hover:bg-gray-50 disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Right: Live charts */}
            <div className="space-y-4">
              <div className="bg-white rounded-xl shadow-sm p-5">
                <h3 className="font-semibold text-gray-900 mb-4">Offers per Idea</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={barChartData} margin={{ bottom: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                    <XAxis dataKey="name" angle={-35} textAnchor="end" tick={{ fontSize: 11 }} height={60} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="offers" fill="#4F46E5" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-5">
                <h3 className="font-semibold text-gray-900 mb-4">Rating Trend</h3>
                <ResponsiveContainer width="100%" height={160}>
                  <LineChart data={ratingTrendData} margin={{ bottom: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                    <XAxis dataKey="name" angle={-35} textAnchor="end" tick={{ fontSize: 11 }} height={60} />
                    <YAxis domain={[0, 5]} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="rating"
                      stroke="#06B6D4"
                      strokeWidth={2}
                      dot={{ r: 4, fill: "#06B6D4" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-5">
                <h3 className="font-semibold text-gray-900 mb-4">Offer Status Distribution</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={offerStatusData}
                      cx="50%"
                      cy="45%"
                      outerRadius={65}
                      dataKey="value"
                    >
                      {offerStatusData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name) => [`${value}`, name]} />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* ── ANALYTICS VIEW ───────────────────────────────────────── */}
        {view === "analytics" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Offer Status Pie */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="font-semibold text-gray-900 mb-5">Offer Status Distribution</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={offerStatusData}
                      cx="50%"
                      cy="45%"
                      outerRadius={90}
                      dataKey="value"
                    >
                      {offerStatusData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name) => [`${value}`, name]} />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Offers per Startup Bar */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="font-semibold text-gray-900 mb-5">Offers per Startup</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={barChartData} margin={{ bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                    <XAxis dataKey="name" angle={-40} textAnchor="end" tick={{ fontSize: 11 }} height={70} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="offers" fill="#4F46E5" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Industry Distribution Pie */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="font-semibold text-gray-900 mb-5">Ideas by Industry</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={industryData}
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {industryData.map((entry, i) => (
                        <Cell
                          key={i}
                          fill={INDUSTRY_COLORS[entry.name] ?? "#6B7280"}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Top Startups by Rating */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="font-semibold text-gray-900 mb-5">Top Startups by Rating</h3>
                <div className="space-y-3">
                  {[...enrichedIdeas]
                    .sort((a, b) => b.avgRating - a.avgRating)
                    .slice(0, 5)
                    .map((idea, i) => (
                      <div
                        key={idea.id}
                        className={`flex items-center gap-3 p-3 rounded-lg ${
                          i === 0
                            ? "bg-gradient-to-r from-[#4F46E5]/10 to-[#06B6D4]/10 border border-[#4F46E5]/20"
                            : "bg-gray-50"
                        }`}
                      >
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                            i === 0 ? "bg-[#4F46E5] text-white" : "bg-white text-gray-500 border"
                          }`}
                        >
                          {i + 1}
                        </div>
                        <p className="flex-1 text-sm font-medium text-gray-900 truncate">{idea.title}</p>
                        <div className="flex items-center gap-1 shrink-0">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-semibold text-gray-800">
                            {idea.avgRating.toFixed(1)}
                          </span>
                        </div>
                      </div>
                    ))}
                  {enrichedIdeas.length === 0 && (
                    <p className="text-gray-400 text-sm text-center py-6">No ideas yet.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Top Pending Offers */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-5 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-[#4F46E5]" />
                Highest Pending Offers
              </h3>
              {topPendingOffers.length > 0 ? (
                <div className="space-y-2">
                  {topPendingOffers.map((o, i) => (
                    <div key={o.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-6 h-6 rounded-full bg-[#4F46E5]/10 flex items-center justify-center text-xs font-bold text-[#4F46E5] shrink-0">
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{o.ideaTitle}</p>
                        <p className="text-xs text-gray-500">{o.investorName} · {o.equity}% equity</p>
                      </div>
                      <span className="text-sm font-semibold text-[#4F46E5] shrink-0">
                        €{o.amount.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-sm text-center py-6">No pending offers.</p>
              )}
            </div>

            {/* Ownership Breakdown */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-5 flex items-center gap-2">
                <Users className="w-4 h-4 text-[#06B6D4]" />
                Ownership Structure
              </h3>
              {ownershipData.length > 0 ? (
                <div className="space-y-5">
                  {ownershipData.map(({ idea, shareholders }) => (
                    <div key={idea.id}>
                      <p className="text-sm font-medium text-gray-800 mb-2 truncate">{idea.title}</p>
                      {/* Stacked bar */}
                      <div className="flex h-5 rounded-full overflow-hidden mb-2">
                        {shareholders.map((s, i) => {
                          const colors = ["#4F46E5", "#06B6D4", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];
                          return (
                            <div
                              key={i}
                              style={{ width: `${s.percent}%`, backgroundColor: s.isOwner ? "#4F46E5" : colors[i % colors.length] }}
                              title={`${s.name}: ${s.percent}%`}
                            />
                          );
                        })}
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1">
                        {shareholders.map((s, i) => {
                          const colors = ["#4F46E5", "#06B6D4", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];
                          return (
                            <div key={i} className="flex items-center gap-1.5">
                              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: s.isOwner ? "#4F46E5" : colors[i % colors.length] }} />
                              <span className="text-xs text-gray-600">{s.name}</span>
                              <span className="text-xs font-semibold text-gray-800">{s.percent}%</span>
                              {s.isOwner && <span className="text-xs text-gray-400">(owner)</span>}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-sm text-center py-6">No ideas yet.</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!ideaToDelete} onOpenChange={(open) => !open && setIdeaToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this idea?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The startup idea will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
