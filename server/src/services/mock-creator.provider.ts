import type {
  CreatorDiscoveryFilters,
  CreatorProviderService,
  ExternalCreatorResult,
} from "./creator-provider.service.js";

const creators: ExternalCreatorResult[] = [
  {
    externalId: "mock-david-fitness",
    username: "davidfitness",
    displayName: "David Fitness",
    bio: "Fitness, tecnología y lifestyle",
    location: "Madrid, España",
    country: "España",
    province: "Madrid",
    categories: ["Fitness", "Lifestyle", "Tecnologia"],
    interests: ["Fitness", "Tecnologia", "Salud"],
    followers: 125000,
    engagementRate: 6.8,
    profileUrl: "https://instagram.com/davidfitness",

    profiles: [
      {
        platform: "INSTAGRAM",
        username: "davidfitness",
        profileUrl: "https://instagram.com/davidfitness",
        followers: 125000,
        engagementRate: 6.8,
      },
      {
        platform: "TIKTOK",
        username: "davidfitness",
        profileUrl: "https://tiktok.com/@davidfitness",
        followers: 210000,
        engagementRate: 8.1,
      },
    ],

    audience: [
      {
        metricType: "AGE_18_24",
        value: "18-24",
        percentage: 32,
      },
      {
        metricType: "AGE_25_34",
        value: "25-34",
        percentage: 41,
      },
      {
        metricType: "GENDER_MALE",
        value: "MALE",
        percentage: 68,
      },
      {
        metricType: "COUNTRY",
        value: "ES",
        percentage: 84,
      },
    ],
  },

  {
    externalId: "mock-marta-tech",
    username: "martatech",
    displayName: "Marta Tech",
    bio: "Tecnología, gadgets y vida digital",
    location: "Barcelona, España",
    country: "España",
    province: "Barcelona",
    categories: ["Tecnologia", "Lifestyle"],
    interests: ["Tecnologia", "Gadgets", "IA"],
    followers: 86000,
    engagementRate: 7.4,
    profileUrl: "https://instagram.com/martatech",

    profiles: [
      {
        platform: "INSTAGRAM",
        username: "martatech",
        profileUrl: "https://instagram.com/martatech",
        followers: 86000,
        engagementRate: 7.4,
      },
      {
        platform: "TIKTOK",
        username: "martatech",
        profileUrl: "https://tiktok.com/@martatech",
        followers: 145000,
        engagementRate: 9.2,
      },
    ],

    audience: [
      {
        metricType: "AGE_18_24",
        value: "18-24",
        percentage: 37,
      },
      {
        metricType: "AGE_25_34",
        value: "25-34",
        percentage: 44,
      },
      {
        metricType: "GENDER_FEMALE",
        value: "FEMALE",
        percentage: 72,
      },
      {
        metricType: "COUNTRY",
        value: "ES",
        percentage: 91,
      },
    ],
  },

  {
    externalId: "mock-carlos-gaming",
    username: "carlosgaming",
    displayName: "Carlos Gaming",
    bio: "Gaming, streaming y entretenimiento",
    location: "Bilbao, España",
    country: "España",
    province: "Bizkaia",
    categories: ["Gaming", "Entretenimiento"],
    interests: ["Gaming", "Tecnologia", "Streaming"],
    followers: 320000,
    engagementRate: 5.9,
    profileUrl: "https://twitch.tv/carlosgaming",

    profiles: [
      {
        platform: "TIKTOK",
        username: "carlosgaming",
        profileUrl: "https://tiktok.com/@carlosgaming",
        followers: 180000,
        engagementRate: 6.2,
      },
      {
        platform: "YOUTUBE",
        username: "carlosgaming",
        profileUrl: "https://youtube.com/@carlosgaming",
        followers: 320000,
        engagementRate: 5.9,
      },
    ],

    audience: [
      {
        metricType: "AGE_18_24",
        value: "18-24",
        percentage: 48,
      },
      {
        metricType: "AGE_25_34",
        value: "25-34",
        percentage: 36,
      },
      {
        metricType: "GENDER_MALE",
        value: "MALE",
        percentage: 79,
      },
      {
        metricType: "COUNTRY",
        value: "ES",
        percentage: 76,
      },
    ],
  },

  {
    externalId: "mock-laura-lifestyle",
    username: "lauralifestyle",
    displayName: "Laura Lifestyle",
    bio: "Lifestyle, moda, belleza y viajes",
    location: "Madrid, España",
    country: "España",
    province: "Madrid",
    categories: ["Lifestyle", "Moda", "Belleza"],
    interests: ["Moda", "Belleza", "Viajes"],
    followers: 54000,
    engagementRate: 9.1,
    profileUrl: "https://instagram.com/lauralifestyle",

    profiles: [
      {
        platform: "INSTAGRAM",
        username: "lauralifestyle",
        profileUrl: "https://instagram.com/lauralifestyle",
        followers: 54000,
        engagementRate: 9.1,
      },
      {
        platform: "TIKTOK",
        username: "lauralifestyle",
        profileUrl: "https://tiktok.com/@lauralifestyle",
        followers: 92000,
        engagementRate: 10.4,
      },
    ],

    audience: [
      {
        metricType: "AGE_18_24",
        value: "18-24",
        percentage: 35,
      },
      {
        metricType: "AGE_25_34",
        value: "25-34",
        percentage: 46,
      },
      {
        metricType: "GENDER_FEMALE",
        value: "FEMALE",
        percentage: 81,
      },
      {
        metricType: "COUNTRY",
        value: "ES",
        percentage: 89,
      },
    ],
  },

  {
    externalId: "mock-iker-tech",
    username: "ikertech",
    displayName: "Iker Tech",
    bio: "Tecnología, programación y ciberseguridad",
    location: "Bilbao, España",
    country: "España",
    province: "Bizkaia",
    categories: ["Tecnologia", "Educacion"],
    interests: ["Programacion", "Ciberseguridad", "IA"],
    followers: 43000,
    engagementRate: 8.7,
    profileUrl: "https://instagram.com/ikertech",

    profiles: [
      {
        platform: "INSTAGRAM",
        username: "ikertech",
        profileUrl: "https://instagram.com/ikertech",
        followers: 43000,
        engagementRate: 8.7,
      },
      {
        platform: "YOUTUBE",
        username: "ikertech",
        profileUrl: "https://youtube.com/@ikertech",
        followers: 68000,
        engagementRate: 7.8,
      },
    ],

    audience: [
      {
        metricType: "AGE_18_24",
        value: "18-24",
        percentage: 29,
      },
      {
        metricType: "AGE_25_34",
        value: "25-34",
        percentage: 52,
      },
      {
        metricType: "GENDER_MALE",
        value: "MALE",
        percentage: 74,
      },
      {
        metricType: "COUNTRY",
        value: "ES",
        percentage: 87,
      },
    ],
  },
];

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function matchesArray(
  creatorValues: string[],
  requestedValues?: string[]
): boolean {
  if (!requestedValues?.length) {
    return true;
  }

  const normalizedCreatorValues =
    creatorValues.map(normalize);

  return requestedValues.some((value) =>
    normalizedCreatorValues.includes(normalize(value))
  );
}

