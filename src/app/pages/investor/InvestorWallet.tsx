import { useState } from "react";
import { useNavigate } from "react-router";
import { Wallet, TrendingUp, Lock, Plus, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { useAuth } from "../../context/AuthContext";
import { useWallet } from "../../context/WalletContext";
import { useOffers } from "../../context/OffersContext";

const TOP_UP_OPTIONS = [5_000, 10_000, 25_000, 50_000, 100_000];

export function InvestorWallet() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { getTotal, getAvailable, getCommitted, topUp } = useWallet();
  const { offers } = useOffers();

  const [selected, setSelected] = useState(10_000);
  const [topped, setTopped] = useState(false);

  const name = currentUser?.name ?? "";
  const total = getTotal(name);
  const available = getAvailable(name);
  const committed = getCommitted(name);

  const pendingOffers = offers.filter(o => o.investorName === name && o.status === "Pending");
  const acceptedOffers = offers.filter(o => o.investorName === name && o.status === "Accepted");

  function handleTopUp() {
    topUp(name, selected);
    setTopped(true);
    setTimeout(() => setTopped(false), 2000);
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <Button variant="ghost" onClick={() => navigate("/investor")} className="mb-4">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Dashboard
      </Button>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#111827] mb-1 flex items-center gap-3">
          <Wallet className="w-8 h-8 text-[#06B6D4]" />
          My Wallet
        </h1>
        <p className="text-[#6B7280]">Manage your investment budget</p>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          { label: "Total Deposited", value: total, icon: TrendingUp, color: "#4F46E5", bg: "bg-[#4F46E5]/10" },
          { label: "Available", value: available, icon: Wallet, color: "#10B981", bg: "bg-green-100" },
          { label: "Committed", value: committed, icon: Lock, color: "#F59E0B", bg: "bg-yellow-100" },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label} className="shadow-sm">
            <CardContent className="pt-5 flex items-center gap-4">
              <div className={`p-3 ${bg} rounded-lg shrink-0`}>
                <Icon className="w-5 h-5" style={{ color }} />
              </div>
              <div>
                <p className="text-xs text-gray-500">{label}</p>
                <p className="text-xl font-bold text-gray-900">€{value.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Top-up */}
      <Card className="mb-8 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Plus className="w-5 h-5 text-[#06B6D4]" />
            Top Up Balance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 mb-4">Select an amount to add to your wallet:</p>
          <div className="flex flex-wrap gap-2 mb-5">
            {TOP_UP_OPTIONS.map(amt => (
              <button
                key={amt}
                onClick={() => setSelected(amt)}
                className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                  selected === amt
                    ? "bg-[#06B6D4] text-white border-[#06B6D4] shadow-sm"
                    : "bg-white text-gray-700 border-gray-200 hover:border-[#06B6D4] hover:text-[#06B6D4]"
                }`}
              >
                €{amt.toLocaleString()}
              </button>
            ))}
          </div>
          <Button
            onClick={handleTopUp}
            className={`transition-all ${topped ? "bg-green-600 hover:bg-green-600" : "bg-[#06B6D4] hover:bg-[#0891B2]"} text-white`}
          >
            {topped ? "✓ Balance Updated!" : `Top Up €${selected.toLocaleString()}`}
          </Button>
        </CardContent>
      </Card>

      {/* Committed breakdown */}
      {(pendingOffers.length > 0 || acceptedOffers.length > 0) && (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Committed Funds Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {pendingOffers.length > 0 && (
              <div>
                <p className="text-sm font-medium text-yellow-700 mb-2">Pending Offers (locked until resolved)</p>
                <div className="space-y-2">
                  {pendingOffers.map(o => (
                    <div key={o.id} className="flex items-center justify-between bg-yellow-50 rounded-lg px-3 py-2 text-sm">
                      <span className="text-gray-700">{o.ideaTitle}</span>
                      <span className="font-semibold text-yellow-800">€{o.amount.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {acceptedOffers.length > 0 && (
              <div>
                <p className="text-sm font-medium text-green-700 mb-2">Accepted Investments</p>
                <div className="space-y-2">
                  {acceptedOffers.map(o => (
                    <div key={o.id} className="flex items-center justify-between bg-green-50 rounded-lg px-3 py-2 text-sm">
                      <span className="text-gray-700">{o.ideaTitle}</span>
                      <span className="font-semibold text-green-800">€{o.amount.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
