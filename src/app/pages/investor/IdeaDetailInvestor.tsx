import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Textarea } from "../../components/ui/textarea";
import { Label } from "../../components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../components/ui/alert-dialog";
import { BookmarkButton } from "../../components/investor/BookmarkButton";
import { CompetitionIndicator } from "../../components/investor/CompetitionIndicator";
import { SendOfferModal } from "../../components/investor/SendOfferModal";
import { ArrowLeft, Star, MessageSquare, DollarSign, Pencil, Trash2 } from "lucide-react";
import { useIdeas } from "../../context/IdeasContext";
import { useFeedback } from "../../context/FeedbackContext";
import { useAuth } from "../../context/AuthContext";
import { useActivity } from "../../context/ActivityContext";
import {
  validateFeedback,
  hasErrors,
  FeedbackValidationErrors,
} from "../../data/validation";

export function IdeaDetailInvestor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { ideas } = useIdeas();
  const { feedback, addFeedback, updateFeedback, deleteFeedback, getIdeaStats } = useFeedback();
  const { currentUser } = useAuth();
  const { trackIdeaView, trackFeedbackGiven, trackOfferSent } = useActivity();

  useEffect(() => {
    if (id) trackIdeaView(id);
  }, [id, trackIdeaView]);

  const [offerModalOpen, setOfferModalOpen] = useState(false);

  // New feedback form state
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [formErrors, setFormErrors] = useState<FeedbackValidationErrors>({});

  // Inline edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRating, setEditRating] = useState(5);
  const [editComment, setEditComment] = useState("");
  const [editErrors, setEditErrors] = useState<FeedbackValidationErrors>({});

  // Delete state
  const [feedbackToDelete, setFeedbackToDelete] = useState<string | null>(null);

  const idea = ideas.find((i) => i.id === id);
  const ideaFeedback = feedback.filter((f) => f.ideaId === id);
  const { avgRating, feedbackCount } = getIdeaStats(id ?? "");

  if (!idea) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p>Idea not found</p>
      </div>
    );
  }

  function handleSubmitFeedback(e: React.FormEvent) {
    e.preventDefault();
    const errors = validateFeedback({ rating, comment });
    if (hasErrors(errors)) {
      setFormErrors(errors);
      return;
    }
    addFeedback({
      ideaId: id!,
      user: currentUser?.name ?? "Investor",
      rating,
      comment: comment.trim(),
    });
    trackFeedbackGiven();
    setComment("");
    setRating(5);
    setFormErrors({});
  }

  function startEditing(feedbackId: string, currentRating: number, currentComment: string) {
    setEditingId(feedbackId);
    setEditRating(currentRating);
    setEditComment(currentComment);
    setEditErrors({});
  }

  function handleSaveEdit(feedbackId: string) {
    const errors = validateFeedback({ rating: editRating, comment: editComment });
    if (hasErrors(errors)) {
      setEditErrors(errors);
      return;
    }
    updateFeedback(feedbackId, { rating: editRating, comment: editComment.trim() });
    setEditingId(null);
    setEditErrors({});
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Button
        variant="ghost"
        onClick={() => navigate("/investor/marketplace")}
        className="mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Marketplace
      </Button>

      {/* Idea Card */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <CardTitle className="text-4xl mb-3">{idea.title}</CardTitle>
              <CardDescription className="flex items-center gap-3 text-base mb-4">
                <span className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium bg-[#4F46E5]/10 text-[#4F46E5]">
                  {idea.industry}
                </span>
                <span className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium bg-[#06B6D4]/10 text-[#06B6D4]">
                  {idea.stage}
                </span>
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-lg text-[#111827] mb-2">Description</h3>
              <p className="text-[#6B7280] text-base leading-relaxed">{idea.description}</p>
            </div>

            <div className="flex items-center gap-6 pt-4 border-t">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                <span className="font-semibold text-lg">{avgRating.toFixed(1)}</span>
                <span className="text-[#6B7280]">Average Rating</span>
              </div>
              <div className="flex items-center gap-2 text-[#6B7280]">
                <MessageSquare className="w-5 h-5" />
                <span>{feedbackCount} feedback responses</span>
              </div>
            </div>

            <div className="pt-4 border-t">
              <h3 className="font-semibold text-lg text-[#111827] mb-3">Investor Interest</h3>
              <CompetitionIndicator ideaId={idea.id} variant="full" />
            </div>

            <div className="pt-4 border-t">
              <h3 className="font-semibold text-lg text-[#111827] mb-3">Investment Opportunity</h3>
              <p className="text-[#6B7280] mb-4">
                Interested in this startup? Send an investment offer to the founder.
              </p>
              <Button
                onClick={() => setOfferModalOpen(true)}
                className="bg-[#4F46E5] hover:bg-[#4338CA] text-white"
                size="lg"
              >
                <DollarSign className="w-5 h-5 mr-2" />
                Send Offer
              </Button>
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <BookmarkButton ideaId={idea.id} variant="full" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feedback List */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-2xl">Community Feedback</CardTitle>
          <CardDescription>
            See what other investors and entrepreneurs think about this idea
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {ideaFeedback.length > 0 ? (
            ideaFeedback.map((fb) =>
              editingId === fb.id ? (
                <Card key={fb.id} className="bg-[#F9FAFB] border-0">
                  <CardContent className="pt-6 space-y-3">
                    <div className="space-y-1">
                      <Label>Rating</Label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setEditRating(star)}
                            className="focus:outline-none"
                          >
                            <Star
                              className={`w-7 h-7 ${
                                star <= editRating
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-gray-300"
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                      {editErrors.rating && (
                        <p className="text-sm text-red-600">{editErrors.rating}</p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <Label>Comment</Label>
                      <Textarea
                        value={editComment}
                        onChange={(e) => setEditComment(e.target.value)}
                        rows={3}
                      />
                      {editErrors.comment && (
                        <p className="text-sm text-red-600">{editErrors.comment}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="bg-[#4F46E5] hover:bg-[#4338CA] text-white"
                        onClick={() => handleSaveEdit(fb.id)}
                      >
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingId(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card key={fb.id} className="bg-[#F9FAFB] border-0">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#4F46E5] flex items-center justify-center">
                          <span className="text-white font-semibold">{fb.user[0]}</span>
                        </div>
                        <div>
                          <p className="font-semibold text-[#111827]">{fb.user}</p>
                          <p className="text-xs text-[#6B7280]">{fb.createdAt}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-full">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="font-semibold text-sm">{fb.rating}</span>
                        </div>
                        {(currentUser?.role === "Admin" ||
                          fb.user === currentUser?.name) && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => startEditing(fb.id, fb.rating, fb.comment)}
                            >
                              <Pencil className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => setFeedbackToDelete(fb.id)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                    <p className="text-[#6B7280]">{fb.comment}</p>
                  </CardContent>
                </Card>
              )
            )
          ) : (
            <div className="text-center py-8 text-[#6B7280]">
              No feedback yet. Be the first to share your thoughts!
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Feedback Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="w-6 h-6 text-[#4F46E5]" />
            Rate This Idea
          </CardTitle>
          <CardDescription>
            Share your feedback to help improve this startup concept
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmitFeedback} className="space-y-6" noValidate>
            <div className="space-y-3">
              <Label className="text-base">Your Rating</Label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="focus:outline-none transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-10 h-10 ${
                        star <= rating
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  </button>
                ))}
              </div>
              {formErrors.rating && (
                <p className="text-sm text-red-600">{formErrors.rating}</p>
              )}
            </div>
            <div className="space-y-3">
              <Label htmlFor="comment" className="text-base">Your Feedback</Label>
              <Textarea
                id="comment"
                placeholder="Share your thoughts, suggestions, or questions about this idea..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={5}
              />
              {formErrors.comment && (
                <p className="text-sm text-red-600">{formErrors.comment}</p>
              )}
            </div>
            <Button
              type="submit"
              className="w-full bg-[#4F46E5] hover:bg-[#4338CA] text-white"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Submit Feedback
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Delete Feedback Dialog */}
      <AlertDialog
        open={!!feedbackToDelete}
        onOpenChange={(open) => !open && setFeedbackToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this feedback?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (feedbackToDelete) deleteFeedback(feedbackToDelete);
                setFeedbackToDelete(null);
              }}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <SendOfferModal
        open={offerModalOpen}
        onOpenChange={setOfferModalOpen}
        idea={idea}
      />
    </div>
  );
}
