export interface CreatorDiscoveryFilters {
  platforms?: string[];
  categories?: string[];
  countries?: string[];
  provinces?: string[];
  gender?: string;
  minAge?: number;
  maxAge?: number;
  interests?: string[];
  minFollowers?: number;
  maxFollowers?: number;
  minEngagementRate?: number;
  limit?: number;
}

export interface ExternalCreatorResult {
  externalId: string;
  username: string;
  displayName?: string | null;
  bio?: string | null;
  location?: string | null;
  country?: string | null;
  province?: string | null;

  categories: string[];
  interests: string[];

  followers: number;
  engagementRate: number;

  profileUrl?: string | null;

  profiles?: Array<{
    platform: string;
    username: string;
    profileUrl?: string | null;
    followers?: number;
    engagementRate?: number;
  }>;

  audience?: Array<{
    metricType: string;
    value: string;
    percentage: number;
  }>;
}

export interface CreatorProviderService {
  searchCreators(
    filters: CreatorDiscoveryFilters
  ): Promise<ExternalCreatorResult[]>;
}