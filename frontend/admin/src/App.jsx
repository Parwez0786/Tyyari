import { lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useAuthStore } from "./stores/authStore";
import Login from "./app/Login";
import Shell from "./components/Shell";

const Dashboard = lazy(() => import("./app/Dashboard"));
const Questions = lazy(() => import("./app/Questions"));
const NewQuestion = lazy(() => import("./app/NewQuestion"));
const QuestionForm = lazy(() => import("./app/QuestionForm"));
const Catalog = lazy(() => import("./app/Catalog"));
const Users = lazy(() => import("./app/Users"));
const UserProfile = lazy(() => import("./app/UserProfile"));
const Audit = lazy(() => import("./app/Audit"));
const Billing = lazy(() => import("./app/Billing"));
const Sheets = lazy(() => import("./app/Sheets"));
const SheetForm = lazy(() => import("./app/SheetForm"));
const OaSets = lazy(() => import("./app/OaSets"));
const OaForm = lazy(() => import("./app/OaForm"));

function Private({ children }) {
  const token = useAuthStore((s) => s.accessToken);
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Private><Shell /></Private>}>
        <Route index element={<Dashboard />} />
        <Route path="questions" element={<Questions />} />
        <Route path="questions/new" element={<NewQuestion />} />
        <Route path="questions/new/:type" element={<QuestionForm />} />
        <Route path="questions/:id/view" element={<QuestionForm />} />
        <Route path="questions/:id" element={<QuestionForm />} />
        <Route path="catalog" element={<Catalog />} />
        <Route path="sheets" element={<Sheets />} />
        <Route path="sheets/new" element={<SheetForm />} />
        <Route path="sheets/:id" element={<SheetForm />} />
        <Route path="oa" element={<OaSets />} />
        <Route path="oa/new" element={<OaForm />} />
        <Route path="oa/:id/view" element={<OaForm />} />
        <Route path="oa/:id" element={<OaForm />} />
        <Route path="users" element={<Users />} />
        <Route path="users/:id" element={<UserProfile />} />
        <Route path="billing" element={<Billing />} />
        <Route path="audit" element={<Audit />} />
      </Route>
    </Routes>
  );
}
