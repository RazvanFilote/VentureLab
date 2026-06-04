Here is your FINAL complete Figma AI prompt that includes:

✅ Two separate interfaces (Investor & Startup Owner)

✅ Send Offer functionality

✅ Live Offer Competition Indicator (Gold feature)

✅ Navigation + back buttons

✅ Clean SaaS UI structure

✅ Silver-ready structure compatibility

You can paste this directly into Figma AI / Figma Make.

🎯 Figma AI Prompt – VentureLab (Full App + Gold Feature)

Design a modern web application called VentureLab, a platform connecting startup founders and investors.

The system must include two separate interfaces:

Investor Interface

Startup Owner Interface

Both users authenticate through the same login system but are redirected to their own dashboards.

🎨 Branding

App name: VentureLab
Tagline: Where startup ideas meet investment opportunities.

Colors:

Primary: #4F46E5 (Indigo)

Secondary: #06B6D4 (Cyan)

Background: #F9FAFB

Text: #111827

Style:

modern SaaS dashboard

minimal

rounded cards

soft shadows

clean spacing

consistent components

🔁 Navigation Requirements

Every page must include:

Top navigation bar

Back button (top left):

← Back

Clear navigation between pages

🔐 Authentication
Landing Page

Logo

Login / Register

Hero section:

Title: VentureLab
Subtitle: Connect startups with investors.

Buttons:

I'm an Investor

I'm a Startup Owner

Login / Register Pages

Fields:

Email

Password

Name (register)

After login:

Investor → Investor Dashboard

Startup Owner → Owner Dashboard

Include ← Back

🧑‍💼 INVESTOR INTERFACE

Investors browse startups and send offers.

Investor Dashboard

Navigation:

Marketplace

My Offers

Profile

Sections:

Trending startups

Recently added

Startup card:

Title

Industry

Stage

Rating

🔥 Competition indicator

Button:

View Details
Marketplace Page

Grid of startup cards.

Filters:

Search

Industry

Stage

Rating

Startup card:

Title

Industry

Stage

Rating

Short description

⭐ GOLD FEATURE – Live Offer Competition Indicator

Display:

🔥 4 investors interested
Competition Level: Medium

Levels:

0 → No interest

1–2 → Low

3–5 → Medium

6+ → High

Startup Detail (Investor View)

Left side:

Title

Industry

Stage

Description

Rating

Competition Indicator (IMPORTANT)
Investor Interest
🔥 4 investors interested
Competition Level: Medium
💰 Send Offer Feature

Add section:

Investment Opportunity

Button:

Send Offer
Send Offer Modal / Page

Fields:

Offer Amount (€)

Equity Requested (%)

Message

Buttons:

Send Offer
Cancel

After submission:

Offer Status: Pending
🔄 Dynamic Behavior (Gold Requirement)

When a new offer is submitted:

investor count increases

competition level updates automatically

Example:

Before:

🔥 2 investors → Low

After:

🔥 3 investors → Medium
My Offers Page

Table:

Startup	Amount	Equity	Date	Status

Status badges:

Pending (yellow)

Accepted (green)

Rejected (red)

🧑‍💻 STARTUP OWNER INTERFACE

Startup owners manage ideas and offers.

Owner Dashboard

Navigation:

My Startups

Offers Received

Profile

My Startups Page

Table:

| Title | Industry | Stage | Actions |

Actions:

View

Edit

Delete

Button:

Create Startup
Startup Detail (Owner View)

Startup info:

Title

Industry

Stage

Description

Competition Indicator (visible here too)
🔥 5 investors interested
Competition Level: Medium
💰 Offers Received Page

Table:

| Investor | Startup | Amount | Equity | Message | Status | Actions |

Actions:

Accept Offer
Reject Offer

Status updates:

Accepted → green

Rejected → red

🧩 Components

Create reusable components:

Navbar

Startup card

Offer card

Feedback card

Forms

Tables

Pagination

Status badges

Competition indicator

Buttons

🔄 User Flows
Investor Flow

Landing
→ Login
→ Dashboard
→ Marketplace
→ Startup Detail
→ Send Offer
→ My Offers

Startup Owner Flow

Landing
→ Login
→ Dashboard
→ My Startups
→ Startup Detail
→ Offers Received
→ Accept / Reject

🎯 GOLD FEATURE SUMMARY

The app includes a Live Offer Competition Indicator that:

tracks number of interested investors

updates when new offers are submitted

visually shows competition level

helps both investors and founders make decisions

🧠 Goal

The UI should clearly demonstrate:

role-based interfaces

real investment workflow

dynamic interaction (offers + competition)

clean SaaS design

If you want, I can next give you:

🔥 exact Figma layout (grid + spacing + components)

🧠 database schema (Startup, Offer, Feedback, User)

💻 backend architecture matching your labs