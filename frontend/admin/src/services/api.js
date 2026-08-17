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
  questions: () => api("/api/v1/admin/questions"),
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
  setUserStatus: (id, status) => api(`/api/v1/admin/users/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
};
