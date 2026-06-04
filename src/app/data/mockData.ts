export interface Idea {
  id: string;
  title: string;
  industry: string;
  stage: string;
  description: string;
  avgRating: number;
  feedbackCount: number;
  createdBy: string;
  createdAt: string;
}

export interface Feedback {
  id: string;
  ideaId: string;
  user: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: "StartupOwner" | "Investor" | "Admin";
}

export interface Offer {
  id: string;
  ideaId: string;
  ideaTitle: string;
  investorName: string;
  amount: number;
  equity: number;
  message: string;
  status: "Pending" | "Accepted" | "Rejected";
  createdAt: string;
}

export const mockIdeas: Idea[] = [
  {
    id: "1",
    title: "AI Fitness Coach",
    industry: "HealthTech",
    stage: "MVP",
    description: "AI-based system that generates personalized workout plans using machine learning to adapt to user progress and preferences.",
    avgRating: 4.2,
    feedbackCount: 5,
    createdBy: "Michael Chen",
    createdAt: "2026-02-15",
  },
  {
    id: "2",
    title: "Smart Contract Auditor",
    industry: "FinTech",
    stage: "Idea",
    description: "Automated tool for auditing smart contracts on blockchain platforms to identify security vulnerabilities.",
    avgRating: 4.8,
    feedbackCount: 8,
    createdBy: "Michael Chen",
    createdAt: "2026-02-20",
  },
  {
    id: "3",
    title: "Virtual Study Rooms",
    industry: "EdTech",
    stage: "Beta",
    description: "Platform connecting students worldwide for collaborative study sessions with integrated tools for note-sharing and video calls.",
    avgRating: 3.9,
    feedbackCount: 12,
    createdBy: "David Kim",
    createdAt: "2026-03-01",
  },
  {
    id: "4",
    title: "Eco-Friendly Delivery Route Optimizer",
    industry: "SaaS",
    stage: "MVP",
    description: "Software that optimizes delivery routes to minimize carbon emissions while maintaining efficiency.",
    avgRating: 4.5,
    feedbackCount: 6,
    createdBy: "David Kim",
    createdAt: "2026-03-05",
  },
  {
    id: "5",
    title: "AI-Powered Recipe Generator",
    industry: "AI",
    stage: "Launch",
    description: "Generate custom recipes based on available ingredients, dietary restrictions, and personal taste preferences.",
    avgRating: 4.0,
    feedbackCount: 15,
    createdBy: "Michael Chen",
    createdAt: "2026-03-08",
  },
];

