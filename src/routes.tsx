import { createBrowserRouter } from "react-router";
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Kanban from "./pages/Kanban";
import CustomerDetail from "./pages/CustomerDetail";
import Tasks from "./pages/Tasks";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import PdfPreview from "./pages/PdfPreview";
import Leads from "./pages/Leads";
import ProtectedRoute from "./components/ProtectedRoute";
import { ROLES, ALL_ROLES, ADMIN_MANAGER, ADMIN_ONLY } from './utils/roles';

console.log('[Routes] Initializing browser router...');

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
    path: "/dashboard",
    element: (
      <ProtectedRoute allowedRoles={ALL_ROLES}>
        <Dashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: "/leads",
    element: (
      <ProtectedRoute allowedRoles={ALL_ROLES}>
        <Leads />
      </ProtectedRoute>
    ),
  },
  {
    path: "/kanban",
    element: (
      <ProtectedRoute allowedRoles={ALL_ROLES}>
        <Kanban />
      </ProtectedRoute>
    ),
  },
  {
    path: "/customer/:id",
    element: (
      <ProtectedRoute allowedRoles={ALL_ROLES}>
        <CustomerDetail />
      </ProtectedRoute>
    ),
  },
  {
    path: "/tasks",
    element: (
      <ProtectedRoute allowedRoles={ALL_ROLES}>
        <Tasks />
      </ProtectedRoute>
    ),
  },
  {
    path: "/reports",
    element: (
      <ProtectedRoute allowedRoles={ADMIN_MANAGER}>
        <Reports />
      </ProtectedRoute>
    ),
  },
  {
    path: "/settings",
    element: (
      <ProtectedRoute allowedRoles={ADMIN_ONLY}>
        <Settings />
      </ProtectedRoute>
    ),
  },
  {
    path: "/pdf-preview/:id",
    element: (
      <ProtectedRoute allowedRoles={ALL_ROLES}>
        <PdfPreview />
      </ProtectedRoute>
    ),
  },
]);

export { ROLES, ALL_ROLES, ADMIN_MANAGER, ADMIN_ONLY };
