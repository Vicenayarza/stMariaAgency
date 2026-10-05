import { prisma } from "../lib/prisma.js";

type MatchCreator = {
  id: string;
  username: string | null;
  displayName?: string | null;
  bio: string | null;
  location: string | null;
  followers: number;
  engagementRate: number;
  categories: string[];
  platforms: string[];
  isContacted?: boolean;
  isInvited?: boolean;
  user?: {
    name: string;
  };
  profiles?: Array<{
    id: string;
    platform: string;
    username: string;
    profileUrl: string | null;
    followers: number;
    engagementRate: number;
  }>;
};

type MatchResult = {
  source: "INTERNAL" | "EXTERNAL";

  creator: MatchCreator | null;

  externalCreator: MatchCreator | null;

  score: number;

  breakdown: {
    campaignFit: number;
    audienceQuality: number;
    trustScore: number;
    category: number;
    platform: number;
    engagement: number;
    risk: number;
  };

  risk: {
    score: number;
    level: string;
  };
};

/**
 * Normaliza texto para que diferencias como:
 *
 * Tecnología
 * tecnologia
 * TECNOLOGÍA
 *
 * se consideren equivalentes.
 */
function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

/**
 * Convierte una lista de plataformas de campaña
 * en plataformas individuales.
 *
 * Ejemplo:
 *
 * "Instagram + TikTok"
 *
 * =>
 *
 * ["instagram", "tiktok"]
 *
 * También soporta:
 *
 * "Instagram, TikTok"
 * "Instagram / TikTok"
 * "Instagram | TikTok"
 */
function parsePlatforms(value: string) {
  return value
    .split(/[+,/|;&]+/)
    .map((item) => normalizeText(item))
    .filter(Boolean);
}

function clamp(
  value: number,
  min = 0,
  max = 100
) {
  return Math.max(
    min,
    Math.min(max, value)
  );
}
function calculateCategoryMatch(
  campaignCategory: string,
  creatorCategories: string[]
) {
  const normalizedCategories =
    creatorCategories.map(normalizeText);

  if (!campaignCategory) {
    return 50;
  }

  return normalizedCategories.includes(
    campaignCategory
  )
    ? 100
    : 0;
}

function calculatePlatformMatch(
  campaignPlatforms: string[],
  creatorPlatforms: string[]
) {
  if (!campaignPlatforms.length) {
    return 50;
  }

  const normalizedCreatorPlatforms =
    creatorPlatforms.map(normalizeText);

  const matchingPlatforms =
    campaignPlatforms.filter((platform) =>
      normalizedCreatorPlatforms.includes(
        platform
      )
    );

  if (
    matchingPlatforms.length ===
    campaignPlatforms.length
  ) {
    return 100;
  }

  if (matchingPlatforms.length > 0) {
    return Math.round(
      (matchingPlatforms.length /
        campaignPlatforms.length) *
        100
    );
  }

  return 0;
}

function calculateEngagementMatch(
  engagementRate: number
) {
  if (engagementRate >= 8) {
    return 100;
  }

  if (engagementRate >= 6) {
    return 85;
  }

  if (engagementRate >= 4) {
    return 65;
  }

  if (engagementRate >= 2) {
    return 40;
  }

  return 20;
}

function calculateCampaignFit(
  categoryMatch: number,
  platformMatch: number,
  engagementMatch: number
) {
  return Math.round(
    categoryMatch * 0.5 +
      platformMatch * 0.3 +
      engagementMatch * 0.2
  );
}

function calculateFinalScore({
  campaignFit,
  audienceQuality,
  trustScore,
  categoryMatch,
  platformMatch,
  engagementMatch,
  riskMatch,
}: {
  campaignFit: number;
  audienceQuality: number;
  trustScore: number;
  categoryMatch: number;
  platformMatch: number;
  engagementMatch: number;
  riskMatch: number;
}) {
  return clamp(
    Math.round(
      campaignFit * 0.25 +
        audienceQuality * 0.2 +
        trustScore * 0.2 +
        categoryMatch * 0.15 +
        platformMatch * 0.1 +
        engagementMatch * 0.05 +
        riskMatch * 0.05
    )
  );
}

