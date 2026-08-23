import { useAuthStore } from "../stores/authStore";

const API = import.meta.env.VITE_API_URL || "http://localhost:8080";

async function parse(res) {
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.success === false) {
    const err = new Error(json.error?.message || "Request failed");
    err.status = res.status;
    throw err;
  }
  return json;
}

export async function api(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (options.body && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }
  const token = useAuthStore.getState().accessToken;
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API}${path}`, { ...options, headers });
  if (res.status === 401) {
    const refreshToken = useAuthStore.getState().refreshToken;
    if (refreshToken) {
      const refresh = await fetch(`${API}/api/v1/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });
      if (refresh.ok) {
        const body = await refresh.json();
        useAuthStore.getState().setTokens(body.data.accessToken, body.data.refreshToken);
        headers.Authorization = `Bearer ${body.data.accessToken}`;
        return parse(await fetch(`${API}${path}`, { ...options, headers }));
      }
    }
    useAuthStore.getState().clear();
  }
  return parse(res);
}

export const adminApi = {
  login: (body) => api("/api/v1/auth/login", { method: "POST", body: JSON.stringify(body) }),
  me: () => api("/api/v1/auth/me"),
  stats: () => api("/api/v1/admin/stats"),
  metrics: () => api("/api/v1/admin/metrics"),
  questions: (params = {}) => {
    const query = new URLSearchParams(
      Object.entries({ limit: 50, ...params }).filter(([, value]) => value != null && value !== ""),
    ).toString();
    return api(`/api/v1/admin/questions?${query}`);
  },
  question: (id) => api(`/api/v1/admin/questions/${id}`),
  createQuestion: (body) => api("/api/v1/admin/questions", { method: "POST", body: JSON.stringify(body) }),
  updateQuestion: (id, body) => api(`/api/v1/admin/questions/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  deleteQuestion: (id) => api(`/api/v1/admin/questions/${id}`, { method: "DELETE" }),
  publish: (id, published) => api(`/api/v1/admin/questions/${id}/publish`, { method: "PATCH", body: JSON.stringify({ published }) }),
  companies: () => api("/api/v1/admin/companies"),
  createCompany: (body) => api("/api/v1/admin/companies", { method: "POST", body: JSON.stringify(body) }),
  deleteCompany: (id) => api(`/api/v1/admin/companies/${id}`, { method: "DELETE" }),
  topics: () => api("/api/v1/admin/topics"),
  createTopic: (body) => api("/api/v1/admin/topics", { method: "POST", body: JSON.stringify(body) }),
  deleteTopic: (id) => api(`/api/v1/admin/topics/${id}`, { method: "DELETE" }),
  tags: () => api("/api/v1/admin/tags"),
  createTag: (body) => api("/api/v1/admin/tags", { method: "POST", body: JSON.stringify(body) }),
  deleteTag: (id) => api(`/api/v1/admin/tags/${id}`, { method: "DELETE" }),
  users: () => api("/api/v1/admin/users"),
  userDirectory: () => api("/api/v1/admin/users/directory"),
  inviteUser: (body) => api("/api/v1/admin/users", { method: "POST", body: JSON.stringify(body) }),
  user: (id) => api(`/api/v1/admin/users/${id}`),
  userProfile: (id) => api(`/api/v1/admin/users/${id}/profile`),
  setUserStatus: (id, status) => api(`/api/v1/admin/users/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
  setUserRole: (id, role) => api(`/api/v1/admin/users/${id}/role`, { method: "PATCH", body: JSON.stringify({ role }) }),
  setPremium: (id, body) => api(`/api/v1/admin/users/${id}/premium`, { method: "PATCH", body: JSON.stringify(body) }),
  resetPassword: (id) => api(`/api/v1/admin/users/${id}/reset-password`, { method: "POST", body: "{}" }),
  resendVerification: (id) => api(`/api/v1/admin/users/${id}/resend-verification`, { method: "POST", body: "{}" }),
  changeEmail: (id, email) => api(`/api/v1/admin/users/${id}/email`, { method: "PATCH", body: JSON.stringify({ email }) }),
  forceVerify: (id) => api(`/api/v1/admin/users/${id}/verify`, { method: "PATCH", body: "{}" }),
  revokeSessions: (id) => api(`/api/v1/admin/users/${id}/revoke-sessions`, { method: "POST", body: "{}" }),
  deleteAccount: (id) => api(`/api/v1/admin/users/${id}/delete`, { method: "POST", body: "{}" }),
  userSubmissions: (id) => api(`/api/v1/admin/users/${id}/submissions`),
  userSubmission: (id, submissionId) => api(`/api/v1/admin/users/${id}/submissions/${submissionId}`),
  payments: (params = {}) => {
    const query = new URLSearchParams(
      Object.entries(params).filter(([, value]) => value != null && value !== ""),
    ).toString();
    return api(`/api/v1/admin/payments${query ? `?${query}` : ""}`);
  },
  billingSession: (sessionId) => api(`/api/v1/admin/billing/sessions/${encodeURIComponent(sessionId)}`),
  refreshPayment: (id) => api(`/api/v1/admin/payments/${id}/refresh`, { method: "POST", body: "{}" }),
  refundPayment: (id) => api(`/api/v1/admin/payments/${id}/refund`, { method: "POST", body: "{}" }),
  audit: () => api("/api/v1/admin/audit"),
  sheets: () => api("/api/v1/admin/sheets"),
  sheet: (id) => api(`/api/v1/admin/sheets/${id}`),
  createSheet: (body) => api("/api/v1/admin/sheets", { method: "POST", body: JSON.stringify(body) }),
  updateSheet: (id, body) => api(`/api/v1/admin/sheets/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  deleteSheet: (id) => api(`/api/v1/admin/sheets/${id}`, { method: "DELETE" }),
  publishSheet: (id, published) => api(`/api/v1/admin/sheets/${id}/publish`, { method: "PATCH", body: JSON.stringify({ published }) }),
  assessmentSets: () => api("/api/v1/admin/assessment-sets"),
  assessmentSet: (id) => api(`/api/v1/admin/assessment-sets/${id}`),
  createAssessmentSet: (body) => api("/api/v1/admin/assessment-sets", { method: "POST", body: JSON.stringify(body) }),
  updateAssessmentSet: (id, body) => api(`/api/v1/admin/assessment-sets/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  deleteAssessmentSet: (id) => api(`/api/v1/admin/assessment-sets/${id}`, { method: "DELETE" }),
  publishAssessmentSet: (id, published) => api(`/api/v1/admin/assessment-sets/${id}/publish`, { method: "PATCH", body: JSON.stringify({ published }) }),
};