export const mockFeedback: Feedback[] = [
  // AI Fitness Coach (id: "1")
  { id: "f1", ideaId: "1", user: "Emily Rodriguez", rating: 5, comment: "Absolutely love this concept. The adaptive workout plans are a game-changer — I've been looking for something like this for years.", createdAt: "2026-02-17" },
  { id: "f2", ideaId: "1", user: "Priya Patel", rating: 4, comment: "Strong idea with clear market demand. The ML personalisation angle is smart. Would love to see integration with wearable devices.", createdAt: "2026-02-19" },
  { id: "f3", ideaId: "1", user: "Marcus Webb", rating: 4, comment: "Good traction potential in the health space. Main concern is user retention beyond the first month — needs a gamification layer.", createdAt: "2026-02-22" },
  { id: "f4", ideaId: "1", user: "James Okafor", rating: 4, comment: "Solid MVP. Competing with Peloton and Whoop is tough but the AI angle differentiates it well. Interested to see CAC metrics.", createdAt: "2026-03-01" },
  { id: "f5", ideaId: "1", user: "Sofia Nakamura", rating: 4, comment: "Great execution so far. The UX needs polish but the core algorithm is impressive. I'd invest at the right valuation.", createdAt: "2026-03-03" },

  // Smart Contract Auditor (id: "2")
  { id: "f6", ideaId: "2", user: "Alex Turner", rating: 5, comment: "This is exactly what Web3 needs. Security audits are painfully slow and expensive — automating even 70% would be massive.", createdAt: "2026-02-21" },
  { id: "f7", ideaId: "2", user: "Emily Rodriguez", rating: 5, comment: "The TAM here is enormous and growing fast. Every DeFi protocol needs this. Strong competitive moat if the accuracy holds up.", createdAt: "2026-02-23" },
  { id: "f8", ideaId: "2", user: "Priya Patel", rating: 5, comment: "Blockchain security is a red-hot space. The approach to formalised verification is sophisticated — this team clearly knows their stuff.", createdAt: "2026-02-25" },
  { id: "f9", ideaId: "2", user: "Sofia Nakamura", rating: 5, comment: "Best pitch I've seen this quarter. The demo was flawless and the roadmap is realistic. I'm very bullish.", createdAt: "2026-03-02" },
  { id: "f10", ideaId: "2", user: "James Okafor", rating: 4, comment: "Impressive technical depth. My only concern is regulatory uncertainty in some jurisdictions, but that's manageable. Excited about this.", createdAt: "2026-03-04" },

  // Virtual Study Rooms (id: "3")
  { id: "f11", ideaId: "3", user: "Emily Rodriguez", rating: 4, comment: "Post-pandemic demand for virtual collaboration is here to stay. The note-sharing features sound very well thought out.", createdAt: "2026-03-03" },
  { id: "f12", ideaId: "3", user: "Marcus Webb", rating: 4, comment: "Loved the beta demo. The Pomodoro timer integration is a nice touch. Monetisation path through universities looks promising.", createdAt: "2026-03-05" },
  { id: "f13", ideaId: "3", user: "Priya Patel", rating: 3, comment: "Good concept but the edtech space is crowded. Needs sharper differentiation from Discord study servers and Notion. Keep iterating.", createdAt: "2026-03-07" },
  { id: "f14", ideaId: "3", user: "Alex Turner", rating: 4, comment: "University partnerships could be a strong distribution channel. The B2B angle makes the unit economics much more attractive.", createdAt: "2026-03-09" },
  { id: "f15", ideaId: "3", user: "James Okafor", rating: 4, comment: "Solid product, engaged beta users. Would want to see churn data before Series A conversation, but I'm optimistic.", createdAt: "2026-03-10" },

  // Eco-Friendly Delivery Route Optimizer (id: "4")
  { id: "f16", ideaId: "4", user: "Sofia Nakamura", rating: 5, comment: "ESG pressure on logistics companies is mounting — this is perfectly timed. The emission reporting dashboard alone is worth the subscription fee.", createdAt: "2026-03-06" },
  { id: "f17", ideaId: "4", user: "Marcus Webb", rating: 4, comment: "Route optimisation is a proven category. The green angle opens corporate budgets that pure efficiency plays can't touch. Love it.", createdAt: "2026-03-08" },
  { id: "f18", ideaId: "4", user: "Emily Rodriguez", rating: 5, comment: "Every logistics company I know is looking for exactly this solution. The carbon credit integration feature is inspired.", createdAt: "2026-03-09" },
  { id: "f19", ideaId: "4", user: "Priya Patel", rating: 4, comment: "Strong SaaS fundamentals. Recurring revenue model, clear ROI for customers, and a tailwind from regulation. Very investable.", createdAt: "2026-03-10" },

  // AI-Powered Recipe Generator (id: "5")
  { id: "f20", ideaId: "5", user: "Alex Turner", rating: 4, comment: "The personalisation engine is genuinely impressive. Ingredient substitution for dietary restrictions is seamless. Already sharing it with friends.", createdAt: "2026-03-09" },
  { id: "f21", ideaId: "5", user: "Marcus Webb", rating: 4, comment: "Consumer AI apps are a crowded space but this one has real stickiness. The pantry scanning feature is the killer differentiator.", createdAt: "2026-03-10" },
  { id: "f22", ideaId: "5", user: "James Okafor", rating: 4, comment: "Great retention mechanics. The weekly meal plan generation keeps users coming back daily. Freemium to premium conversion looks healthy.", createdAt: "2026-03-11" },
  { id: "f23", ideaId: "5", user: "Priya Patel", rating: 4, comment: "Partnership angle with grocery delivery apps is underexplored here — that could 10x the revenue. The core product is already solid.", createdAt: "2026-03-12" },
  { id: "f24", ideaId: "5", user: "Sofia Nakamura", rating: 4, comment: "Love the vision. The nutritional tracking overlay makes this a serious contender in the health-food intersection. Looking forward to v2.", createdAt: "2026-03-13" },
];

