import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authApi, userApi } from "../services/api";
import { useAuthStore } from "../stores/authStore";
import { queryClient } from "../queryClient";
import { isValidEmail } from "../utils/email";

export function useLogin() {
  const navigate = useNavigate();
  const setTokens = useAuthStore((s) => s.setTokens);
  const [email, setEmail] = useState("demo@tyyari.dev");
  const [password, setPassword] = useState("Demo@12345");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function finish(tokens) {
    setTokens(tokens?.accessToken, tokens?.refreshToken, remember);
    const profile = await userApi.profile();
    queryClient.setQueryData(["profile"], profile);
    navigate(profile.data?.onboarded ? "/dashboard" : "/onboarding");
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setNotice("");
    if (!isValidEmail(email)) {
      setError("Enter a valid email address");
      return;
    }
    try {
      const res = await authApi.login({ email, password });
      await finish(res?.data);
    } catch (err) {
      setError(err?.message);
      if (err?.code === "AUTH_EMAIL_UNVERIFIED") {
        setNotice("Need a new link? Use Resend verification below.");
      }
      if (err?.code === "AUTH_ACCOUNT_DISABLED") {
        setNotice("An admin disabled this account. Ask them to enable it if you should still have access.");
      }
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
  }, [remember]);

  async function emailLink() {
    setError("");
    setNotice("");
    if (!isValidEmail(email)) {
      setError("Enter a valid email address");
      return;
    }
    try {
      await authApi.forgotPassword({ email });
      setNotice("If that email exists, we sent a link to continue.");
    } catch (err) {
      setError(err?.message);
    }
  }

  async function resendVerification() {
    setError("");
    setNotice("");
    if (!isValidEmail(email)) {
      setError("Enter a valid email address");
      return;
    }
    try {
      await authApi.resendVerification({ email });
      setNotice("If that email exists, we sent a verification message.");
    } catch (err) {
      setError(err?.message);
    }
  }

  return {
    email,
    setEmail,
    password,
    setPassword,
    showPassword,
    setShowPassword,
    remember,
    setRemember,
    error,
    notice,
    onSubmit,
    onGoogle,
    emailLink,
    resendVerification,
  };
}
