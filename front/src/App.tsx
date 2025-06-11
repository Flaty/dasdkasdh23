// src/App.tsx
import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";

import Calc from "./pages/Calc";
import Profile from "./pages/Profile";
import OrdersPage from "./pages/OrdersPage";

import PageWrapperFade from "./components/PageWrapperFade";
import TabBarLayout from "./layouts/TabBarLayout";

export default function App() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.key}>
        <Route element={<TabBarLayout />}>
          <Route path="/" element={<Navigate to="/profile" replace />} />
          <Route
            path="/calc"
            element={
              <PageWrapperFade>
                <Calc />
              </PageWrapperFade>
            }
          />
          <Route
            path="/profile"
            element={
              <PageWrapperFade>
                <Profile />
              </PageWrapperFade>
            }
          />
          <Route
            path="/cart"
            element={
              <PageWrapperFade scrollable>
                <OrdersPage />
              </PageWrapperFade>
            }
          />
        </Route>
      </Routes>
    </AnimatePresence>
  );
}