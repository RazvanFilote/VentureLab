"""Seeds the database with the same mock data used by the frontend.

Idempotent — exits without doing anything if the ideas table already has rows.
Uses the ORM directly (one transaction) so it benefits from the same triggers
as a real client.
"""
from datetime import date

from app.db.session import SessionLocal
from app.db.models import Idea, User, Offer, Feedback
from app.auth import hash_password


def _d(s: str) -> date:
    return date.fromisoformat(s)


def _seed_users(s) -> None:
    """Insert the 9 demo users with bcrypt-hashed passwords.

    Sarah uses admin123; everyone else uses password123 — same credentials
    the frontend mockUsers list used to advertise.
    """
    admin_hash = hash_password("admin123")
    user_hash = hash_password("password123")
    users = [
        User(id="1", name="Sarah Johnson",   email="sarah@venturelab.com",   password_hash=admin_hash, role="Admin"),
        User(id="2", name="Michael Chen",    email="michael@venturelab.com", password_hash=user_hash,  role="StartupOwner"),
        User(id="3", name="Emily Rodriguez", email="emily@venturelab.com",   password_hash=user_hash,  role="Investor"),
        User(id="4", name="David Kim",       email="david@venturelab.com",   password_hash=user_hash,  role="StartupOwner"),
        User(id="5", name="Alex Turner",     email="alex@venturelab.com",    password_hash=user_hash,  role="Investor"),
        User(id="6", name="Priya Patel",     email="priya@venturelab.com",   password_hash=user_hash,  role="Investor"),
        User(id="7", name="Marcus Webb",     email="marcus@venturelab.com",  password_hash=user_hash,  role="Investor"),
        User(id="8", name="Sofia Nakamura",  email="sofia@venturelab.com",   password_hash=user_hash,  role="Investor"),
        User(id="9", name="James Okafor",    email="james@venturelab.com",   password_hash=user_hash,  role="Investor"),
    ]
    s.add_all(users)


