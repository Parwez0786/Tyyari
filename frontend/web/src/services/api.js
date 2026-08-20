import { useAuthStore } from "../stores/authStore";

const API = import.meta.env.VITE_API_URL || "http://localhost:8080";

async function parse(res) {
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.success === false) {
    const err = new Error(json.error?.message || "Request failed");
    err.code = json.error?.code;
    err.status = res.status;
    throw err;
  }
  return json;
}

async function refreshAccess() {
  const refreshToken = useAuthStore.getState().refreshToken;
  if (!refreshToken) return null;
  const res = await fetch(`${API}/api/v1/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });
  if (!res.ok) {
    useAuthStore.getState().clear();
    return null;
  }
  const json = await res.json();
  const data = json.data;
  useAuthStore.getState().setTokens(data.accessToken, data.refreshToken);
  return data.accessToken;
}

export async function api(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (options.body && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }
  const token = useAuthStore.getState().accessToken;
  if (token) headers.Authorization = `Bearer ${token}`;

  let res = await fetch(`${API}${path}`, { ...options, headers });
  if (res.status === 401 && useAuthStore.getState().refreshToken) {
    const next = await refreshAccess();
    if (next) {
      headers.Authorization = `Bearer ${next}`;
      res = await fetch(`${API}${path}`, { ...options, headers });
    }
  }
  return parse(res);
}

export const authApi = {
  register: (body) => api("/api/v1/auth/register", { method: "POST", body: JSON.stringify(body) }),
  login: (body) => api("/api/v1/auth/login", { method: "POST", body: JSON.stringify(body) }),
  me: () => api("/api/v1/auth/me"),
  logout: (refreshToken) => api("/api/v1/auth/logout", { method: "POST", body: JSON.stringify({ refreshToken }) }),
  google: (body) => api("/api/v1/auth/google", { method: "POST", body: JSON.stringify(body) }),
  github: (body) => api("/api/v1/auth/github", { method: "POST", body: JSON.stringify(body) }),
  publicConfig: () => api("/api/v1/auth/public-config"),
  forgotPassword: (body) => api("/api/v1/auth/forgot-password", { method: "POST", body: JSON.stringify(body) }),
  resendVerification: (body) => api("/api/v1/auth/resend-verification", { method: "POST", body: JSON.stringify(body) }),
  verifyEmail: (body) => api("/api/v1/auth/verify-email", { method: "POST", body: JSON.stringify(body) }),
  resetPassword: (body) => api("/api/v1/auth/reset-password", { method: "POST", body: JSON.stringify(body) }),
};

export const userApi = {
  profile: () => api("/api/v1/users/me"),
  updateProfile: (body) => api("/api/v1/users/me", { method: "PUT", body: JSON.stringify(body) }),
  preferences: () => api("/api/v1/users/me/preferences"),
  goals: () => api("/api/v1/users/me/goals"),
  saveGoals: (body) => api("/api/v1/users/me/goals", { method: "PUT", body: JSON.stringify(body) }),
  saveSubmission: (body) => api("/api/v1/users/me/submissions", { method: "PUT", body: JSON.stringify(body) }),
  getSubmission: (questionId, assessmentSetId) => {
    const q = new URLSearchParams({ questionId });
    if (assessmentSetId) q.set("assessmentSetId", assessmentSetId);
    return api(`/api/v1/users/me/submissions?${q.toString()}`);
  },
  assessmentSubmissions: (assessmentSetId) => api(`/api/v1/users/me/assessments/${assessmentSetId}/submissions`),
  practiceProgress: () => api("/api/v1/users/me/progress"),
};

export const contentApi = {
  questions: (params) => {
    const q = new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([, v]) => v)));
    return api(`/api/v1/questions?${q.toString()}`);
  },
  question: (id) => api(`/api/v1/questions/${id}`),
  hints: (id) => api(`/api/v1/questions/${id}/hints`),
  companies: () => api("/api/v1/companies"),
  topics: (category) => api(category ? `/api/v1/topics?category=${category}` : "/api/v1/topics"),
  tags: () => api("/api/v1/tags"),
  assessmentSets: () => api("/api/v1/assessment-sets"),
  assessmentSet: (id) => api(`/api/v1/assessment-sets/${id}`),
  sheets: (type) => api(type ? `/api/v1/sheets?type=${encodeURIComponent(type)}` : "/api/v1/sheets"),
  sheet: (id) => api(`/api/v1/sheets/${id}`),
};
