import { createBrowserRouter } from "react-router";
import { LandingPage } from "./pages/LandingPage";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { AppLayout } from "./pages/AppLayout";
import { IdeasList } from "./pages/IdeasList";
import { IdeaDetail } from "./pages/IdeaDetail";
import { CreateIdea } from "./pages/CreateIdea";
import { EditIdea } from "./pages/EditIdea";
import { UserManagement } from "./pages/UserManagement";
import { InvestorLayout } from "./pages/investor/InvestorLayout";
import { InvestorDashboard } from "./pages/investor/InvestorDashboard";
import { IdeasMarketplace } from "./pages/investor/IdeasMarketplace";
import { IdeaDetailInvestor } from "./pages/investor/IdeaDetailInvestor";
import { SavedIdeas } from "./pages/investor/SavedIdeas";
import { AnalyticsDashboard } from "./pages/AnalyticsDashboard";
import { MyOffers } from "./pages/investor/MyOffers";
import { InvestorWallet } from "./pages/investor/InvestorWallet";
import { OffersReceived } from "./pages/OffersReceived";
import { OfferDetail } from "./pages/OfferDetail";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <LandingPage />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/register",
    element: <Register />,
  },
  {
    path: "/app",
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <IdeasList />,
      },
      {
        path: "ideas",
        element: <IdeasList />,
      },
      {
        path: "ideas/:id",
        element: <IdeaDetail />,
      },
      {
        path: "ideas/new",
        element: <CreateIdea />,
      },
      {
        path: "ideas/:id/edit",
        element: <EditIdea />,
      },
      {
        path: "users",
        element: <UserManagement />,
      },
      {
        path: "analytics",
        element: <AnalyticsDashboard />,
      },
      {
        path: "offers",
        element: <OffersReceived />,
      },
      {
        path: "offers/:id",
        element: <OfferDetail />,
      },
    ],
  },
  {
    path: "/investor",
    element: <InvestorLayout />,
    children: [
      {
        index: true,
        element: <InvestorDashboard />,
      },
      {
        path: "marketplace",
        element: <IdeasMarketplace />,
      },
      {
        path: "ideas/:id",
        element: <IdeaDetailInvestor />,
      },
      {
        path: "saved",
        element: <SavedIdeas />,
      },
      {
        path: "offers",
        element: <MyOffers />,
      },
      {
        path: "wallet",
        element: <InvestorWallet />,
      },
    ],
  },
]);