export class MockCreatorProvider
  implements CreatorProviderService
{
  async searchCreators(
    filters: CreatorDiscoveryFilters
  ): Promise<ExternalCreatorResult[]> {
    let results = [...creators];

    if (filters.platforms?.length) {
      results = results.filter((creator) =>
        creator.profiles?.some((profile) =>
          filters.platforms!.some(
            (platform) =>
              normalize(profile.platform) ===
              normalize(platform)
          )
        )
      );
    }

    if (filters.categories?.length) {
      results = results.filter((creator) =>
        matchesArray(
          creator.categories,
          filters.categories
        )
      );
    }

    if (filters.interests?.length) {
      results = results.filter((creator) =>
        matchesArray(
          creator.interests,
          filters.interests
        )
      );
    }

    if (filters.countries?.length) {
      results = results.filter(
        (creator) =>
          creator.country &&
          filters.countries!.some(
            (country) =>
              normalize(country) ===
              normalize(creator.country!)
          )
      );
    }

    if (filters.provinces?.length) {
      results = results.filter(
        (creator) =>
          creator.province &&
          filters.provinces!.some(
            (province) =>
              normalize(province) ===
              normalize(creator.province!)
          )
      );
    }

    if (filters.gender) {
      const normalizedGender =
        normalize(filters.gender);

      results = results.filter((creator) =>
        creator.audience?.some(
          (item) =>
            item.metricType ===
            `GENDER_${normalizedGender.toUpperCase()}`
        )
      );
    }

    if (
      filters.minFollowers !== undefined
    ) {
      results = results.filter(
        (creator) =>
          creator.followers >=
          filters.minFollowers!
      );
    }

    if (
      filters.maxFollowers !== undefined
    ) {
      results = results.filter(
        (creator) =>
          creator.followers <=
          filters.maxFollowers!
      );
    }

    if (
      filters.minEngagementRate !== undefined
    ) {
      results = results.filter(
        (creator) =>
          creator.engagementRate >=
          filters.minEngagementRate!
      );
    }

    return results.slice(
      0,
      filters.limit ?? 50
    );
  }
}

export const mockCreatorProvider =
  new MockCreatorProvider();