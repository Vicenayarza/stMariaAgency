import { prisma } from "../lib/prisma.js";

type MatchResult = {
  creator: {
    id: string;
    username: string;
    bio: string | null;
    location: string | null;
    followers: number;
    engagementRate: number;
    categories: string[];
    platforms: string[];
    user: {
      name: string;
    };
  };

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
            creator,
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
   * RESULTADO
   * ==========================================
   */

  return scored
    .sort(
      (a, b) =>
        b.score - a.score
    )
    .slice(0, 20);
}