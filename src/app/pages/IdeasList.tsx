import { useCallback, useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "../components/ui/alert-dialog";
import { Plus, Eye, Pencil, Trash2, Star, Loader2 } from "lucide-react";
import { useIdeas } from "../context/IdeasContext";
import { useAuth } from "../context/AuthContext";
import { useFeedback } from "../context/FeedbackContext";
import { useInfiniteScroll } from "../hooks/useInfiniteScroll";
import { ideasApi, isApiMode } from "../api/client";
import type { IdeaApiItem, PageResult } from "../api/types";
import type { Idea } from "../data/mockData";

const PAGE_SIZE = 8;

type ListIdea = Partial<Idea> & IdeaApiItem;

export function IdeasList() {
  const navigate = useNavigate();
  const { ideas, deleteIdea } = useIdeas();
  const { currentUser } = useAuth();
  const { getIdeaStats } = useFeedback();
  const [ideaToDelete, setIdeaToDelete] = useState<string | null>(null);

  const visibleLocal =
    currentUser?.role === "Admin"
      ? ideas
      : ideas.filter((idea) => idea.createdBy === currentUser?.name);

  const fetchPage = useCallback(
    async (page: number): Promise<PageResult<ListIdea>> => {
      if (isApiMode) {
        const result = await ideasApi.list(page, PAGE_SIZE);
        return result as PageResult<ListIdea>;
      }
      // Local context pagination
      const total = visibleLocal.length;
      const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
      const start = (page - 1) * PAGE_SIZE;
      const items = visibleLocal.slice(start, start + PAGE_SIZE) as ListIdea[];
      return { items, total, page, pageSize: PAGE_SIZE, pages };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isApiMode, visibleLocal.length]
  );

  const { items, loading, hasMore, sentinelRef } = useInfiniteScroll<ListIdea>({ fetchPage, pageSize: PAGE_SIZE });

  const canCreate = currentUser?.role === "StartupOwner" || currentUser?.role === "Admin";

  function handleDeleteConfirm() {
    if (ideaToDelete) {
      deleteIdea(ideaToDelete);
      setIdeaToDelete(null);
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-[#111827]">Startup Ideas</h1>
          </div>
          {canCreate && (
            <Button onClick={() => navigate("/app/ideas/new")} className="bg-[#4F46E5] hover:bg-[#4338CA] text-white">
              <Plus className="w-4 h-4 mr-2" />
              Create Idea
            </Button>
          )}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-[#6B7280]">
                <th className="pb-3 font-medium">Title</th>
                <th className="pb-3 font-medium">Industry</th>
                <th className="pb-3 font-medium">Stage</th>
                {!isApiMode && <th className="pb-3 font-medium">Avg Rating</th>}
                {!isApiMode && <th className="pb-3 font-medium">Feedback</th>}
                <th className="pb-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((idea) => {
                const stats = !isApiMode ? getIdeaStats(idea.id) : null;
                return (
                  <tr key={idea.id} className="border-b hover:bg-gray-50 transition-colors">
                    <td className="py-3 font-medium text-[#111827] max-w-[200px] truncate">{idea.title}</td>
                    <td className="py-3 text-[#6B7280]">{idea.industry}</td>
                    <td className="py-3">
                      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-[#4F46E5]/10 text-[#4F46E5]">
                        {idea.stage}
                      </span>
                    </td>
                    {stats !== null && (
                      <td className="py-3">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          {stats.avgRating.toFixed(1)}
                        </div>
                      </td>
                    )}
                    {stats !== null && <td className="py-3 text-[#6B7280]">{stats.feedbackCount}</td>}
                    <td className="py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => navigate(`/app/ideas/${idea.id}`)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        {(currentUser?.role === "Admin" || idea.createdBy === currentUser?.name) && (
                          <>
                            <Button variant="ghost" size="sm" onClick={() => navigate(`/app/ideas/${idea.id}/edit`)}>
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost" size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => setIdeaToDelete(idea.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {items.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="text-center text-[#6B7280] py-8">
                    No ideas found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Infinite scroll sentinel */}
        <div ref={sentinelRef} className="py-4 flex justify-center">
          {loading && <Loader2 className="w-5 h-5 animate-spin text-[#4F46E5]" />}
          {!loading && !hasMore && items.length > 0 && (
            <p className="text-xs text-gray-400">All {items.length} ideas loaded</p>
          )}
        </div>
      </div>

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
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700 text-white">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
