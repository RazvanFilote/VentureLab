Add a new Analytics / Statistics feature to the existing web application VentureLab, a platform where startup owners publish startup ideas and investors submit offers.

This new feature must satisfy the Silver Challenge requirement by creating a separate view with statistics based on the data from the main startup table, using charts and ranking, and allowing the user to toggle between a tabular view and a visual analytics view of the same data.

Use a modern SaaS dashboard style with:

clean layout

rounded cards

subtle shadows

clear hierarchy

consistent spacing

Branding

App name: VentureLab

Tagline: Where startup ideas meet investment opportunities

Primary color: #4F46E5

Secondary color: #06B6D4

Background: #F9FAFB

Text: #111827

Create a New Page

Page title: Analytics Dashboard

At the top left include a Back button:

← Back

The page should allow the user to switch between two views of the same data:

Table View

Analytics View

Use a segmented toggle control like:

[ Table View ] [ Analytics View ]

The toggle should switch content inside the same page, not navigate to another page.

Table View

In Table View, display a clean paginated table using this data.

Table columns

Startup Title

Industry

Stage

Average Rating

Number of Offers

Accepted Offers

Table data

AI Fitness Coach | HealthTech | MVP | 4.5 | 8 | 2

EdTech Mentor AI | EdTech | Beta | 4.2 | 5 | 1

GreenCart | SaaS | Launch | 3.9 | 3 | 0

FinTrack Pro | FinTech | MVP | 4.7 | 10 | 3

TravelSync | SaaS | Idea | 3.8 | 2 | 0

MediBridge | HealthTech | Beta | 4.4 | 6 | 2

Add pagination at the bottom.

Analytics View

In Analytics View, show the same startup data in visual form.

Section 1 – Summary Cards

At the top, display 4 statistic cards:

Total Startups: 6

Total Offers: 34

Accepted Offers: 8

Average Rating: 4.25

Each card should contain:

a label

a large number

a small icon

rounded corners

soft shadow

Section 2 – Pie Chart

Title: Offer Status Distribution

Create a pie chart with:

Pending: 17

Accepted: 8

Rejected: 9

Use badges or chart legend:

Pending = yellow

Accepted = green

Rejected = red

Section 3 – Bar Chart

Title: Offers per Startup

Create a vertical bar chart with:

AI Fitness Coach = 8

EdTech Mentor AI = 5

GreenCart = 3

FinTrack Pro = 10

TravelSync = 2

MediBridge = 6

X-axis = startup names
Y-axis = number of offers

Section 4 – Ranking List

Title: Top Startups

Create a ranking section with stars:

FinTrack Pro — ⭐ 4.7

AI Fitness Coach — ⭐ 4.5

MediBridge — ⭐ 4.4

EdTech Mentor AI — ⭐ 4.2

GreenCart — ⭐ 3.9

Design this as a ranked card list with emphasis on the top entry.

Section 5 – Insights Panel

Add a small text card called Insights with these short observations:

FinTrack Pro has the highest investor interest with 10 offers.

HealthTech ideas show strong performance in both ratings and offer volume.

TravelSync has the lowest engagement and may need better positioning.

Components to Create

Create reusable UI components for:

analytics toggle

summary cards

pie chart container

bar chart container

ranking list card

table component

pagination

back button

Layout Requirements

Keep the page visually balanced

Use cards and sections with generous spacing

Make charts easy to read

Keep the design consistent with the rest of VentureLab

Use a desktop dashboard layout

Goal

The screen should clearly show:

a tabular representation of startup data

a visual representation of the same data

statistics and ranking related to startup ideas and investment offers

This page should look like a polished analytics dashboard inside a startup SaaS application.