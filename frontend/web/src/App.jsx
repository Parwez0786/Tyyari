import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { authApi } from "./services/api";
import { useAuthStore } from "./stores/authStore";
import { queryClient } from "./queryClient";
import Landing from "./app/Landing";
import Loader from "./components/Loader";

const Login = lazy(() => import("./app/Login"));
const Register = lazy(() => import("./app/Register"));
const ForgotPassword = lazy(() => import("./app/ForgotPassword"));
const CheckEmail = lazy(() => import("./app/CheckEmail"));
const VerifyEmail = lazy(() => import("./app/VerifyEmail"));
const GitHubCallback = lazy(() => import("./app/GitHubCallback"));
const ResetPassword = lazy(() => import("./app/ResetPassword"));
const Onboarding = lazy(() => import("./app/Onboarding"));
const Dashboard = lazy(() => import("./app/Dashboard"));
const Learn = lazy(() => import("./app/Learn"));
const Practice = lazy(() => import("./app/Practice"));
const Question = lazy(() => import("./app/Question"));
const Sheets = lazy(() => import("./app/Sheets"));
const SheetDetail = lazy(() => import("./app/SheetDetail"));
const OaPrecheck = lazy(() => import("./app/OaPrecheck"));
const OaExam = lazy(() => import("./app/OaExam"));
const Premium = lazy(() => import("./app/Premium"));
const Legal = lazy(() => import("./app/Legal"));

function Load({ children }) {
  return <Suspense fallback={<Loader screen />}>{children}</Suspense>;
}

function Private({ children }) {
  const token = useAuthStore((s) => s.accessToken);
  const clear = useAuthStore((s) => s.clear);
  const session = useQuery({
    queryKey: ["me"],
    queryFn: authApi.me,
    enabled: Boolean(token),
    retry: false,
  });
  if (!token) return <Navigate to="/login" replace />;
  if (session.isLoading) {
    return <Loader screen />;
  }
  if (session.isError) {
    clear();
    queryClient.clear();
    return <Navigate to="/login" replace />;
  }
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/privacy" element={<Load><Legal kind="privacy" /></Load>} />
      <Route path="/terms" element={<Load><Legal kind="terms" /></Load>} />
      <Route path="/login" element={<Load><Login /></Load>} />
      <Route path="/register" element={<Load><Register /></Load>} />
      <Route path="/forgot-password" element={<Load><ForgotPassword /></Load>} />
      <Route path="/check-email" element={<Load><CheckEmail /></Load>} />
      <Route path="/verify-email" element={<Load><VerifyEmail /></Load>} />
      <Route path="/reset-password" element={<Load><ResetPassword /></Load>} />
      <Route path="/auth/github" element={<Load><GitHubCallback /></Load>} />
      <Route path="/premium" element={<Load><Premium /></Load>} />
      <Route path="/onboarding" element={<Private><Load><Onboarding /></Load></Private>} />
      <Route path="/dashboard" element={<Private><Load><Dashboard /></Load></Private>} />
      <Route path="/learn" element={<Private><Load><Learn /></Load></Private>} />
      <Route path="/practice" element={<Private><Load><Practice /></Load></Private>} />
      <Route path="/practice/:type" element={<Private><Load><Practice /></Load></Private>} />
      <Route path="/sheets" element={<Private><Load><Sheets /></Load></Private>} />
      <Route path="/sheets/:id" element={<Private><Load><SheetDetail /></Load></Private>} />
      <Route path="/questions/:id" element={<Private><Load><Question /></Load></Private>} />
      <Route path="/oa/:id/precheck" element={<Private><Load><OaPrecheck /></Load></Private>} />
      <Route path="/oa/:id/exam" element={<Private><Load><OaExam /></Load></Private>} />
    </Routes>
  );
}
