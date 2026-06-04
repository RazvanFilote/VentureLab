import { RouterProvider } from "react-router";
import { router } from "./routes";
import { AuthProvider } from "./context/AuthContext";
import { IdeasProvider } from "./context/IdeasContext";
import { OffersProvider } from "./context/OffersContext";
import { FeedbackProvider } from "./context/FeedbackContext";
import { BookmarksProvider } from "./context/BookmarksContext";
import { ActivityProvider } from "./context/ActivityContext";
import { WalletProvider } from "./context/WalletContext";
import { NetworkProvider } from "./context/NetworkContext";
import { WebSocketProvider } from "./context/WebSocketContext";
import { OfflineBanner } from "./components/OfflineBanner";
import { MilestonesProvider } from "./context/MilestonesContext";

export default function App() {
  return (
    <ActivityProvider>
      <AuthProvider>
        <BookmarksProvider>
          <IdeasProvider>
            <OffersProvider>
              <WalletProvider>
                <FeedbackProvider>
                  <MilestonesProvider>
                    <NetworkProvider>
                      <WebSocketProvider>
                        <RouterProvider router={router} />
                        <OfflineBanner />
                      </WebSocketProvider>
                    </NetworkProvider>
                  </MilestonesProvider>
                </FeedbackProvider>
              </WalletProvider>
            </OffersProvider>
          </IdeasProvider>
        </BookmarksProvider>
      </AuthProvider>
    </ActivityProvider>
  );
}
