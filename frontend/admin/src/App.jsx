import { lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "./stores/authStore";
import { isAdminRole, isStaffRole } from "./data/enums";
import { adminApi } from "./services/api";
import Login from "./app/Login";
import ForgotPassword from "./app/ForgotPassword";
import ResetPassword from "./app/ResetPassword";
import GitHubCallback from "./app/GitHubCallback";
import Forbidden from "./app/Forbidden";
import Loader from "./components/Loader";
import Shell from "./components/Shell";

const Dashboard = lazy(() => import("./app/Dashboard"));
const Questions = lazy(() => import("./app/Questions"));
const NewQuestion = lazy(() => import("./app/NewQuestion"));
const QuestionForm = lazy(() => import("./app/QuestionForm"));
const QuestionPreview = lazy(() => import("./app/QuestionPreview"));
const Catalog = lazy(() => import("./app/Catalog"));
const Users = lazy(() => import("./app/Users"));
const UserProfile = lazy(() => import("./app/UserProfile"));
const Audit = lazy(() => import("./app/Audit"));
const Billing = lazy(() => import("./app/Billing"));
const Mail = lazy(() => import("./app/Mail"));
const Account = lazy(() => import("./app/Account"));
const Sheets = lazy(() => import("./app/Sheets"));
const SheetForm = lazy(() => import("./app/SheetForm"));
const OaSets = lazy(() => import("./app/OaSets"));
const OaForm = lazy(() => import("./app/OaForm"));

function Private({ children }) {
  const token = useAuthStore((s) => s.accessToken);
  const meQuery = useQuery({ queryKey: ["me"], queryFn: adminApi.me, enabled: Boolean(token) });
  if (!token) return <Navigate to="/login" replace />;
  if (meQuery.isLoading) return <Loader screen />;
  if (!isStaffRole(meQuery.data?.data?.role)) return <Forbidden />;
  return children;
}

function AdminOnly({ children }) {
  const meQuery = useQuery({ queryKey: ["me"], queryFn: adminApi.me });
  if (meQuery.isLoading) return <Loader fill />;
  if (!isAdminRole(meQuery.data?.data?.role)) return <Forbidden />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/auth/github" element={<GitHubCallback />} />
      <Route path="/forbidden" element={<Forbidden />} />
      <Route path="/" element={<Private><Shell /></Private>}>
        <Route index element={<Dashboard />} />
        <Route path="questions" element={<Questions />} />
        <Route path="questions/new" element={<NewQuestion />} />
        <Route path="questions/new/:type" element={<QuestionForm />} />
        <Route path="questions/:id/view" element={<QuestionPreview />} />
        <Route path="questions/:id" element={<QuestionForm />} />
        <Route path="catalog" element={<Catalog />} />
        <Route path="sheets" element={<Sheets />} />
        <Route path="sheets/new" element={<SheetForm />} />
        <Route path="sheets/:id" element={<SheetForm />} />
        <Route path="oa" element={<OaSets />} />
        <Route path="oa/new" element={<OaForm />} />
        <Route path="oa/:id/view" element={<OaForm />} />
        <Route path="oa/:id" element={<OaForm />} />
        <Route path="users" element={<AdminOnly><Users /></AdminOnly>} />
        <Route path="users/:id" element={<AdminOnly><UserProfile /></AdminOnly>} />
        <Route path="account" element={<Account />} />
        <Route path="billing" element={<AdminOnly><Billing /></AdminOnly>} />
        <Route path="mail" element={<AdminOnly><Mail /></AdminOnly>} />
        <Route path="audit" element={<AdminOnly><Audit /></AdminOnly>} />
      </Route>
    </Routes>
  );
}