export async function getCampaignMatches(
  campaignId: string,
  brandId: string
): Promise<MatchResult[]> {

  /*
   * ==========================================
   * CAMPAÑA
   * ==========================================
   */

  const campaign =
    await prisma.campaign.findFirst({
      where: {
        id: campaignId,
        brandId,
      },
    });

  if (!campaign) {
    throw new Error(
      "CAMPAIGN_NOT_FOUND"
    );
  }

  /*
   * ==========================================
   * CREADORES
   * ==========================================
   */

  const creators =
    await prisma.creator.findMany({
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
      take: 200,
    });

  const externalCreators =
  await prisma.externalCreator.findMany({
    where: {
      provider: {
        active: true,
      },
    },

    include: {
      profiles: true,
      audienceMetrics: true,
      metrics: {
        orderBy: {
          recordedAt: "desc",
        },
        take: 10,
      },
      provider: true,
    },

    take: 200,
  });

  /*
   * ==========================================
   * SERVICIOS
   * ==========================================
   */

  const {
    calculateTrustScore,
  } = await import(
    "./trust-score.service.js"
  );

  const {
    calculateAudienceQuality,
  } = await import(
    "./audience-quality.service.js"
  );

  const {
    analyzeCreatorRisk,
  } = await import(
    "./creator-risk.service.js"
  );

  /*
   * ==========================================
   * DATOS DE CAMPAÑA
   * ==========================================
   */

  const campaignCategory =
    campaign.category
      ? normalizeText(campaign.category)
      : "";

  const campaignPlatforms =
    campaign.platform
      ? parsePlatforms(campaign.platform)
      : [];

  /*
   * ==========================================
   * SCORING
   * ==========================================
   */

  const scored =
    await Promise.all(
      creators.map(
        async (creator) => {

          /*
           * ======================================
           * 1. CATEGORY FIT — 15%
           * ======================================
           */

          const creatorCategories =
            creator.categories.map(
              (item) =>
                normalizeText(item)
            );

          const categoryMatch =
            campaignCategory &&
            creatorCategories.includes(
              campaignCategory
            )
              ? 100
              : campaignCategory
                ? 0
                : 50;

          /*
           * ======================================
           * 2. PLATFORM FIT — 10%
           * ======================================
           */

          const creatorPlatforms =
            creator.platforms.map(
              (item) =>
                normalizeText(item)
            );

          let platformMatch = 50;

          if (
            campaignPlatforms.length > 0
          ) {
            const matchingPlatforms =
              campaignPlatforms.filter(
                (platform) =>
                  creatorPlatforms.includes(
                    platform
                  )
              );

            if (
              matchingPlatforms.length ===
              campaignPlatforms.length
            ) {
              /*
               * El creador está presente
               * en todas las plataformas
               * requeridas.
               */
              platformMatch = 100;
            } else if (
              matchingPlatforms.length > 0
            ) {
              /*
               * El creador coincide con
               * algunas de las plataformas.
               */
              platformMatch = Math.round(
                (matchingPlatforms.length /
                  campaignPlatforms.length) *
                  100
              );
            } else {
              platformMatch = 0;
            }
          }

          /*
           * ======================================
           * 3. ENGAGEMENT — 5%
           * ======================================
           */

          let engagementMatch = 20;

          if (
            creator.engagementRate >= 8
          ) {
            engagementMatch = 100;
          } else if (
            creator.engagementRate >= 6
          ) {
            engagementMatch = 85;
          } else if (
            creator.engagementRate >= 4
          ) {
            engagementMatch = 65;
          } else if (
            creator.engagementRate >= 2
          ) {
            engagementMatch = 40;
          }

          /*
           * ======================================
           * 4. AUDIENCE QUALITY — 20%
           * ======================================
           */

          const audienceQuality =
            await calculateAudienceQuality(
              creator.id
            );

          /*
           * ======================================
           * 5. TRUST SCORE — 20%
           * ======================================
           */

          const trust =
            await calculateTrustScore(
              creator.id
            );

          /*
           * ======================================
           * 6. RISK — 5%
           * ======================================
           */

          const risk =
            await analyzeCreatorRisk(
              creator.id
            );

          /*
           * ======================================
           * RISK SCORE
           * ======================================
           *
           * Cuanto menor sea el riesgo,
           * mejor será el Match Score.
           */

          const riskMatch = clamp(
            100 - risk.riskScore
          );

          /*
           * ======================================
           * 7. CAMPAIGN FIT — 25%
           * ======================================
           *
           * En esta primera versión:
           *
           * - categoría
           * - plataforma
           * - engagement
           *
           * forman parte del encaje general
           * de campaña.
           *
           * Damos más peso al contexto de
           * campaña que al tamaño bruto.
           */

          const campaignFit =
            Math.round(
              categoryMatch * 0.50 +
                platformMatch * 0.30 +
                engagementMatch * 0.20
            );

          /*
           * ======================================
           * MATCH SCORE FINAL
           * ======================================
           *
           * Campaign Fit       25%
           * Audience Quality   20%
           * Trust Score        20%
           * Category Fit       15%
           * Platform Fit       10%
           * Engagement          5%
           * Risk                5%
           *
           * TOTAL              100%
           */

          const score =
            Math.round(
              campaignFit * 0.25 +
                audienceQuality.audienceQualityScore *
                  0.20 +
                trust.trustScore *
                  0.20 +
                categoryMatch *
                  0.15 +
                platformMatch *
                  0.10 +
                engagementMatch *
                  0.05 +
                riskMatch *
                  0.05
            );

          return {
            source: "INTERNAL" as const,
            creator,
            externalCreator: null,
            score: clamp(score),

            breakdown: {
              campaignFit,
              audienceQuality:
                audienceQuality.audienceQualityScore,
              trustScore:
                trust.trustScore,
              category:
                Math.round(
                  categoryMatch
                ),
              platform:
                Math.round(
                  platformMatch
                ),
              engagement:
                Math.round(
                  engagementMatch
                ),
              risk:
                Math.round(
                  riskMatch
                ),
            },

            risk: {
              score:
                risk.riskScore,
              level:
                risk.riskLevel,
            },
          };
        }
      )
    );
/*
 * ==========================================
 * EXTERNAL CREATOR SCORING
 * ==========================================
 */

const externalScored: MatchResult[] =
  externalCreators.map(
    (externalCreator) => {
      const creatorPlatforms =
        externalCreator.profiles.map(
          (profile) =>
            normalizeText(
              profile.platform
            )
        );

      /*
       * CATEGORY
       */
      const categoryMatch =
        calculateCategoryMatch(
          campaignCategory,
          externalCreator.categories
        );

      /*
       * PLATFORM
       */
      const platformMatch =
        calculatePlatformMatch(
          campaignPlatforms,
          creatorPlatforms
        );

      /*
       * ENGAGEMENT
       */
      const engagementMatch =
        calculateEngagementMatch(
          externalCreator.engagementRate
        );

      /*
       * CAMPAIGN FIT
       */
      const campaignFit =
        calculateCampaignFit(
          categoryMatch,
          platformMatch,
          engagementMatch
        );

      /*
       * ======================================
       * EXTERNAL AUDIENCE QUALITY
       * ======================================
       *
       * Todavía no tenemos el mismo sistema
       * de verificación que para Creator.
       *
       * Usamos una puntuación provisional
       * basada en la existencia de datos
       * proporcionados por el provider.
       */

      let audienceQuality = 40;

      if (
        externalCreator.audienceMetrics
          .length > 0
      ) {
        audienceQuality = 70;
      }

      if (
        externalCreator.audienceMetrics
          .length >= 3
      ) {
        audienceQuality = 80;
      }

      /*
       * ======================================
       * EXTERNAL TRUST
       * ======================================
       *
       * No debemos utilizar el Trust Score
       * interno porque este creador todavía
       * no pertenece a ST.MARY AGENCY 
       *
       * Es una estimación provisional.
       */

      let trustScore = 50;

      if (
        externalCreator.profiles.length >
        0
      ) {
        trustScore += 10;
      }

      if (
        externalCreator.metrics.length >
        0
      ) {
        trustScore += 10;
      }

      if (
        externalCreator.audienceMetrics
          .length > 0
      ) {
        trustScore += 10;
      }

      trustScore = clamp(trustScore);

      /*
       * ======================================
       * EXTERNAL RISK
       * ======================================
       *
       * Hasta tener histórico suficiente,
       * lo tratamos como riesgo desconocido/
       * moderado, no como fraude.
       */

      let riskScore = 35;

      if (
        externalCreator.metrics.length >=
        2
      ) {
        riskScore = 25;
      }

      const riskMatch = clamp(
        100 - riskScore
      );

      const riskLevel =
        riskScore >= 50
          ? "HIGH"
          : riskScore >= 20
            ? "MEDIUM"
            : "LOW";

      /*
       * FINAL SCORE
       */

      const score =
        calculateFinalScore({
          campaignFit,
          audienceQuality,
          trustScore,
          categoryMatch,
          platformMatch,
          engagementMatch,
          riskMatch,
        });

      return {
        source: "EXTERNAL",

        creator: null,

        externalCreator: {
          id: externalCreator.id,

          username:
            externalCreator.username,

          displayName:
            externalCreator.displayName,

          bio:
            externalCreator.bio,

          location:
            externalCreator.location,

          followers:
            externalCreator.followers,

          engagementRate:
            externalCreator.engagementRate,

          categories:
            externalCreator.categories,

          platforms:
            externalCreator.profiles.map(
              (profile) =>
                String(
                  profile.platform
                )
            ),
            isContacted:
              externalCreator.isContacted,
            isInvited:
              externalCreator.isInvited,

          profiles:
            externalCreator.profiles.map(
              (profile) => ({
                id: profile.id,

                platform:
                  String(
                    profile.platform
                  ),

                username:
                  profile.username,

                profileUrl:
                  profile.profileUrl,

                followers:
                  profile.followers,

                engagementRate:
                  profile.engagementRate,
              })
            ),
        },

        score,

        breakdown: {
          campaignFit,

          audienceQuality,

          trustScore,

          category:
            Math.round(
              categoryMatch
            ),

          platform:
            Math.round(
              platformMatch
            ),

          engagement:
            Math.round(
              engagementMatch
            ),

          risk:
            Math.round(
              riskMatch
            ),
        },

        risk: {
          score: riskScore,
          level: riskLevel,
        },
      };
    }
  );
  /*
   * ==========================================
   * RESULTADO
   * ==========================================
   */

  const combined: MatchResult[] = [
  ...scored.map((match) => ({
    ...match,
    source: "INTERNAL" as const,
    externalCreator: null,
  })),

  ...externalScored,
];

/*
 * ==========================================
 * RANKING FINAL
 * ==========================================
 */

const ranking = combined
  .sort(
    (a, b) =>
      b.score - a.score
  )
  .slice(0, 20);

/*
 * ==========================================
 * PERSIST CREATOR MATCHES
 * ==========================================
 *
 * Guardamos el resultado del Matching Engine
 * para poder:
 *
 * - crear shortlists
 * - rechazar candidatos
 * - conservar scores
 * - auditar recomendaciones
 * - mostrar resultados sin recalcular todo
 */

await Promise.all(
  ranking.map(async (match) => {
    const creatorId =
      match.source === "INTERNAL"
        ? match.creator?.id
        : null;

    const externalCreatorId =
      match.source === "EXTERNAL"
        ? match.externalCreator?.id
        : null;

    /*
     * Nunca deberíamos llegar aquí sin
     * ningún creador asociado.
     */
    if (
      !creatorId &&
      !externalCreatorId
    ) {
      return;
    }

    const data = {
      score:
        match.score,

      campaignFit:
        match.breakdown.campaignFit,

      /*
       * Por ahora utilizamos Audience Quality
       * como aproximación de audienceFit.
       *
       * Más adelante audienceFit tendrá en
       * cuenta país, edad, género, intereses...
       */
      audienceFit:
        match.breakdown.audienceQuality,

      categoryFit:
        match.breakdown.category,

      platformFit:
        match.breakdown.platform,

      /*
       * Todavía no forman parte del scoring
       * actual.
       */
      formatFit: 0,
      locationFit: 0,
      demographicFit: 0,
      interestFit: 0,

      engagementScore:
        match.breakdown.engagement,

      audienceQuality:
        match.breakdown.audienceQuality,

      trustScore:
        match.breakdown.trustScore,

      riskScore:
        match.risk.score,

      explanation: {
        source:
          match.source,

        positive: [
          match.breakdown.category >= 80
            ? "Coincide con la categoría de la campaña"
            : null,

          match.breakdown.platform >= 80
            ? "Coincide con las plataformas requeridas"
            : null,

          match.breakdown.engagement >= 80
            ? "Buen nivel de engagement"
            : null,

          match.breakdown.audienceQuality >= 70
            ? "Buena calidad de audiencia"
            : null,
        ].filter(Boolean),

        negative: [
          match.breakdown.category < 50
            ? "Baja coincidencia de categoría"
            : null,

          match.breakdown.platform < 50
            ? "Baja coincidencia de plataforma"
            : null,

          match.risk.score >= 50
            ? "Presenta señales de riesgo elevadas"
            : null,
        ].filter(Boolean),
      },

      calculatedAt:
        new Date(),
    };

    /*
     * ======================================
     * INTERNAL CREATOR
     * ======================================
     */

    if (creatorId) {
      const existing =
        await prisma.creatorMatch.findFirst({
          where: {
            campaignId,
            creatorId,
          },
          select: {
            id: true,
            status: true,
          },
        });

      if (existing) {
        await prisma.creatorMatch.update({
          where: {
            id: existing.id,
          },

          data: {
            ...data,

            /*
             * IMPORTANTE:
             *
             * No reseteamos SHORTLISTED,
             * REJECTED o SELECTED cuando
             * recalculamos el matching.
             */
            status:
              existing.status,
          },
        });
      } else {
        await prisma.creatorMatch.create({
          data: {
            campaignId,
            creatorId,
            status: "RECOMMENDED",
            ...data,
          },
        });
      }

      return;
    }

    /*
     * ======================================
     * EXTERNAL CREATOR
     * ======================================
     */

    if (externalCreatorId) {
      const existing =
        await prisma.creatorMatch.findFirst({
          where: {
            campaignId,
            externalCreatorId,
          },
          select: {
            id: true,
            status: true,
          },
        });

      if (existing) {
        await prisma.creatorMatch.update({
          where: {
            id: existing.id,
          },

          data: {
            ...data,
            status:
              existing.status,
          },
        });
      } else {
        await prisma.creatorMatch.create({
          data: {
            campaignId,
            externalCreatorId,
            status: "RECOMMENDED",
            ...data,
          },
        });
      }
    }
  })
);

const persistedMatches =
  await prisma.creatorMatch.findMany({
    where: {
      campaignId,

      OR: [
        {
          creatorId: {
            in: ranking
              .filter(
                (match) =>
                  match.source ===
                    "INTERNAL" &&
                  match.creator?.id
              )
              .map(
                (match) =>
                  match.creator!.id
              ),
          },
        },

        {
          externalCreatorId: {
            in: ranking
              .filter(
                (match) =>
                  match.source ===
                    "EXTERNAL" &&
                  match.externalCreator?.id
              )
              .map(
                (match) =>
                  match.externalCreator!.id
              ),
          },
        },
      ],
    },

    select: {
      id: true,
      creatorId: true,
      externalCreatorId: true,
      status: true,
    },
  });

return ranking.map((match) => {
  const persisted =
    persistedMatches.find(
      (item) =>
        item.creatorId ===
          match.creator?.id ||
        item.externalCreatorId ===
          match.externalCreator?.id
    );

  return {
    ...match,

    matchId:
      persisted?.id ?? null,

    matchStatus:
      persisted?.status ??
      "RECOMMENDED",
  };
});
}