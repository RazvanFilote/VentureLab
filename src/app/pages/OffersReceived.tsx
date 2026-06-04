import { useState } from "react";
import { useNavigate } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "../components/ui/table";
import {
  Pagination, PaginationContent, PaginationItem,
  PaginationLink, PaginationNext, PaginationPrevious,
} from "../components/ui/pagination";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "../components/ui/alert-dialog";
import { ArrowLeft, DollarSign, CheckCircle, XCircle, Eye, Trash2, AlertTriangle } from "lucide-react";
import { useOffers } from "../context/OffersContext";
import { useIdeas } from "../context/IdeasContext";
import { useAuth } from "../context/AuthContext";
import { Offer } from "../data/mockData";

const ITEMS_PER_PAGE = 5;

function statusClass(status: string) {
  switch (status) {
    case "Accepted": return "bg-green-100 text-green-800 border-green-200";
    case "Rejected": return "bg-red-100 text-red-800 border-red-200";
    default: return "bg-yellow-100 text-yellow-800 border-yellow-200";
  }
}

export function OffersReceived() {
  const navigate = useNavigate();
  const { offers, updateOfferStatus, deleteOffer } = useOffers();
  const { ideas } = useIdeas();
  const { currentUser } = useAuth();

  const [currentPage, setCurrentPage] = useState(1);
  const [offerToDelete, setOfferToDelete] = useState<string | null>(null);
  const [pendingAccept, setPendingAccept] = useState<Offer | null>(null);

  const myIdeaIds = new Set(
    currentUser?.role === "Admin"
      ? ideas.map(i => i.id)
      : ideas.filter(i => i.createdBy === currentUser?.name).map(i => i.id)
  );
  const filteredOffers = offers.filter(o => myIdeaIds.has(o.ideaId));

  const totalPages = Math.ceil(filteredOffers.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentOffers = filteredOffers.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  function getOwnerPercent(ideaId: string): number {
    return Math.max(0, 100 - offers
      .filter(o => o.ideaId === ideaId && o.status === "Accepted")
      .reduce((sum, o) => sum + o.equity, 0));
  }

  function getIdea(ideaId: string) {
    return ideas.find(i => i.id === ideaId);
  }

  function handleAcceptClick(offer: Offer) {
    const ownerPct = getOwnerPercent(offer.ideaId);
    const afterPct = ownerPct - offer.equity;
    if (afterPct < 51) {
      setPendingAccept(offer);
    } else {
      updateOfferStatus(offer.id, "Accepted");
    }
  }

  function handleAcceptConfirm() {
    if (pendingAccept) {
      updateOfferStatus(pendingAccept.id, "Accepted");
      setPendingAccept(null);
    }
  }

  function handleDeleteConfirm() {
    if (offerToDelete) {
      deleteOffer(offerToDelete);
      setOfferToDelete(null);
      if (currentOffers.length === 1 && currentPage > 1) setCurrentPage(p => p - 1);
    }
  }

  const pendingAcceptAfterPct = pendingAccept
    ? getOwnerPercent(pendingAccept.ideaId) - pendingAccept.equity
    : 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <Button variant="ghost" onClick={() => navigate("/app")} className="mb-4">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Dashboard
      </Button>

      <div className="mb-8">
        <h1 className="text-4xl font-bold text-[#111827] mb-2 flex items-center gap-3">
          <DollarSign className="w-10 h-10 text-[#4F46E5]" />
          Offers Received
        </h1>
        <p className="text-lg text-[#6B7280]">Review and manage investment offers from potential investors</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Investment Proposals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Investor</TableHead>
                  <TableHead>Startup</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Equity</TableHead>
                  <TableHead>Your Ownership</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentOffers.map(offer => {
                  const ownerPct = getOwnerPercent(offer.ideaId);
                  const afterPct = ownerPct - offer.equity;
                  const isBlocked = offer.status === "Pending" && afterPct < 10;
                  const idea = getIdea(offer.ideaId);

                  return (
                    <TableRow key={offer.id}>
                      <TableCell className="font-medium">{offer.investorName}</TableCell>
                      <TableCell>
                        <div>
                          <p>{offer.ideaTitle}</p>
                          {idea && (
                            <p className="text-xs text-gray-500 mt-0.5">
                              Owner: <span className="font-medium text-gray-700">{ownerPct}%</span>
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>€{offer.amount.toLocaleString()}</TableCell>
                      <TableCell>{offer.equity}%</TableCell>
                      <TableCell>
                        {offer.status === "Pending" ? (
                          <div className="text-sm">
                            <span className="text-gray-700">{ownerPct}%</span>
                            <span className="text-gray-400 mx-1">→</span>
                            <span className={afterPct < 10 ? "text-red-600 font-semibold" : afterPct < 51 ? "text-orange-600 font-semibold" : "text-green-600 font-semibold"}>
                              {afterPct}%
                            </span>
                            {afterPct < 10 && <span className="ml-1 text-xs text-red-500">(blocked)</span>}
                            {afterPct >= 10 && afterPct < 51 && <span className="ml-1 text-xs text-orange-500">(⚠ minority)</span>}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-600">{ownerPct}%</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusClass(offer.status)}`}>
                          {offer.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => navigate(`/app/offers/${offer.id}`)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          {offer.status === "Pending" && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={isBlocked}
                                title={isBlocked ? `Accepting would drop your ownership to ${afterPct}% (minimum 10%)` : "Accept offer"}
                                className={isBlocked ? "opacity-40 cursor-not-allowed" : "text-green-600 hover:text-green-700 hover:bg-green-50"}
                                onClick={() => !isBlocked && handleAcceptClick(offer)}
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                                onClick={() => updateOfferStatus(offer.id, "Rejected")}
                              >
                                <XCircle className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                          {offer.status !== "Accepted" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => setOfferToDelete(offer.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {currentOffers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-[#6B7280] py-8">
                      No offers received yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="mt-6">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <PaginationItem key={page}>
                      <PaginationLink
                        onClick={() => setCurrentPage(page)}
                        isActive={currentPage === page}
                        className="cursor-pointer"
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Below 51% warning dialog */}
      <AlertDialog open={!!pendingAccept} onOpenChange={open => !open && setPendingAccept(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-orange-600">
              <AlertTriangle className="w-5 h-5" />
              Majority Ownership Warning
            </AlertDialogTitle>
            <AlertDialogDescription>
              Accepting this offer will reduce your ownership in{" "}
              <strong>{pendingAccept?.ideaTitle}</strong> to{" "}
              <strong className="text-orange-600">{pendingAcceptAfterPct}%</strong>.
              You will no longer hold the majority stake (below 51%).
              <br /><br />
              Are you sure you want to proceed?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAcceptConfirm}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              Accept Anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!offerToDelete} onOpenChange={open => !open && setOfferToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this offer?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The offer will be permanently removed.
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
