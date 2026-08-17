import { Navigate, Route, Routes } from "react-router-dom";
import { useAuthStore } from "./stores/authStore";
import Login from "./app/Login";
import Shell from "./components/Shell";
import Questions from "./app/Questions";
import QuestionForm from "./app/QuestionForm";
import Catalog from "./app/Catalog";
import Users from "./app/Users";

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
        <Route index element={<Questions />} />
        <Route path="questions/new" element={<QuestionForm />} />
        <Route path="questions/:id" element={<QuestionForm />} />
        <Route path="catalog" element={<Catalog />} />
        <Route path="users" element={<Users />} />
      </Route>
    </Routes>
  );
}
