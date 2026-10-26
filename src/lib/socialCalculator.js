const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:4000"
)
  .replace(/\/+$/, "")
  .replace(/\/api$/, "");

const INSTAGRAM_API_URL = `${API_URL}/api/social/instagram`;

const requests = new Map();

export function getInstagramStatus() {
  return fetch(`${INSTAGRAM_API_URL}/status`, {
    method: "GET",
    cache: "no-store",
  }).then(async (response) => {
    if (!response.ok) {
      throw new Error("INSTAGRAM_STATUS_ERROR");
    }

    return response.json();
  });
}

export function connectInstagram() {
  window.location.assign(`${INSTAGRAM_API_URL}/connect`);
}

export function getInstagramCalculatorResult(resultId) {
  if (!/^[a-f0-9]{64}$/.test(resultId)) {
    return Promise.reject(new Error("INVALID_RESULT_ID"));
  }

  // Evitar consumir dos veces un resultado de un solo uso.
  if (!requests.has(resultId)) {
    requests.set(
      resultId,
      (async () => {
        const response = await fetch(
          `${INSTAGRAM_API_URL}/result/${resultId}`,
          {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error("RESULT_NOT_AVAILABLE");
        }

        const data = await response.json();

        return data.result;
      })()
    );
  }

  return requests.get(resultId);
}