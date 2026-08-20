import { Navigate, Route, Routes } from "react-router-dom";
import { useAuthStore } from "./stores/authStore";
import Landing from "./app/Landing";
import Login from "./app/Login";
import Register from "./app/Register";
import ForgotPassword from "./app/ForgotPassword";
import CheckEmail from "./app/CheckEmail";
import VerifyEmail from "./app/VerifyEmail";
import GitHubCallback from "./app/GitHubCallback";
import ResetPassword from "./app/ResetPassword";
import Onboarding from "./app/Onboarding";
import Dashboard from "./app/Dashboard";
import Practice from "./app/Practice";
import Question from "./app/Question";
import Sheets from "./app/Sheets";
import SheetDetail from "./app/SheetDetail";
import OaPrecheck from "./app/OaPrecheck";
import OaExam from "./app/OaExam";

function Private({ children }) {
  const token = useAuthStore((s) => s.accessToken);
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/check-email" element={<CheckEmail />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/auth/github" element={<GitHubCallback />} />
      <Route path="/onboarding" element={<Private><Onboarding /></Private>} />
      <Route path="/dashboard" element={<Private><Dashboard /></Private>} />
      <Route path="/practice" element={<Private><Practice /></Private>} />
      <Route path="/practice/:type" element={<Private><Practice /></Private>} />
      <Route path="/sheets" element={<Private><Sheets /></Private>} />
      <Route path="/sheets/:id" element={<Private><SheetDetail /></Private>} />
      <Route path="/questions/:id" element={<Private><Question /></Private>} />
      <Route path="/oa/:id/precheck" element={<Private><OaPrecheck /></Private>} />
      <Route path="/oa/:id/exam" element={<Private><OaExam /></Private>} />
    </Routes>
  );
}
