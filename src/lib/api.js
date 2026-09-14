const API_URL = "http://localhost:4000/api";

async function request(path, options = {}) {
  // Evitamos duplicar /api cuando una llamada ya lo incluye.
  const normalizedPath = path.startsWith("/api/")
    ? path.substring(4)
    : path;

  const response = await fetch(`${API_URL}${normalizedPath}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(
      data?.message ||
        data?.error ||
        `Error ${response.status}`
    );

    error.status = response.status;
    error.data = data;

    throw error;
  }

  return data;
}

/*
 * API utilizada por AuthContext y otras partes antiguas
 */
export async function apiFetch(path, options = {}) {
  return request(path, options);
}

/*
 * API utilizada por las nuevas páginas
 */
export const api = {
  get(path) {
    return request(path, {
      method: "GET",
    });
  },

  post(path, body) {
    return request(path, {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  patch(path, body) {
    return request(path, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
  },

  put(path, body) {
    return request(path, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  },

  delete(path) {
    return request(path, {
      method: "DELETE",
    });
  },
};