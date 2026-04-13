import React, { lazy, Suspense } from "react";
import { createBrowserRouter } from "react-router";
import LandingPage from "./pages/LandingPage";
import ProtectedRoute from "./components/ProtectedRoute";
import { ALL_ROLES, ADMIN_MANAGER, ADMIN_ONLY } from './utils/roles';
import { GlobalLoader } from "./components/GlobalLoader";

// Lazy-load pages for performance
const Login = lazy(() => import("./pages/Login"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Leads = lazy(() => import("./pages/Leads"));
const Kanban = lazy(() => import("./pages/Kanban"));
const CustomerDetail = lazy(() => import("./pages/CustomerDetail"));
const Tasks = lazy(() => import("./pages/Tasks"));
const Reports = lazy(() => import("./pages/Reports"));
const Team = lazy(() => import("./pages/Team"));
const Settings = lazy(() => import("./pages/Settings"));
const PdfPreview = lazy(() => import("./pages/PdfPreview"));
const TeamInsights = lazy(() => import("./pages/TeamInsights"));

import { ROLES } from './utils/roles';

// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <GlobalLoader />
  </div>
);

export const router = createBrowserRouter([
  {
    path: "/",
    element: <LandingPage />,
  },
  {
    path: "/login",
    element: (
      <Suspense fallback={<PageLoader />}>
        <Login />
      </Suspense>
    ),
  },
  {
    path: "/dashboard",
    element: (
      <ProtectedRoute allowedRoles={ALL_ROLES}>
        <Suspense fallback={<PageLoader />}>
          <Dashboard />
        </Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: "/leads",
    element: (
      <ProtectedRoute allowedRoles={ALL_ROLES}>
        <Suspense fallback={<PageLoader />}>
          <Leads />
        </Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: "/kanban",
    element: (
      <ProtectedRoute allowedRoles={[ROLES.SALES, ROLES.ADMIN]}>
        <Suspense fallback={<PageLoader />}>
          <Kanban />
        </Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: "/team-insights",
    element: (
      <ProtectedRoute allowedRoles={ADMIN_MANAGER}>
        <Suspense fallback={<PageLoader />}>
          <TeamInsights />
        </Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: "/customer/:id",
    element: (
      <ProtectedRoute allowedRoles={ALL_ROLES}>
        <Suspense fallback={<PageLoader />}>
          <CustomerDetail />
        </Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: "/tasks",
    element: (
      <ProtectedRoute allowedRoles={ALL_ROLES}>
        <Suspense fallback={<PageLoader />}>
          <Tasks />
        </Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: "/reports",
    element: (
      <ProtectedRoute allowedRoles={ADMIN_MANAGER}>
        <Suspense fallback={<PageLoader />}>
          <Reports />
        </Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: "/team",
    element: (
      <ProtectedRoute allowedRoles={ADMIN_MANAGER}>
        <Suspense fallback={<PageLoader />}>
          <Team />
        </Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: "/settings",
    element: (
      <ProtectedRoute allowedRoles={ADMIN_MANAGER}>
        <Suspense fallback={<PageLoader />}>
          <Settings />
        </Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: "/pdf-preview/:id",
    element: (
      <ProtectedRoute allowedRoles={ALL_ROLES}>
        <Suspense fallback={<PageLoader />}>
          <PdfPreview />
        </Suspense>
      </ProtectedRoute>
    ),
  },
]);

export { ALL_ROLES, ADMIN_MANAGER, ADMIN_ONLY };
