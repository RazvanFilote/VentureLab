import { useEffect, useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router";
import { Logo } from "../../components/Logo";
import { Button } from "../../components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import { LogOut, ArrowLeft, DollarSign, LayoutGrid, Bookmark, BarChart2, Menu, X, Wallet } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useActivity } from "../../context/ActivityContext";
import { PageTransition } from "../../components/PageTransition";
import { motion, AnimatePresence } from "motion/react";

export function InvestorLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, logout } = useAuth();
  const { trackPageVisit } = useActivity();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    trackPageVisit(location.pathname);
  }, [location.pathname, trackPageVisit]);

  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
    } else if (currentUser.role === "StartupOwner" || currentUser.role === "Admin") {
      navigate("/app");
    }
  }, [currentUser, navigate]);

  if (!currentUser || currentUser.role !== "Investor") return null;

  function handleLogout() {
    logout();
    navigate("/");
  }

  const navItems = [
    { label: "Dashboard", path: "/investor", icon: BarChart2 },
    { label: "Marketplace", path: "/investor/marketplace", icon: LayoutGrid },
    { label: "Saved Ideas", path: "/investor/saved", icon: Bookmark },
    { label: "My Offers", path: "/investor/offers", icon: DollarSign },
    { label: "Wallet", path: "/investor/wallet", icon: Wallet },
  ];

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <header className="border-b bg-white sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="hidden sm:flex">
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <button
                onClick={() => navigate("/investor")}
                className="cursor-pointer hover:opacity-80 transition-opacity bg-transparent border-0 p-0"
              >
                <Logo size="sm" />
              </button>
            </div>

            {/* Desktop Nav */}
            <nav className="hidden md:flex gap-1">
              {navItems.map(({ label, path, icon: Icon }) => {
                const isActive =
                  path === "/investor"
                    ? location.pathname === "/investor"
                    : location.pathname.startsWith(path);
                return (
                  <Button
                    key={path}
                    variant="ghost"
                    onClick={() => navigate(path)}
                    className={`flex items-center gap-2 text-sm transition-colors relative ${
                      isActive
                        ? "text-[#06B6D4] bg-[#06B6D4]/5"
                        : "text-[#111827] hover:text-[#06B6D4] hover:bg-[#06B6D4]/5"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                    {isActive && (
                      <motion.div
                        layoutId="investor-nav-indicator"
                        className="absolute bottom-0 left-2 right-2 h-0.5 bg-[#06B6D4] rounded-full"
                      />
                    )}
                  </Button>
                );
              })}
            </nav>

            {/* Right: User + Mobile toggle */}
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="hidden sm:flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#06B6D4] flex items-center justify-center">
                      <span className="text-white text-sm font-bold">
                        {currentUser.name[0].toUpperCase()}
                      </span>
                    </div>
                    <div className="text-left hidden lg:block">
                      <p className="text-sm font-medium text-[#111827]">{currentUser.name}</p>
                      <p className="text-xs text-[#6B7280]">Investor</p>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <button
                className="md:hidden p-2 rounded-md hover:bg-gray-100"
                onClick={() => setMobileOpen((o) => !o)}
                aria-label="Toggle menu"
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Mobile Nav Drawer */}
          <AnimatePresence>
            {mobileOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden md:hidden border-t mt-3 pt-3"
              >
                <div className="flex flex-col gap-1 pb-2">
                  {navItems.map(({ label, path, icon: Icon }) => {
                    const isActive =
                      path === "/investor"
                        ? location.pathname === "/investor"
                        : location.pathname.startsWith(path);
                    return (
                      <button
                        key={path}
                        onClick={() => { navigate(path); setMobileOpen(false); }}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${
                          isActive ? "bg-[#06B6D4]/10 text-[#06B6D4]" : "text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {label}
                      </button>
                    );
                  })}
                  <hr className="my-1" />
                  <div className="flex items-center gap-3 px-3 py-2">
                    <div className="w-8 h-8 rounded-full bg-[#06B6D4] flex items-center justify-center shrink-0">
                      <span className="text-white text-sm font-bold">{currentUser.name[0]}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">{currentUser.name}</p>
                      <p className="text-xs text-gray-500">Investor</p>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-600 hover:bg-red-50 font-medium"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      <main>
        <PageTransition keyId={location.pathname}>
          <Outlet />
        </PageTransition>
      </main>
    </div>
  );
}
