import { useState } from "react";
import { useNavigate } from "react-router";
import { Logo } from "../components/Logo";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { ArrowLeft, Briefcase, TrendingUp } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { validateRegister, hasErrors, RegisterValidationErrors } from "../data/validation";

export function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("");
  const [errors, setErrors] = useState<RegisterValidationErrors>({});
  const [authError, setAuthError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setAuthError("");

    const validationErrors = validateRegister({ name, email, password, confirmPassword, role });
    if (hasErrors(validationErrors)) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});

    setSubmitting(true);
    const result = await register({
      name,
      email,
      password,
      role: role as "StartupOwner" | "Investor",
    });
    setSubmitting(false);

    if (!result.success) {
      setAuthError(result.error ?? "Registration failed");
      return;
    }

    if (role === "Investor") {
      navigate("/investor");
    } else {
      navigate("/app");
    }
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Button variant="ghost" onClick={() => navigate("/")} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>
        <Card>
          <CardHeader className="space-y-4">
            <div className="flex justify-center">
              <Logo size="md" />
            </div>
            <CardTitle className="text-2xl text-center">Create Account</CardTitle>
            <CardDescription className="text-center">
              Join VentureLab as a Startup Owner or Investor
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegister} className="space-y-4" noValidate>
              {authError && (
                <div className="p-3 rounded-md bg-red-50 border border-red-200">
                  <p className="text-sm text-red-600">{authError}</p>
                </div>
              )}

              {/* Role Selection */}
              <div className="space-y-2">
                <Label>I am a...</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole("StartupOwner")}
                    className={`p-4 rounded-lg border-2 text-left transition-colors ${
                      role === "StartupOwner"
                        ? "border-[#4F46E5] bg-[#4F46E5]/5"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <Briefcase
                      className={`w-6 h-6 mb-2 ${role === "StartupOwner" ? "text-[#4F46E5]" : "text-gray-400"}`}
                    />
                    <p className={`font-semibold text-sm ${role === "StartupOwner" ? "text-[#4F46E5]" : "text-[#111827]"}`}>
                      Startup Owner
                    </p>
                    <p className="text-xs text-[#6B7280] mt-1">Post and manage ideas</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole("Investor")}
                    className={`p-4 rounded-lg border-2 text-left transition-colors ${
                      role === "Investor"
                        ? "border-[#06B6D4] bg-[#06B6D4]/5"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <TrendingUp
                      className={`w-6 h-6 mb-2 ${role === "Investor" ? "text-[#06B6D4]" : "text-gray-400"}`}
                    />
                    <p className={`font-semibold text-sm ${role === "Investor" ? "text-[#06B6D4]" : "text-[#111827]"}`}>
                      Investor
                    </p>
                    <p className="text-xs text-[#6B7280] mt-1">Browse and fund startups</p>
                  </button>
                </div>
                {errors.role && <p className="text-sm text-red-600">{errors.role}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                {errors.email && <p className="text-sm text-red-600">{errors.email}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                {errors.password && <p className="text-sm text-red-600">{errors.password}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Repeat your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-red-600">{errors.confirmPassword}</p>
                )}
              </div>

              <Button
                type="submit"
                disabled={submitting}
                className="w-full bg-[#4F46E5] hover:bg-[#4338CA] text-white disabled:opacity-60"
              >
                {submitting ? "Creating account…" : "Create Account"}
              </Button>
              <p className="text-center text-sm text-[#6B7280]">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="text-[#4F46E5] hover:underline"
                >
                  Login
                </button>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
