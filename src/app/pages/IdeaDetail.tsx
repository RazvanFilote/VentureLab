import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "../components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../components/ui/select";
import { ArrowLeft, Pencil, Trash2, Star, CheckCircle2, Clock, Circle, Plus, Loader2 } from "lucide-react";
import { useIdeas } from "../context/IdeasContext";
import { useAuth } from "../context/AuthContext";
import { useFeedback } from "../context/FeedbackContext";
import { useMilestones } from "../context/MilestonesContext";
import { isApiMode } from "../api/client";
import { validateFeedback, hasErrors, FeedbackValidationErrors } from "../data/validation";
import type { Milestone } from "../api/types";

type Tab = "feedback" | "milestones";

const STATUS_ICONS: Record<Milestone["status"], React.ReactNode> = {
  Pending: <Circle className="w-4 h-4 text-gray-400" />,
  InProgress: <Clock className="w-4 h-4 text-[#F59E0B]" />,
  Done: <CheckCircle2 className="w-4 h-4 text-green-500" />,
};

const STATUS_COLORS: Record<Milestone["status"], string> = {
  Pending: "bg-gray-100 text-gray-600",
  InProgress: "bg-yellow-100 text-yellow-700",
  Done: "bg-green-100 text-green-700",
};

export function IdeaDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { ideas, deleteIdea } = useIdeas();
  const { feedback, addFeedback, updateFeedback, deleteFeedback, getIdeaStats } = useFeedback();
  const { currentUser } = useAuth();
  const { milestones, loading: milestonesLoading, fetchMilestones, createMilestone, updateMilestone, deleteMilestone } = useMilestones();

  const [activeTab, setActiveTab] = useState<Tab>("feedback");

  // Feedback state
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [formErrors, setFormErrors] = useState<FeedbackValidationErrors>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRating, setEditRating] = useState(5);
  const [editComment, setEditComment] = useState("");
  const [editErrors, setEditErrors] = useState<FeedbackValidationErrors>({});
  const [showDeleteIdeaDialog, setShowDeleteIdeaDialog] = useState(false);
  const [feedbackToDelete, setFeedbackToDelete] = useState<string | null>(null);

  // Milestone state
  const [newMilestoneTitle, setNewMilestoneTitle] = useState("");
  const [newMilestoneDesc, setNewMilestoneDesc] = useState("");
  const [newMilestoneDue, setNewMilestoneDue] = useState("");
  const [milestoneFormOpen, setMilestoneFormOpen] = useState(false);
  const [milestoneSubmitting, setMilestoneSubmitting] = useState(false);
  const [milestoneError, setMilestoneError] = useState("");
  const [milestoneToDelete, setMilestoneToDelete] = useState<string | null>(null);
  const [editingMilestone, setEditingMilestone] = useState<string | null>(null);
  const [editMilestoneStatus, setEditMilestoneStatus] = useState<Milestone["status"]>("Pending");

  const idea = ideas.find((i) => i.id === id);
  const ideaFeedback = feedback.filter((f) => f.ideaId === id);
  const { avgRating, feedbackCount } = getIdeaStats(id ?? "");
  const ideaMilestones = id ? (milestones[id] ?? []) : [];

  // Fetch milestones when tab opens (only in API mode)
  useEffect(() => {
    if (activeTab === "milestones" && id && isApiMode) {
      fetchMilestones(id);
    }
  }, [activeTab, id, fetchMilestones]);

  if (!idea) {
    return <div className="container mx-auto px-4 py-8"><p>Idea not found</p></div>;
  }

  const canManage = currentUser?.role === "Admin" || idea.createdBy === currentUser?.name;

  function handleDeleteIdea() {
    deleteIdea(idea.id);
    navigate("/app/ideas");
  }

  function handleSubmitFeedback(e: React.FormEvent) {
    e.preventDefault();
    const errors = validateFeedback({ rating, comment });
    if (hasErrors(errors)) { setFormErrors(errors); return; }
    addFeedback({ ideaId: id!, user: currentUser?.name ?? "Anonymous", rating, comment: comment.trim() });
    setComment(""); setRating(5); setFormErrors({});
  }

  function startEditing(feedbackId: string, r: number, c: string) {
    setEditingId(feedbackId); setEditRating(r); setEditComment(c); setEditErrors({});
  }

  function handleSaveEdit(feedbackId: string) {
    const errors = validateFeedback({ rating: editRating, comment: editComment });
    if (hasErrors(errors)) { setEditErrors(errors); return; }
    updateFeedback(feedbackId, { rating: editRating, comment: editComment.trim() });
    setEditingId(null); setEditErrors({});
  }

  async function handleCreateMilestone(e: React.FormEvent) {
    e.preventDefault();
    if (!newMilestoneTitle.trim()) { setMilestoneError("Title is required"); return; }
    setMilestoneSubmitting(true);
    setMilestoneError("");
    try {
      await createMilestone(id!, { title: newMilestoneTitle.trim(), description: newMilestoneDesc.trim(), dueDate: newMilestoneDue || null });
      setNewMilestoneTitle(""); setNewMilestoneDesc(""); setNewMilestoneDue("");
      setMilestoneFormOpen(false);
    } catch (err) {
      setMilestoneError(err instanceof Error ? err.message : "Failed to create milestone");
    } finally {
      setMilestoneSubmitting(false);
    }
  }

  async function handleUpdateStatus(milestoneId: string, status: Milestone["status"]) {
    try {
      await updateMilestone(id!, milestoneId, { status });
      setEditingMilestone(null);
    } catch {}
  }

  async function handleDeleteMilestone(milestoneId: string) {
    try {
      await deleteMilestone(id!, milestoneId);
      setMilestoneToDelete(null);
    } catch {}
  }

  const doneCount = ideaMilestones.filter((m) => m.status === "Done").length;
  const completionPct = ideaMilestones.length > 0 ? Math.round((doneCount / ideaMilestones.length) * 100) : 0;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Button variant="ghost" onClick={() => navigate("/app/ideas")} className="mb-4">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Ideas
      </Button>

      {/* Idea Card */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-3xl mb-2">{idea.title}</CardTitle>
              <CardDescription className="flex items-center gap-4 text-base">
                <span className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium bg-[#4F46E5]/10 text-[#4F46E5]">{idea.industry}</span>
                <span className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium bg-[#06B6D4]/10 text-[#06B6D4]">{idea.stage}</span>
              </CardDescription>
            </div>
            {canManage && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => navigate(`/app/ideas/${id}/edit`)}>
                  <Pencil className="w-4 h-4 mr-2" /> Edit
                </Button>
                <Button variant="outline" size="sm" className="text-red-600 border-red-600 hover:bg-red-50" onClick={() => setShowDeleteIdeaDialog(true)}>
                  <Trash2 className="w-4 h-4 mr-2" /> Delete
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-[#111827] mb-2">Description</h3>
              <p className="text-[#6B7280]">{idea.description}</p>
            </div>
            <div className="flex items-center gap-6 pt-4 border-t">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                <span className="font-semibold">{avgRating.toFixed(1)}</span>
                <span className="text-[#6B7280]">Average Rating</span>
              </div>
              <div className="text-[#6B7280]">{feedbackCount} feedback responses</div>
              {isApiMode && ideaMilestones.length > 0 && (
                <div className="text-[#6B7280]">
                  <span className="font-semibold text-green-600">{completionPct}%</span> milestones done
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="flex gap-1 bg-white border rounded-lg p-1 shadow-sm mb-6 w-fit">
        <button
          onClick={() => setActiveTab("feedback")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === "feedback" ? "bg-[#4F46E5] text-white" : "text-gray-600 hover:text-gray-900"}`}
        >
          Feedback ({ideaFeedback.length})
        </button>
        {isApiMode && (
          <button
            onClick={() => setActiveTab("milestones")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === "milestones" ? "bg-[#4F46E5] text-white" : "text-gray-600 hover:text-gray-900"}`}
          >
            Milestones {ideaMilestones.length > 0 && `(${doneCount}/${ideaMilestones.length})`}
          </button>
        )}
      </div>

      {/* ── FEEDBACK TAB ───────────────────────────────────────────────── */}
      {activeTab === "feedback" && (
        <>
          <Card className="mb-6">
            <CardHeader><CardTitle className="text-2xl">Community Feedback</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {ideaFeedback.length > 0 ? ideaFeedback.map((fb) =>
                editingId === fb.id ? (
                  <Card key={fb.id} className="bg-[#F9FAFB]">
                    <CardContent className="pt-6 space-y-3">
                      <div className="space-y-1">
                        <Label>Rating</Label>
                        <div className="flex gap-2">
                          {[1,2,3,4,5].map((star) => (
                            <button key={star} type="button" onClick={() => setEditRating(star)} className="focus:outline-none">
                              <Star className={`w-7 h-7 ${star <= editRating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />
                            </button>
                          ))}
                        </div>
                        {editErrors.rating && <p className="text-sm text-red-600">{editErrors.rating}</p>}
                      </div>
                      <div className="space-y-1">
                        <Label>Comment</Label>
                        <Textarea value={editComment} onChange={(e) => setEditComment(e.target.value)} rows={3} />
                        {editErrors.comment && <p className="text-sm text-red-600">{editErrors.comment}</p>}
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" className="bg-[#4F46E5] hover:bg-[#4338CA] text-white" onClick={() => handleSaveEdit(fb.id)}>Save</Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>Cancel</Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card key={fb.id} className="bg-[#F9FAFB]">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-[#4F46E5] flex items-center justify-center">
                            <span className="text-white text-sm font-medium">{fb.user[0]}</span>
                          </div>
                          <span className="font-semibold">{fb.user}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span className="font-semibold">{fb.rating}</span>
                          </div>
                          {(currentUser?.role === "Admin" || fb.user === currentUser?.name) && (
                            <>
                              <Button variant="ghost" size="sm" onClick={() => startEditing(fb.id, fb.rating, fb.comment)}><Pencil className="w-3 h-3" /></Button>
                              <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => setFeedbackToDelete(fb.id)}><Trash2 className="w-3 h-3" /></Button>
                            </>
                          )}
                        </div>
                      </div>
                      <p className="text-[#6B7280] ml-10">{fb.comment}</p>
                    </CardContent>
                  </Card>
                )
              ) : (
                <p className="text-[#6B7280] text-center py-4">No feedback yet. Be the first to share your thoughts!</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Add Your Feedback</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitFeedback} className="space-y-4" noValidate>
                <div className="space-y-2">
                  <Label>Rating (1-5 stars)</Label>
                  <div className="flex gap-2">
                    {[1,2,3,4,5].map((star) => (
                      <button key={star} type="button" onClick={() => setRating(star)} className="focus:outline-none">
                        <Star className={`w-8 h-8 ${star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />
                      </button>
                    ))}
                  </div>
                  {formErrors.rating && <p className="text-sm text-red-600">{formErrors.rating}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="comment">Comment</Label>
                  <Textarea id="comment" placeholder="Share your thoughts on this idea..." value={comment} onChange={(e) => setComment(e.target.value)} rows={4} />
                  {formErrors.comment && <p className="text-sm text-red-600">{formErrors.comment}</p>}
                </div>
                <Button type="submit" className="bg-[#4F46E5] hover:bg-[#4338CA] text-white">Submit Feedback</Button>
              </form>
            </CardContent>
          </Card>
        </>
      )}

      {/* ── MILESTONES TAB ─────────────────────────────────────────────── */}
      {activeTab === "milestones" && isApiMode && (
        <div className="space-y-4">
          {/* Progress bar */}
          {ideaMilestones.length > 0 && (
            <Card>
              <CardContent className="pt-5">
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium text-gray-700">Overall Completion</span>
                  <span className="font-bold text-[#4F46E5]">{completionPct}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-[#4F46E5] transition-all duration-500" style={{ width: `${completionPct}%` }} />
                </div>
                <p className="text-xs text-gray-500 mt-1">{doneCount} of {ideaMilestones.length} completed</p>
              </CardContent>
            </Card>
          )}

          {/* Milestone list */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Milestones</CardTitle>
                {canManage && (
                  <Button size="sm" className="bg-[#4F46E5] hover:bg-[#4338CA] text-white" onClick={() => setMilestoneFormOpen(true)}>
                    <Plus className="w-3 h-3 mr-1" /> Add Milestone
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {milestonesLoading[id!] && (
                <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-[#4F46E5]" /></div>
              )}

              {!milestonesLoading[id!] && ideaMilestones.length === 0 && (
                <p className="text-[#6B7280] text-center py-6">No milestones yet. Add one to track progress!</p>
              )}

              {ideaMilestones.map((m) => (
                <div key={m.id} className="flex items-start gap-3 p-3 rounded-lg border bg-gray-50/50 hover:bg-gray-50 transition-colors">
                  <div className="mt-0.5 shrink-0">{STATUS_ICONS[m.status]}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm">{m.title}</p>
                    {m.description && <p className="text-xs text-gray-500 mt-0.5">{m.description}</p>}
                    {m.dueDate && <p className="text-xs text-gray-400 mt-1">Due: {m.dueDate}</p>}
                    {editingMilestone === m.id && canManage ? (
                      <div className="mt-2 flex items-center gap-2">
                        <Select value={editMilestoneStatus} onValueChange={(v) => setEditMilestoneStatus(v as Milestone["status"])}>
                          <SelectTrigger className="h-7 text-xs w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Pending">Pending</SelectItem>
                            <SelectItem value="InProgress">In Progress</SelectItem>
                            <SelectItem value="Done">Done</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button size="sm" className="h-7 text-xs" onClick={() => handleUpdateStatus(m.id, editMilestoneStatus)}>Save</Button>
                        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setEditingMilestone(null)}>Cancel</Button>
                      </div>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[m.status]}`}>{m.status}</span>
                    {canManage && (
                      <>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => { setEditingMilestone(m.id); setEditMilestoneStatus(m.status); }}>
                          <Pencil className="w-3 h-3" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => setMilestoneToDelete(m.id)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Add Milestone form */}
          {milestoneFormOpen && canManage && (
            <Card>
              <CardHeader><CardTitle className="text-base">New Milestone</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={handleCreateMilestone} className="space-y-3">
                  <div className="space-y-1">
                    <Label>Title *</Label>
                    <Input value={newMilestoneTitle} onChange={(e) => setNewMilestoneTitle(e.target.value)} placeholder="e.g. Launch MVP" />
                  </div>
                  <div className="space-y-1">
                    <Label>Description</Label>
                    <Textarea value={newMilestoneDesc} onChange={(e) => setNewMilestoneDesc(e.target.value)} rows={2} placeholder="Optional details..." />
                  </div>
                  <div className="space-y-1">
                    <Label>Due Date</Label>
                    <Input type="date" value={newMilestoneDue} onChange={(e) => setNewMilestoneDue(e.target.value)} />
                  </div>
                  {milestoneError && <p className="text-sm text-red-600">{milestoneError}</p>}
                  <div className="flex gap-2">
                    <Button type="submit" className="bg-[#4F46E5] hover:bg-[#4338CA] text-white" disabled={milestoneSubmitting}>
                      {milestoneSubmitting && <Loader2 className="w-3 h-3 mr-2 animate-spin" />}
                      Create Milestone
                    </Button>
                    <Button type="button" variant="outline" onClick={() => { setMilestoneFormOpen(false); setMilestoneError(""); }}>Cancel</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Dialogs */}
      <AlertDialog open={showDeleteIdeaDialog} onOpenChange={setShowDeleteIdeaDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this idea?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone. "{idea.title}" will be permanently removed.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteIdea} className="bg-red-600 hover:bg-red-700 text-white">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!feedbackToDelete} onOpenChange={(open) => !open && setFeedbackToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this feedback?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (feedbackToDelete) deleteFeedback(feedbackToDelete); setFeedbackToDelete(null); }} className="bg-red-600 hover:bg-red-700 text-white">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!milestoneToDelete} onOpenChange={(open) => !open && setMilestoneToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this milestone?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => milestoneToDelete && handleDeleteMilestone(milestoneToDelete)} className="bg-red-600 hover:bg-red-700 text-white">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
