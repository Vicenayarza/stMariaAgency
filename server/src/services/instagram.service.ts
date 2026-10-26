
const INSTAGRAM_API_URL = "https://graph.instagram.com";

interface InstagramProfile {
  id: string;
  username: string;
  account_type?: string;
  followers_count?: number;
  media_count?: number;
  profile_picture_url?: string;
}

interface InstagramMedia {
  id: string;
  media_type?: string;
  timestamp?: string;
  like_count?: number;
  comments_count?: number;
}

interface InstagramMediaResponse {
  data: InstagramMedia[];
}

interface InstagramEngagementResult {
  platform: "INSTAGRAM";
  profile: {
    id: string;
    username: string;
    followers: number;
    posts: number;
    accountType: string;
    profilePictureUrl: string | null;
  };
  metrics: {
    analyzedPosts: number;
    averageLikes: number;
    averageComments: number;
    engagementRate: number | null;
  };
}

async function instagramGet<T>(
  path: string,
  accessToken: string,
  params: Record<string, string>
): Promise<T> {
  const url = new URL(path, INSTAGRAM_API_URL);

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    throw new Error(
      `INSTAGRAM_API_ERROR_${response.status}`
    );
  }

  return (await response.json()) as T;
}

async function getInstagramProfile(
  accessToken: string
): Promise<InstagramProfile> {
  return instagramGet<InstagramProfile>(
    "/me",
    accessToken,
    {
      fields: [
        "id",
        "username",
        "account_type",
        "followers_count",
        "media_count",
        "profile_picture_url",
      ].join(","),
    }
  );
}

async function getInstagramRecentMedia(
  accessToken: string
): Promise<InstagramMedia[]> {
  const response = await instagramGet<InstagramMediaResponse>(
    "/me/media",
    accessToken,
    {
      fields: [
        "id",
        "media_type",
        "timestamp",
        "like_count",
        "comments_count",
      ].join(","),
      limit: "12",
    }
  );

  return Array.isArray(response.data)
    ? response.data
    : [];
}

function round(value: number, decimals = 2): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

export async function calculateInstagramEngagement(
  accessToken: string
): Promise<InstagramEngagementResult> {
  const profile = await getInstagramProfile(accessToken);

  const media = await getInstagramRecentMedia(accessToken);

  const validMedia = media.filter(
    (post) =>
      typeof post.like_count === "number" &&
      Number.isFinite(post.like_count) &&
      typeof post.comments_count === "number" &&
      Number.isFinite(post.comments_count)
  );

  const analyzedPosts = validMedia.length;

  const totalLikes = validMedia.reduce(
    (sum, post) => sum + post.like_count!,
    0
  );

  const totalComments = validMedia.reduce(
    (sum, post) => sum + post.comments_count!,
    0
  );

  const averageLikes =
    analyzedPosts > 0 ? totalLikes / analyzedPosts : 0;

  const averageComments =
    analyzedPosts > 0 ? totalComments / analyzedPosts : 0;

  const followers = profile.followers_count;

  const engagementRate =
    analyzedPosts > 0 &&
    typeof followers === "number" &&
    followers > 0
      ? round(
          ((averageLikes + averageComments) / followers) *
            100
        )
      : null;

  return {
    platform: "INSTAGRAM",
    profile: {
      id: profile.id,
      username: profile.username,
      followers:
        typeof followers === "number" ? followers : 0,
      posts: profile.media_count ?? 0,
      accountType: profile.account_type ?? "UNKNOWN",
      profilePictureUrl:
        profile.profile_picture_url ?? null,
    },
    metrics: {
      analyzedPosts,
      averageLikes: round(averageLikes),
      averageComments: round(averageComments),
      engagementRate,
    },
  };
}
