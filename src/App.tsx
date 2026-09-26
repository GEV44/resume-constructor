import { lazy, Suspense } from "react";
import { MotionConfig } from "framer-motion";
import { Toaster } from "@/components/ui/sonner";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import ErrorBoundary from "@/components/ErrorBoundary";
import Landing from "./pages/Landing";

// Every route except the landing page is code-split so first paint stays small.
const AtsChecker = lazy(() => import("./pages/AtsChecker"));
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const UploadResume = lazy(() => import("./pages/UploadResume"));
const AnalysisResult = lazy(() => import("./pages/AnalysisResult"));
const Analyses = lazy(() => import("./pages/Analyses"));
const Optimizations = lazy(() => import("./pages/Optimizations"));
const Profile = lazy(() => import("./pages/Profile"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const NotFound = lazy(() => import("./pages/NotFound"));

const PageFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-background" role="status" aria-label="Loading">
    <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

const protectedRoutes = [
  { path: "/dashboard", element: <Dashboard /> },
  { path: "/dashboard/upload", element: <UploadResume /> },
  { path: "/dashboard/analysis/:id", element: <AnalysisResult /> },
  { path: "/dashboard/analyses", element: <Analyses /> },
  { path: "/dashboard/optimizations", element: <Optimizations /> },
  { path: "/dashboard/profile", element: <Profile /> },
  { path: "/dashboard/admin", element: <AdminDashboard /> },
];

const App = () => (
  <ErrorBoundary>
    {/* Honour the OS "reduce motion" setting for every framer-motion animation. */}
    <MotionConfig reducedMotion="user">
      <Toaster />
      <BrowserRouter>
        <AuthProvider>
          <Suspense fallback={<PageFallback />}>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/ats-checker" element={<AtsChecker />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              {protectedRoutes.map(({ path, element }) => (
                <Route key={path} path={path} element={<ProtectedRoute>{element}</ProtectedRoute>} />
              ))}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </MotionConfig>
  </ErrorBoundary>
);

export default App;
