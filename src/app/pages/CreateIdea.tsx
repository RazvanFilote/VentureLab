import { useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { ArrowLeft } from "lucide-react";
import { useIdeas } from "../context/IdeasContext";
import { useAuth } from "../context/AuthContext";
import { validateIdea, hasErrors, IdeaValidationErrors } from "../data/validation";

export function CreateIdea() {
  const navigate = useNavigate();
  const { addIdea } = useIdeas();
  const { currentUser } = useAuth();

  const [title, setTitle] = useState("");
  const [industry, setIndustry] = useState("");
  const [stage, setStage] = useState("");
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState<IdeaValidationErrors>({});

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validationErrors = validateIdea({ title, industry, stage, description });
    if (hasErrors(validationErrors)) {
      setErrors(validationErrors);
      return;
    }
    addIdea({ title: title.trim(), industry, stage, description: description.trim(), createdBy: currentUser?.name ?? "Unknown" });
    navigate("/app/ideas");
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Button
        variant="ghost"
        onClick={() => navigate("/app/ideas")}
        className="mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Ideas
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">Create New Idea</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="Enter your startup idea title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              {errors.title && (
                <p className="text-sm text-red-600">{errors.title}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="industry">Industry</Label>
              <Select value={industry} onValueChange={setIndustry}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an industry" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FinTech">FinTech</SelectItem>
                  <SelectItem value="HealthTech">HealthTech</SelectItem>
                  <SelectItem value="EdTech">EdTech</SelectItem>
                  <SelectItem value="AI">AI</SelectItem>
                  <SelectItem value="SaaS">SaaS</SelectItem>
                  <SelectItem value="E-commerce">E-commerce</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
              {errors.industry && (
                <p className="text-sm text-red-600">{errors.industry}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="stage">Stage</Label>
              <Select value={stage} onValueChange={setStage}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a stage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Idea">Idea</SelectItem>
                  <SelectItem value="MVP">MVP</SelectItem>
                  <SelectItem value="Beta">Beta</SelectItem>
                  <SelectItem value="Launch">Launch</SelectItem>
                </SelectContent>
              </Select>
              {errors.stage && (
                <p className="text-sm text-red-600">{errors.stage}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe your startup idea in detail..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={6}
              />
              {errors.description && (
                <p className="text-sm text-red-600">{errors.description}</p>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                type="submit"
                className="flex-1 bg-[#4F46E5] hover:bg-[#4338CA] text-white"
              >
                Save Idea
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/app/ideas")}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
