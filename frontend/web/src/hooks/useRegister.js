import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authApi, userApi } from "../services/api";
import { useAuthStore } from "../stores/authStore";
import { isValidEmail } from "../utils/email";

export function useRegister() {
  const navigate = useNavigate();
  const setTokens = useAuthStore((s) => s.setTokens);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  async function finish(tokens) {
    setTokens(tokens?.accessToken, tokens?.refreshToken, true);
    await userApi.profile().catch(() => null);
    navigate("/onboarding");
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    const trimmedEmail = email.trim();
    if (!isValidEmail(trimmedEmail)) {
      setError("Enter a valid email address, like name@gmail.com");
      return;
    }
    try {
      await authApi.register({ name, email: trimmedEmail, password });
      navigate(`/check-email?email=${encodeURIComponent(trimmedEmail)}`);
    } catch (err) {
      setError(err?.message);
    }
  }

  const onGoogle = useCallback(async (idToken) => {
    setError("");
    try {
      const res = await authApi.google({ idToken });
      await finish(res?.data);
    } catch (err) {
      setError(err?.message);
    }
  }, []);

  return {
    name,
    setName,
    email,
    setEmail,
    password,
    setPassword,
    showPassword,
    setShowPassword,
    error,
    onSubmit,
    onGoogle,
  };
}