export const mockUsers: User[] = [
  {
    id: "1",
    name: "Sarah Johnson",
    email: "sarah@venturelab.com",
    password: "admin123",
    role: "Admin",
  },
  {
    id: "2",
    name: "Michael Chen",
    email: "michael@venturelab.com",
    password: "password123",
    role: "StartupOwner",
  },
  {
    id: "3",
    name: "Emily Rodriguez",
    email: "emily@venturelab.com",
    password: "password123",
    role: "Investor",
  },
  {
    id: "4",
    name: "David Kim",
    email: "david@venturelab.com",
    password: "password123",
    role: "StartupOwner",
  },
  {
    id: "5",
    name: "Alex Turner",
    email: "alex@venturelab.com",
    password: "password123",
    role: "Investor",
  },
  {
    id: "6",
    name: "Priya Patel",
    email: "priya@venturelab.com",
    password: "password123",
    role: "Investor",
  },
  {
    id: "7",
    name: "Marcus Webb",
    email: "marcus@venturelab.com",
    password: "password123",
    role: "Investor",
  },
  {
    id: "8",
    name: "Sofia Nakamura",
    email: "sofia@venturelab.com",
    password: "password123",
    role: "Investor",
  },
  {
    id: "9",
    name: "James Okafor",
    email: "james@venturelab.com",
    password: "password123",
    role: "Investor",
  },
];

