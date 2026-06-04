import { useState } from "react";
import { useParams, useNavigate } from "react-router";
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
import { validateIdea, hasErrors, IdeaValidationErrors } from "../data/validation";

export function EditIdea() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { ideas, updateIdea } = useIdeas();

  const idea = ideas.find((i) => i.id === id);

  const [title, setTitle] = useState(idea?.title ?? "");
  const [industry, setIndustry] = useState(idea?.industry ?? "");
  const [stage, setStage] = useState(idea?.stage ?? "");
  const [description, setDescription] = useState(idea?.description ?? "");
  const [errors, setErrors] = useState<IdeaValidationErrors>({});

  if (!idea) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p>Idea not found</p>
      </div>
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validationErrors = validateIdea({ title, industry, stage, description });
    if (hasErrors(validationErrors)) {
      setErrors(validationErrors);
      return;
    }
    updateIdea(id!, { title: title.trim(), industry, stage, description: description.trim() });
    navigate(`/app/ideas/${id}`);
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Button
        variant="ghost"
        onClick={() => navigate(`/app/ideas/${id}`)}
        className="mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Idea
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">Edit Idea</CardTitle>
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
                Save Changes
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(`/app/ideas/${id}`)}
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
