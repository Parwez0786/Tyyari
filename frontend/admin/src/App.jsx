import { Navigate, Route, Routes } from "react-router-dom";
import { useAuthStore } from "./stores/authStore";
import Login from "./app/Login";
import Shell from "./components/Shell";
import Dashboard from "./app/Dashboard";
import Questions from "./app/Questions";
import NewQuestion from "./app/NewQuestion";
import QuestionForm from "./app/QuestionForm";
import Catalog from "./app/Catalog";
import Users from "./app/Users";
import UserProfile from "./app/UserProfile";
import Audit from "./app/Audit";
import Billing from "./app/Billing";
import Sheets from "./app/Sheets";
import SheetForm from "./app/SheetForm";
import OaSets from "./app/OaSets";
import OaForm from "./app/OaForm";

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
        <Route path="questions/:id" element={<QuestionForm />} />
        <Route path="catalog" element={<Catalog />} />
        <Route path="sheets" element={<Sheets />} />
        <Route path="sheets/new" element={<SheetForm />} />
        <Route path="sheets/:id" element={<SheetForm />} />
        <Route path="oa" element={<OaSets />} />
        <Route path="oa/new" element={<OaForm />} />
        <Route path="oa/:id" element={<OaForm />} />
        <Route path="users" element={<Users />} />
        <Route path="users/:id" element={<UserProfile />} />
        <Route path="billing" element={<Billing />} />
        <Route path="audit" element={<Audit />} />
      </Route>
    </Routes>
  );
}
