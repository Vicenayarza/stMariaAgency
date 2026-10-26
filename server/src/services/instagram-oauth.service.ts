
const INSTAGRAM_TOKEN_URL =
  "https://api.instagram.com/oauth/access_token";

export interface InstagramTokenResponse {
  access_token: string;
  user_id: number;
  permissions?: string;
}

export async function exchangeInstagramCode(
  code: string
): Promise<InstagramTokenResponse> {
  const appId = process.env.INSTAGRAM_APP_ID;
  const appSecret = process.env.INSTAGRAM_APP_SECRET;
  const redirectUri = process.env.INSTAGRAM_REDIRECT_URI;

  if (!appId || !appSecret || !redirectUri) {
    throw new Error("INSTAGRAM_NOT_CONFIGURED");
  }

  if (!code) {
    throw new Error("INSTAGRAM_CODE_MISSING");
  }

  const body = new URLSearchParams({
    client_id: appId,
    client_secret: appSecret,
    grant_type: "authorization_code",
    redirect_uri: redirectUri,
    code,
  });

  const response = await fetch(INSTAGRAM_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type":
        "application/x-www-form-urlencoded",
    },
    body,
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    throw new Error(
      `INSTAGRAM_TOKEN_EXCHANGE_FAILED_${response.status}`
    );
  }

  const data: unknown = await response.json();

  if (
    typeof data !== "object" ||
    data === null ||
    !("access_token" in data) ||
    typeof data.access_token !== "string" ||
    !("user_id" in data) ||
    (typeof data.user_id !== "number" &&
      typeof data.user_id !== "string")
  ) {
    throw new Error("INSTAGRAM_INVALID_TOKEN_RESPONSE");
  }

  return {
    access_token: data.access_token,
    user_id: Number(data.user_id),
  };
}
