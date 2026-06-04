import { useNavigate } from "react-router";
import { Logo } from "../components/Logo";
import { Button } from "../components/ui/button";
import { MessageSquare, Star, TrendingUp, ArrowRight, Zap, Users, BarChart2 } from "lucide-react";
import { motion } from "motion/react";
import { useActivity } from "../context/ActivityContext";
import { useEffect } from "react";

const features = [
  {
    icon: MessageSquare,
    title: "Share Ideas",
    description: "Post startup concepts and get community input from builders worldwide.",
    color: "#4F46E5",
    bg: "bg-[#4F46E5]/10",
  },
  {
    icon: Star,
    title: "Receive Feedback",
    description: "Collect ratings and comments to improve your idea and find product-market fit.",
    color: "#06B6D4",
    bg: "bg-[#06B6D4]/10",
  },
  {
    icon: TrendingUp,
    title: "Attract Investors",
    description: "Connect with real investors who can fund and accelerate your startup.",
    color: "#4F46E5",
    bg: "bg-[#4F46E5]/10",
  },
];

const stats = [
  { value: "500+", label: "Startups Launched", icon: Zap },
  { value: "1,200+", label: "Active Investors", icon: Users },
  { value: "4.8★", label: "Avg Idea Rating", icon: Star },
  { value: "€12M+", label: "Offers Made", icon: BarChart2 },
];

export function LandingPage() {
  const navigate = useNavigate();
  const { trackPageVisit } = useActivity();

  useEffect(() => {
    trackPageVisit("/");
  }, [trackPageVisit]);

  return (
    <div className="min-h-screen bg-[#F9FAFB] overflow-x-hidden">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 sm:py-4 flex items-center justify-between">
          <Logo size="md" />
          <div className="flex gap-2 sm:gap-3">
            <Button
              variant="ghost"
              onClick={() => navigate("/login")}
              className="text-[#111827] text-sm"
            >
              Login
            </Button>
            <Button
              onClick={() => navigate("/register")}
              className="bg-[#4F46E5] hover:bg-[#4338CA] text-white text-sm"
            >
              Get Started
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 sm:py-24 px-4 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-1/4 w-72 h-72 bg-[#4F46E5]/5 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-[#06B6D4]/5 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto text-center max-w-4xl relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#4F46E5]/10 text-[#4F46E5] text-xs font-semibold mb-6">
              <Zap className="w-3.5 h-3.5" />
              The startup idea platform
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-[#111827] mb-4 leading-tight tracking-tight"
          >
            Where Ideas Become{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4F46E5] to-[#06B6D4]">
              Ventures
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-base sm:text-lg text-[#6B7280] mb-8 max-w-2xl mx-auto leading-relaxed"
          >
            VentureLab connects entrepreneurs with investors. Share your startup
            idea, gather community feedback, and close your first funding round.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-3 justify-center"
          >
            <Button
              size="lg"
              onClick={() => navigate("/register")}
              className="bg-[#4F46E5] hover:bg-[#4338CA] text-white gap-2 px-8 shadow-lg shadow-[#4F46E5]/25 hover:shadow-xl hover:shadow-[#4F46E5]/30 transition-all"
            >
              Start for Free
              <ArrowRight className="w-4 h-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/login")}
              className="border-gray-300 text-[#111827] hover:border-[#4F46E5] hover:text-[#4F46E5] transition-colors"
            >
              Sign In
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="bg-white border-y py-8 sm:py-10">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8">
            {stats.map(({ value, label, icon: Icon }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
                className="text-center"
              >
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Icon className="w-4 h-4 text-[#4F46E5]" />
                  <span className="text-2xl sm:text-3xl font-extrabold text-[#111827]">{value}</span>
                </div>
                <p className="text-xs sm:text-sm text-[#6B7280]">{label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 sm:py-24 px-4">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h2 className="text-2xl sm:text-4xl font-bold text-[#111827] mb-3">
              Everything you need to launch
            </h2>
            <p className="text-[#6B7280] text-sm sm:text-base max-w-xl mx-auto">
              From initial idea to closing a funding round — VentureLab supports every step.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
            {features.map(({ icon: Icon, title, description, color, bg }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
                whileHover={{
                  y: -4,
                  boxShadow: `0 16px 40px ${color}20`,
                  transition: { duration: 0.2 },
                }}
                className="bg-white rounded-2xl p-6 border border-gray-100 hover:border-transparent cursor-default"
              >
                <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center mb-4`}>
                  <Icon className="w-6 h-6" style={{ color }} />
                </div>
                <h3 className="text-lg font-semibold text-[#111827] mb-2">{title}</h3>
                <p className="text-sm text-[#6B7280] leading-relaxed">{description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="bg-gradient-to-br from-[#4F46E5] to-[#06B6D4] rounded-3xl p-8 sm:p-12 text-center text-white shadow-2xl"
          >
            <h2 className="text-2xl sm:text-4xl font-bold mb-3">
              Ready to build your venture?
            </h2>
            <p className="text-white/80 mb-8 text-sm sm:text-base max-w-xl mx-auto">
              Join thousands of founders and investors. Start sharing your ideas and
              attracting the right partners today.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                size="lg"
                onClick={() => navigate("/register")}
                className="bg-white text-[#4F46E5] hover:bg-gray-50 font-semibold px-8 shadow-lg transition-all"
              >
                Create Free Account
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button
                size="lg"
                variant="ghost"
                onClick={() => navigate("/login")}
                className="text-white hover:bg-white/10 border border-white/30"
              >
                Sign In
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white py-6 sm:py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <Logo size="sm" />
            <div className="flex gap-6 text-sm text-[#6B7280]">
              <a href="#" className="hover:text-[#4F46E5] transition-colors">About</a>
              <a href="#" className="hover:text-[#4F46E5] transition-colors">Contact</a>
              <a href="#" className="hover:text-[#4F46E5] transition-colors">GitHub</a>
            </div>
            <p className="text-xs text-gray-400">© 2026 VentureLab. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
