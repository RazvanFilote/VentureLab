import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { DollarSign } from "lucide-react";
import { Idea } from "../../data/mockData";
import { useOffers } from "../../context/OffersContext";
import { useAuth } from "../../context/AuthContext";
import { useActivity } from "../../context/ActivityContext";
import { useWallet } from "../../context/WalletContext";
import {
  validateOffer,
  hasErrors,
  OfferValidationErrors,
} from "../../data/validation";

interface SendOfferModalProps {
  idea: Idea;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SendOfferModal({ idea, open, onOpenChange }: SendOfferModalProps) {
  const { addOffer, offers } = useOffers();
  const { currentUser } = useAuth();
  const { trackOfferSent } = useActivity();
  const { getAvailable } = useWallet();
  const [amount, setAmount] = useState("");
  const [equity, setEquity] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<OfferValidationErrors>({});

  const name = currentUser?.name ?? "";
  const available = getAvailable(name);

  const ownerPercent = Math.max(0, 100 - offers
    .filter(o => o.ideaId === idea.id && o.status === "Accepted")
    .reduce((sum, o) => sum + o.equity, 0));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validationErrors = validateOffer({ amount, equity, message });
    if (hasErrors(validationErrors)) {
      setErrors(validationErrors);
      return;
    }
    if (Number(amount) > available) {
      setErrors({ amount: `Insufficient balance. Available: €${available.toLocaleString()}` });
      return;
    }
    if (Number(equity) > ownerPercent) {
      setErrors({ equity: `Cannot exceed owner's current share of ${ownerPercent}%` });
      return;
    }
    addOffer({
      ideaId: idea.id,
      ideaTitle: idea.title,
      investorName: currentUser?.name ?? "Investor",
      amount: Number(amount),
      equity: Number(equity),
      message: message.trim(),
    });
    trackOfferSent();
    setAmount("");
    setEquity("");
    setMessage("");
    setErrors({});
    onOpenChange(false);
  }

  function handleClose() {
    setAmount("");
    setEquity("");
    setMessage("");
    setErrors({});
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-[#4F46E5]" />
            Send Investment Offer
          </DialogTitle>
          <DialogDescription>
            Submit your investment proposal for{" "}
            <span className="font-semibold">{idea.title}</span>
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} noValidate>
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between bg-[#06B6D4]/5 border border-[#06B6D4]/20 rounded-lg px-3 py-2 text-sm">
              <span className="text-gray-600">Available balance</span>
              <span className="font-semibold text-[#06B6D4]">€{available.toLocaleString()}</span>
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Investment Amount (€)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="50000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="1"
                step="1000"
              />
              {errors.amount && (
                <p className="text-sm text-red-600">{errors.amount}</p>
              )}
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="equity">Equity Requested (%)</Label>
                <span className="text-xs text-gray-500">Max available: <span className="font-medium text-gray-700">{ownerPercent}%</span></span>
              </div>
              <Input
                id="equity"
                type="number"
                placeholder="10"
                value={equity}
                onChange={(e) => setEquity(e.target.value)}
                min="0.1"
                max={ownerPercent}
                step="0.1"
              />
              {errors.equity && (
                <p className="text-sm text-red-600">{errors.equity}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Message to Founder</Label>
              <Textarea
                id="message"
                placeholder="Tell the founder why you're interested in their startup..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
              />
              {errors.message && (
                <p className="text-sm text-red-600">{errors.message}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" className="bg-[#4F46E5] hover:bg-[#4338CA] text-white">
              Send Offer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
