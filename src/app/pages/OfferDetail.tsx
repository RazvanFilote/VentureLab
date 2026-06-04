import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "../components/ui/alert-dialog";
import { ArrowLeft, CheckCircle, XCircle, Trash2, DollarSign, AlertTriangle } from "lucide-react";
import { useOffers } from "../context/OffersContext";

function statusClass(status: string) {
  switch (status) {
    case "Accepted": return "bg-green-100 text-green-800 border-green-200";
    case "Rejected": return "bg-red-100 text-red-800 border-red-200";
    default: return "bg-yellow-100 text-yellow-800 border-yellow-200";
  }
}

export function OfferDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { offers, updateOfferStatus, deleteOffer } = useOffers();

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showAcceptWarning, setShowAcceptWarning] = useState(false);

  const offer = offers.find(o => o.id === id);

  if (!offer) {
    return <div className="container mx-auto px-4 py-8"><p>Offer not found</p></div>;
  }

  function getOwnerPercent(ideaId: string): number {
    return Math.max(0, 100 - offers
      .filter(o => o.ideaId === ideaId && o.status === "Accepted")
      .reduce((sum, o) => sum + o.equity, 0));
  }

  const ownerPct = getOwnerPercent(offer.ideaId);
  const afterPct = ownerPct - offer.equity;
  const isBlocked = offer.status === "Pending" && afterPct < 10;

  function handleAcceptClick() {
    if (afterPct < 51) {
      setShowAcceptWarning(true);
    } else {
      updateOfferStatus(offer!.id, "Accepted");
    }
  }

  function handleAcceptConfirm() {
    updateOfferStatus(offer!.id, "Accepted");
    setShowAcceptWarning(false);
  }

  function handleDelete() {
    deleteOffer(offer!.id);
    navigate("/app/offers");
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Button variant="ghost" onClick={() => navigate("/app/offers")} className="mb-4">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Offers
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <CardTitle className="text-2xl flex items-center gap-2">
              <DollarSign className="w-6 h-6 text-[#4F46E5]" />
              Offer Details
            </CardTitle>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${statusClass(offer.status)}`}>
              {offer.status}
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-[#6B7280]">Investor</p>
              <p className="font-semibold text-[#111827]">{offer.investorName}</p>
            </div>
            <div>
              <p className="text-sm text-[#6B7280]">Startup</p>
              <p className="font-semibold text-[#111827]">{offer.ideaTitle}</p>
            </div>
            <div>
              <p className="text-sm text-[#6B7280]">Amount</p>
              <p className="font-semibold text-[#111827] text-lg">€{offer.amount.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-[#6B7280]">Equity</p>
              <p className="font-semibold text-[#111827] text-lg">{offer.equity}%</p>
            </div>
            {offer.status === "Pending" && (
              <div className="col-span-2 bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-[#6B7280] mb-1">Ownership Impact</p>
                <p className="text-sm">
                  Your current share: <strong>{ownerPct}%</strong>
                  <span className="text-gray-400 mx-2">→</span>
                  After accepting:{" "}
                  <strong className={afterPct < 10 ? "text-red-600" : afterPct < 51 ? "text-orange-600" : "text-green-600"}>
                    {afterPct}%
                  </strong>
                  {afterPct < 10 && <span className="ml-2 text-xs text-red-500">(cannot accept — below 10% minimum)</span>}
                  {afterPct >= 10 && afterPct < 51 && <span className="ml-2 text-xs text-orange-500">(⚠ drops below majority)</span>}
                </p>
              </div>
            )}
            <div className="col-span-2">
              <p className="text-sm text-[#6B7280]">Date</p>
              <p className="text-[#111827]">{offer.createdAt}</p>
            </div>
            <div className="col-span-2">
              <p className="text-sm text-[#6B7280] mb-1">Message</p>
              <p className="text-[#111827] bg-[#F9FAFB] p-3 rounded-lg border">{offer.message}</p>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t flex-wrap">
            {offer.status === "Pending" && (
              <>
                <Button
                  onClick={handleAcceptClick}
                  disabled={isBlocked}
                  title={isBlocked ? `Cannot accept — would drop ownership to ${afterPct}% (minimum 10%)` : undefined}
                  className="bg-green-600 hover:bg-green-700 text-white disabled:opacity-40"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Accept
                </Button>
                <Button
                  onClick={() => updateOfferStatus(offer.id, "Rejected")}
                  variant="outline"
                  className="text-red-600 border-red-600 hover:bg-red-50"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject
                </Button>
              </>
            )}
            {offer.status !== "Accepted" && (
              <Button
                variant="outline"
                className="ml-auto text-red-600 border-red-600 hover:bg-red-50"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Below 51% warning */}
      <AlertDialog open={showAcceptWarning} onOpenChange={setShowAcceptWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-orange-600">
              <AlertTriangle className="w-5 h-5" />
              Majority Ownership Warning
            </AlertDialogTitle>
            <AlertDialogDescription>
              Accepting this offer will reduce your ownership in{" "}
              <strong>{offer.ideaTitle}</strong> to{" "}
              <strong className="text-orange-600">{afterPct}%</strong>.
              You will no longer hold the majority stake (below 51%).
              <br /><br />
              Are you sure you want to proceed?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleAcceptConfirm} className="bg-orange-600 hover:bg-orange-700 text-white">
              Accept Anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this offer?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The offer from {offer.investorName} will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
