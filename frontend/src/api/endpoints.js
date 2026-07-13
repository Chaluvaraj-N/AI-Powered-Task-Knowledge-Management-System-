import api from "./client";

// ---- Auth ----
export const login = (email, password) => {
  const formData = new URLSearchParams();
  formData.append("username", email);
  formData.append("password", password);

  return api.post("/auth/login", formData, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });
};

export const register = (full_name, email, password) =>
  api.post("/auth/register", { full_name, email, password });

export const getMe = () => api.get("/auth/me");

// ---- Users ----
export const listUsers = () => api.get("/users/");
export const createUser = (payload) => api.post("/users/", payload);

// ---- Documents ----
export const listDocuments = () => api.get("/documents/");
export const uploadDocument = (file, onProgress) => {
  const formData = new FormData();
  formData.append("file", file);
  return api.post("/documents/", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: onProgress,
  });
};
export const deleteDocument = (id) => api.delete(`/documents/${id}`);

// ---- Tasks ----
export const listTasks = (params) => api.get("/tasks/", { params });
export const createTask = (payload) => api.post("/tasks/", payload);
export const updateTaskStatus = (id, status) =>
  api.patch(`/tasks/${id}/status`, { status });
export const deleteTask = (id) => api.delete(`/tasks/${id}`);

// ---- Search ----
export const semanticSearch = (query, top_k) =>
  api.post("/search/", { query, top_k });

// ---- Analytics ----
export const getAnalytics = () => api.get("/analytics/");

// ---- Activity Logs ----
export const getActivityLogs = () => api.get("/activity-logs/");
