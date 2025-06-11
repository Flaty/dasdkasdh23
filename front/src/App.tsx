// src/App.tsx
import { Routes, Route, useLocation, Navigate } from "react-router-dom";
// ⛔️ Убираем useEffect и resetPathStack
import { AnimatePresence } from "framer-motion";

import Calc from "./pages/Calc";
import Profile from "./pages/Profile";
import OrdersPage from "./pages/OrdersPage";

import PageWrapperSwipe from "./components/PageWrapperSwipe";
import TabBarLayout from "./layouts/TabBarLayout";

export default function App() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.key}>
        <Route path="/" element={<Navigate to="/profile" replace />} />
        <Route
          path="/calc"
          element={
            <PageWrapperSwipe>
              <TabBarLayout>
                <Calc />
              </TabBarLayout>
            </PageWrapperSwipe>
          }
        />
        <Route
          path="/profile"
          element={
            <PageWrapperSwipe>
              <TabBarLayout>
                <Profile />
              </TabBarLayout>
            </PageWrapperSwipe>
          }
        />
        <Route
          path="/cart"
          element={
            <PageWrapperSwipe scrollable>
              <TabBarLayout>
                <OrdersPage />
              </TabBarLayout>
            </PageWrapperSwipe>
          }
        />
      </Routes>
    </AnimatePresence>
  );
}