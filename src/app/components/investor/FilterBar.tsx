import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Search } from "lucide-react";

interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  selectedIndustry: string;
  onIndustryChange: (value: string) => void;
  selectedStage: string;
  onStageChange: (value: string) => void;
  minRating: string;
  onMinRatingChange: (value: string) => void;
}

export function FilterBar({
  searchQuery,
  onSearchChange,
  selectedIndustry,
  onIndustryChange,
  selectedStage,
  onStageChange,
  minRating,
  onMinRatingChange,
}: FilterBarProps) {
  return (
    <div className="bg-white rounded-lg border p-6 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Search */}
        <div className="space-y-2">
          <Label htmlFor="search">Search</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280]" />
            <Input
              id="search"
              placeholder="Search ideas..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Industry */}
        <div className="space-y-2">
          <Label htmlFor="industry">Industry</Label>
          <Select value={selectedIndustry} onValueChange={onIndustryChange}>
            <SelectTrigger id="industry">
              <SelectValue placeholder="All Industries" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Industries</SelectItem>
              <SelectItem value="FinTech">FinTech</SelectItem>
              <SelectItem value="HealthTech">HealthTech</SelectItem>
              <SelectItem value="EdTech">EdTech</SelectItem>
              <SelectItem value="AI">AI</SelectItem>
              <SelectItem value="SaaS">SaaS</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Stage */}
        <div className="space-y-2">
          <Label htmlFor="stage">Stage</Label>
          <Select value={selectedStage} onValueChange={onStageChange}>
            <SelectTrigger id="stage">
              <SelectValue placeholder="All Stages" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stages</SelectItem>
              <SelectItem value="Idea">Idea</SelectItem>
              <SelectItem value="MVP">MVP</SelectItem>
              <SelectItem value="Beta">Beta</SelectItem>
              <SelectItem value="Launch">Launch</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Minimum Rating */}
        <div className="space-y-2">
          <Label htmlFor="rating">Minimum Rating</Label>
          <Select value={minRating} onValueChange={onMinRatingChange}>
            <SelectTrigger id="rating">
              <SelectValue placeholder="Any Rating" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Any Rating</SelectItem>
              <SelectItem value="3">3+ Stars</SelectItem>
              <SelectItem value="4">4+ Stars</SelectItem>
              <SelectItem value="4.5">4.5+ Stars</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