def seed_all() -> None:
    s = SessionLocal()
    try:
        if s.query(Idea).first():
            # Domain data already seeded — but the 0003 migration wipes the
            # users table to swap plain-text passwords for bcrypt hashes, so
            # reseed users separately if they're missing.
            if not s.query(User).first():
                _seed_users(s)
                s.commit()
            return

        # ── Ideas ────────────────────────────────────────────────────────────
        ideas = [
            Idea(id="1", title="AI Fitness Coach",                     industry="HealthTech", stage="MVP",    description="AI-based system that generates personalized workout plans using machine learning to adapt to user progress and preferences.",                                       created_by="Michael Chen", created_at=_d("2026-02-15")),
            Idea(id="2", title="Smart Contract Auditor",                industry="FinTech",    stage="Idea",   description="Automated tool for auditing smart contracts on blockchain platforms to identify security vulnerabilities.",                                                       created_by="Michael Chen", created_at=_d("2026-02-20")),
            Idea(id="3", title="Virtual Study Rooms",                   industry="EdTech",     stage="MVP",    description="Platform connecting students worldwide for collaborative study sessions with integrated tools for note-sharing and video calls.",                                    created_by="David Kim",    created_at=_d("2026-03-01")),
            Idea(id="4", title="Eco-Friendly Delivery Route Optimizer", industry="SaaS",       stage="MVP",    description="Software that optimizes delivery routes to minimize carbon emissions while maintaining efficiency.",                                                               created_by="David Kim",    created_at=_d("2026-03-05")),
            Idea(id="5", title="AI-Powered Recipe Generator",           industry="AI",         stage="Growth", description="Generate custom recipes based on available ingredients, dietary restrictions, and personal taste preferences.",                                                    created_by="Michael Chen", created_at=_d("2026-03-08")),
        ]
        s.add_all(ideas)

        _seed_users(s)

        # ── Offers ───────────────────────────────────────────────────────────
        offers = [
            Offer(id="o1",  idea_id="1", investor_name="Emily Rodriguez", amount=75000,  equity=12, message="I've tracked the health-tech space for a decade. Your adaptive algorithm is genuinely novel.",       status="Accepted", created_at=_d("2026-02-18")),
            Offer(id="o2",  idea_id="1", investor_name="Priya Patel",     amount=50000,  equity=8,  message="Strong product-market fit signals. Happy to bring my fitness industry network as well as capital.", status="Pending",  created_at=_d("2026-02-24")),
            Offer(id="o3",  idea_id="1", investor_name="Marcus Webb",     amount=30000,  equity=5,  message="I'll take a small stake now and reserve capacity for the Series A.",                              status="Pending",  created_at=_d("2026-03-02")),
            Offer(id="o4",  idea_id="2", investor_name="Alex Turner",     amount=120000, equity=15, message="Security auditing at scale is a billion-dollar market. All in.",                                  status="Accepted", created_at=_d("2026-02-22")),
            Offer(id="o5",  idea_id="2", investor_name="Emily Rodriguez", amount=100000, equity=12, message="Top-tier technical team and an urgently needed solution for the ecosystem.",                       status="Accepted", created_at=_d("2026-02-26")),
            Offer(id="o6",  idea_id="2", investor_name="Priya Patel",     amount=80000,  equity=10, message="Web3 security is non-negotiable. I want to support making it accessible to every protocol.",      status="Pending",  created_at=_d("2026-03-01")),
            Offer(id="o7",  idea_id="2", investor_name="Sofia Nakamura",  amount=60000,  equity=8,  message="The live demo won me over. False-positive rate is remarkably low for a v1.",                       status="Pending",  created_at=_d("2026-03-05")),
            Offer(id="o8",  idea_id="3", investor_name="Marcus Webb",     amount=45000,  equity=9,  message="EdTech is my primary thesis. The async study-room model solves a real pain point for remote learners.", status="Accepted", created_at=_d("2026-03-04")),
            Offer(id="o9",  idea_id="3", investor_name="Alex Turner",     amount=35000,  equity=7,  message="University partnerships are a scalable moat. I can fast-track enterprise deals.",                  status="Pending",  created_at=_d("2026-03-08")),
            Offer(id="o10", idea_id="3", investor_name="James Okafor",    amount=25000,  equity=5,  message="The beta engagement metrics are impressive. Happy to co-invest alongside Marcus.",                status="Pending",  created_at=_d("2026-03-11")),
            Offer(id="o11", idea_id="3", investor_name="Emily Rodriguez", amount=20000,  equity=4,  message="Smaller cheque but I want exposure. Happy to help with user research and community building.",      status="Rejected", created_at=_d("2026-03-06")),
            Offer(id="o12", idea_id="4", investor_name="Sofia Nakamura",  amount=90000,  equity=14, message="My portfolio is heavily ESG-weighted and this is the best logistics play I've seen.",             status="Accepted", created_at=_d("2026-03-07")),
            Offer(id="o13", idea_id="4", investor_name="Marcus Webb",     amount=70000,  equity=10, message="Green logistics is a regulatory tailwind play. I want to lock in this valuation.",                status="Pending",  created_at=_d("2026-03-09")),
            Offer(id="o14", idea_id="4", investor_name="Priya Patel",     amount=55000,  equity=8,  message="Strong SaaS metrics and a clear enterprise buyer. The route engine outperforms incumbents.",       status="Pending",  created_at=_d("2026-03-11")),
            Offer(id="o15", idea_id="5", investor_name="James Okafor",    amount=40000,  equity=8,  message="Consumer AI apps rarely have this level of genuine daily utility. The retention data speaks for itself.", status="Accepted", created_at=_d("2026-03-10")),
            Offer(id="o16", idea_id="5", investor_name="Sofia Nakamura",  amount=35000,  equity=6,  message="The grocery delivery API angle is massively undermonetised. I'd love to help broker those partnerships.", status="Pending",  created_at=_d("2026-03-12")),
            Offer(id="o17", idea_id="5", investor_name="Priya Patel",     amount=28000,  equity=5,  message="Nutritional AI is hot right now and this team has the right mix of food science and ML expertise.", status="Pending",  created_at=_d("2026-03-13")),
            Offer(id="o18", idea_id="5", investor_name="Alex Turner",     amount=15000,  equity=3,  message="Small position to start. The pantry-scan computer vision is surprisingly accurate.",               status="Rejected", created_at=_d("2026-03-11")),
        ]
        s.add_all(offers)

        # ── Feedback ─────────────────────────────────────────────────────────
        feedback = [
            Feedback(id="f1",  idea_id="1", user="Emily Rodriguez", rating=5, comment="Absolutely love this concept. The adaptive workout plans are a game-changer.",                                                created_at=_d("2026-02-17")),
            Feedback(id="f2",  idea_id="1", user="Priya Patel",     rating=4, comment="Strong idea with clear market demand. Would love to see integration with wearable devices.",                                  created_at=_d("2026-02-19")),
            Feedback(id="f3",  idea_id="1", user="Marcus Webb",     rating=4, comment="Good traction potential. Main concern is retention beyond the first month — needs a gamification layer.",                     created_at=_d("2026-02-22")),
            Feedback(id="f4",  idea_id="1", user="James Okafor",    rating=4, comment="Solid MVP. Competing with Peloton is tough but the AI angle differentiates it well.",                                        created_at=_d("2026-03-01")),
            Feedback(id="f5",  idea_id="1", user="Sofia Nakamura",  rating=4, comment="Great execution so far. The UX needs polish but the core algorithm is impressive.",                                           created_at=_d("2026-03-03")),
            Feedback(id="f6",  idea_id="2", user="Alex Turner",     rating=5, comment="This is exactly what Web3 needs. Security audits are painfully slow — automating 70% would be massive.",                    created_at=_d("2026-02-21")),
            Feedback(id="f7",  idea_id="2", user="Emily Rodriguez", rating=5, comment="The TAM here is enormous and growing fast. Every DeFi protocol needs this.",                                                 created_at=_d("2026-02-23")),
            Feedback(id="f8",  idea_id="2", user="Priya Patel",     rating=5, comment="Blockchain security is red-hot. The formalised verification approach is sophisticated.",                                      created_at=_d("2026-02-25")),
            Feedback(id="f9",  idea_id="2", user="Sofia Nakamura",  rating=5, comment="Best pitch I've seen this quarter. The demo was flawless and the roadmap is realistic.",                                     created_at=_d("2026-03-02")),
            Feedback(id="f10", idea_id="2", user="James Okafor",    rating=4, comment="Impressive technical depth. Regulatory uncertainty in some jurisdictions but that's manageable.",                             created_at=_d("2026-03-04")),
            Feedback(id="f11", idea_id="3", user="Emily Rodriguez", rating=4, comment="Post-pandemic demand for virtual collaboration is here to stay. Note-sharing features are well thought out.",                created_at=_d("2026-03-03")),
            Feedback(id="f12", idea_id="3", user="Marcus Webb",     rating=4, comment="Loved the beta demo. Pomodoro timer integration is a nice touch. Monetisation through universities looks promising.",        created_at=_d("2026-03-05")),
            Feedback(id="f13", idea_id="3", user="Priya Patel",     rating=3, comment="Good concept but edtech is crowded. Needs sharper differentiation from Discord study servers.",                               created_at=_d("2026-03-07")),
            Feedback(id="f14", idea_id="3", user="Alex Turner",     rating=4, comment="University partnerships could be a strong distribution channel. The B2B angle makes unit economics attractive.",             created_at=_d("2026-03-09")),
            Feedback(id="f15", idea_id="3", user="James Okafor",    rating=4, comment="Solid product, engaged beta users. Would want to see churn data before Series A, but I'm optimistic.",                      created_at=_d("2026-03-10")),
            Feedback(id="f16", idea_id="4", user="Sofia Nakamura",  rating=5, comment="ESG pressure on logistics is mounting — this is perfectly timed. The emission dashboard alone is worth the subscription.",   created_at=_d("2026-03-06")),
            Feedback(id="f17", idea_id="4", user="Marcus Webb",     rating=4, comment="The green angle opens corporate budgets that pure efficiency plays can't touch. Love it.",                                   created_at=_d("2026-03-08")),
            Feedback(id="f18", idea_id="4", user="Emily Rodriguez", rating=5, comment="Every logistics company I know is looking for exactly this. The carbon credit integration is inspired.",                     created_at=_d("2026-03-09")),
            Feedback(id="f19", idea_id="4", user="Priya Patel",     rating=4, comment="Strong SaaS fundamentals. Recurring revenue, clear ROI, and a regulatory tailwind. Very investable.",                       created_at=_d("2026-03-10")),
            Feedback(id="f20", idea_id="5", user="Alex Turner",     rating=4, comment="The personalisation engine is genuinely impressive. Ingredient substitution for dietary restrictions is seamless.",          created_at=_d("2026-03-09")),
            Feedback(id="f21", idea_id="5", user="Marcus Webb",     rating=4, comment="The pantry scanning feature is the killer differentiator in a crowded consumer AI space.",                                   created_at=_d("2026-03-10")),
            Feedback(id="f22", idea_id="5", user="James Okafor",    rating=4, comment="Great retention mechanics. Weekly meal plan generation keeps users coming back daily.",                                       created_at=_d("2026-03-11")),
            Feedback(id="f23", idea_id="5", user="Priya Patel",     rating=4, comment="Partnership angle with grocery delivery apps is underexplored — that could 10x the revenue.",                               created_at=_d("2026-03-12")),
            Feedback(id="f24", idea_id="5", user="Sofia Nakamura",  rating=4, comment="The nutritional tracking overlay makes this a serious contender in the health-food intersection.",                           created_at=_d("2026-03-13")),
        ]
        s.add_all(feedback)

        s.commit()
    finally:
        s.close()
