const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:4000").replace(/\/$/, "");
const requests = new Map();

export function connectInstagram() {
  window.location.assign(`${API_URL}/api/social/instagram/connect`);
}

export function getInstagramCalculatorResult(resultId) {
  if (!/^[a-f0-9]{64}$/.test(resultId)) {
    return Promise.reject(new Error("INVALID_RESULT_ID"));
  }
  // Avoid duplicate consumption of a one-use result in React Strict Mode.
  if (!requests.has(resultId)) {
    requests.set(resultId, (async () => {
      const response = await fetch(`${API_URL}/api/social/instagram/result/${resultId}`, {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });
      if (!response.ok) throw new Error("RESULT_NOT_AVAILABLE");
      const data = await response.json();
      return data.result;
    })());
  }
  return requests.get(resultId);
}