export const mockOffers: Offer[] = [
  // ── AI Fitness Coach (id "1") — Michael Chen owns 100% → Emily accepted 12% → 88% left
  { id: "o1",  ideaId: "1", ideaTitle: "AI Fitness Coach",               investorName: "Emily Rodriguez", amount: 75000,  equity: 12, message: "I've tracked the health-tech space for a decade. Your adaptive algorithm is genuinely novel and I want in at the ground floor.",       status: "Accepted",  createdAt: "2026-02-18" },
  { id: "o2",  ideaId: "1", ideaTitle: "AI Fitness Coach",               investorName: "Priya Patel",     amount: 50000,  equity: 8,  message: "Strong product-market fit signals. Happy to bring my fitness industry network as well as the capital.",                              status: "Pending",   createdAt: "2026-02-24" },
  { id: "o3",  ideaId: "1", ideaTitle: "AI Fitness Coach",               investorName: "Marcus Webb",     amount: 30000,  equity: 5,  message: "I'll take a small stake now and reserve capacity for the Series A. Let's build something big together.",                            status: "Pending",   createdAt: "2026-03-02" },

  // ── Smart Contract Auditor (id "2") — Michael Chen owns 100% → Alex accepted 15% → 85% left
  { id: "o4",  ideaId: "2", ideaTitle: "Smart Contract Auditor",         investorName: "Alex Turner",     amount: 120000, equity: 15, message: "I've been waiting for a product like this since the DAO hack. Security auditing at scale is a billion-dollar market. All in.",        status: "Accepted",  createdAt: "2026-02-22" },
  { id: "o5",  ideaId: "2", ideaTitle: "Smart Contract Auditor",         investorName: "Emily Rodriguez", amount: 100000, equity: 12, message: "Top-tier technical team and an urgently needed solution. This fills a dangerous gap in the ecosystem.",                              status: "Accepted",  createdAt: "2026-02-26" },
  { id: "o6",  ideaId: "2", ideaTitle: "Smart Contract Auditor",         investorName: "Priya Patel",     amount: 80000,  equity: 10, message: "Web3 security is non-negotiable. I want to support the team making it accessible to every protocol, not just well-funded ones.",    status: "Pending",   createdAt: "2026-03-01" },
  { id: "o7",  ideaId: "2", ideaTitle: "Smart Contract Auditor",         investorName: "Sofia Nakamura",  amount: 60000,  equity: 8,  message: "The live demo won me over. False-positive rate is remarkably low for a v1. Excited to see where this goes post-launch.",           status: "Pending",   createdAt: "2026-03-05" },

  // ── Virtual Study Rooms (id "3") — David Kim owns 100%
  { id: "o8",  ideaId: "3", ideaTitle: "Virtual Study Rooms",            investorName: "Marcus Webb",     amount: 45000,  equity: 9,  message: "EdTech is my primary thesis. The asynchronous study-room model solves a real pain point for remote learners worldwide.",             status: "Accepted",  createdAt: "2026-03-04" },
  { id: "o9",  ideaId: "3", ideaTitle: "Virtual Study Rooms",            investorName: "Alex Turner",     amount: 35000,  equity: 7,  message: "University partnerships are a scalable moat. I have relationships with 12 universities that could fast-track your enterprise deals.", status: "Pending",   createdAt: "2026-03-08" },
  { id: "o10", ideaId: "3", ideaTitle: "Virtual Study Rooms",            investorName: "James Okafor",    amount: 25000,  equity: 5,  message: "The beta engagement metrics are impressive. Happy to co-invest alongside Marcus and bring my EdTech operator experience.",           status: "Pending",   createdAt: "2026-03-11" },
  { id: "o11", ideaId: "3", ideaTitle: "Virtual Study Rooms",            investorName: "Emily Rodriguez", amount: 20000,  equity: 4,  message: "Smaller cheque but I want exposure to this space. Happy to help with user research and community building.",                        status: "Rejected",  createdAt: "2026-03-06" },

  // ── Eco-Friendly Delivery Route Optimizer (id "4") — David Kim owns 100%
  { id: "o12", ideaId: "4", ideaTitle: "Eco-Friendly Delivery Optimizer", investorName: "Sofia Nakamura",  amount: 90000,  equity: 14, message: "My portfolio is heavily ESG-weighted and this is the best logistics play I've seen. The carbon credit integration is genius.",      status: "Accepted",  createdAt: "2026-03-07" },
  { id: "o13", ideaId: "4", ideaTitle: "Eco-Friendly Delivery Optimizer", investorName: "Marcus Webb",     amount: 70000,  equity: 10, message: "Green logistics is a regulatory tailwind play. I want to lock in this valuation before the EU mandates push every carrier here.",   status: "Pending",   createdAt: "2026-03-09" },
  { id: "o14", ideaId: "4", ideaTitle: "Eco-Friendly Delivery Optimizer", investorName: "Priya Patel",     amount: 55000,  equity: 8,  message: "Strong SaaS metrics and a clear enterprise buyer. The route optimisation engine outperforms what I've seen from incumbents.",       status: "Pending",   createdAt: "2026-03-11" },

  // ── AI-Powered Recipe Generator (id "5") — Michael Chen owns 100%
  { id: "o15", ideaId: "5", ideaTitle: "AI-Powered Recipe Generator",    investorName: "James Okafor",    amount: 40000,  equity: 8,  message: "Consumer AI apps rarely have this level of genuine daily utility. The retention data speaks for itself — people love this product.", status: "Accepted",  createdAt: "2026-03-10" },
  { id: "o16", ideaId: "5", ideaTitle: "AI-Powered Recipe Generator",    investorName: "Sofia Nakamura",  amount: 35000,  equity: 6,  message: "The grocery delivery API angle is massively undermonetised. I'd love to help broker those partnerships once we're on board.",       status: "Pending",   createdAt: "2026-03-12" },
  { id: "o17", ideaId: "5", ideaTitle: "AI-Powered Recipe Generator",    investorName: "Priya Patel",     amount: 28000,  equity: 5,  message: "Nutritional AI is hot right now and this team has the right mix of food science and ML expertise. Happy to contribute mentorship.", status: "Pending",   createdAt: "2026-03-13" },
  { id: "o18", ideaId: "5", ideaTitle: "AI-Powered Recipe Generator",    investorName: "Alex Turner",     amount: 15000,  equity: 3,  message: "Small position to start — I want to get to know the team better. The pantry-scan computer vision is surprisingly accurate.",        status: "Rejected",  createdAt: "2026-03-11" },
];

export function getCompetitionLevel(ideaId: string): {
  count: number;
  level: "None" | "Low" | "Medium" | "High";
  color: string;
} {
  const offerCount = mockOffers.filter(offer => offer.ideaId === ideaId).length;
  let level: "None" | "Low" | "Medium" | "High" = "None";
  let color = "#9CA3AF";
  if (offerCount === 0) { level = "None"; color = "#9CA3AF"; }
  else if (offerCount <= 2) { level = "Low"; color = "#10B981"; }
  else if (offerCount <= 5) { level = "Medium"; color = "#F59E0B"; }
  else { level = "High"; color = "#EF4444"; }
  return { count: offerCount, level, color };
}
