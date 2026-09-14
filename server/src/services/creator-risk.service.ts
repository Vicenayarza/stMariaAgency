import { prisma } from "../lib/prisma.js";

export type RiskLevel =
  | "LOW"
  | "MEDIUM"
  | "HIGH";

export type RiskFlag = {
  type: string;
  level: RiskLevel;
  title: string;
  description: string;
  value?: number;
};

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function getEngagementRisk(
  followers: number,
  engagementRate: number
): RiskFlag | null {
  if (followers < 1000) {
    return null;
  }

  if (followers >= 100000 && engagementRate < 1) {
    return {
      type: "LOW_ENGAGEMENT",
      level: "HIGH",
      title: "Engagement muy bajo",
      description:
        "La cuenta tiene una audiencia elevada pero presenta un nivel de interacción especialmente bajo.",
      value: engagementRate,
    };
  }

  if (followers >= 50000 && engagementRate < 1.5) {
    return {
      type: "LOW_ENGAGEMENT",
      level: "MEDIUM",
      title: "Engagement bajo",
      description:
        "El engagement está por debajo de lo esperado para una audiencia de este tamaño.",
      value: engagementRate,
    };
  }

  if (followers >= 10000 && engagementRate < 2) {
    return {
      type: "LOW_ENGAGEMENT",
      level: "MEDIUM",
      title: "Engagement mejorable",
      description:
        "La interacción con la audiencia es relativamente baja.",
      value: engagementRate,
    };
  }

  return null;
}

function getGrowthRisk(
  previousFollowers: number,
  currentFollowers: number
): RiskFlag | null {
  if (previousFollowers <= 0) {
    return null;
  }

  const growth =
    ((currentFollowers - previousFollowers) /
      previousFollowers) *
    100;

  if (growth >= 50) {
    return {
      type: "ABNORMAL_GROWTH",
      level: "HIGH",
      title: "Crecimiento inusual",
      description:
        "La audiencia ha aumentado más de un 50% desde la medición anterior. Conviene revisar el origen de este crecimiento.",
      value: growth,
    };
  }

  if (growth >= 25) {
    return {
      type: "ABNORMAL_GROWTH",
      level: "MEDIUM",
      title: "Crecimiento elevado",
      description:
        "El crecimiento de audiencia es significativamente superior al habitual.",
      value: growth,
    };
  }

  if (growth <= -30) {
    return {
      type: "AUDIENCE_DROP",
      level: "HIGH",
      title: "Caída importante de audiencia",
      description:
        "La cuenta ha perdido más de un 30% de seguidores desde la medición anterior.",
      value: growth,
    };
  }

  if (growth <= -15) {
    return {
      type: "AUDIENCE_DROP",
      level: "MEDIUM",
      title: "Caída de audiencia",
      description:
        "Se ha detectado una reducción significativa del número de seguidores.",
      value: growth,
    };
  }

  return null;
}

function getEngagementConsistencyRisk(
  previousEngagement: number,
  currentEngagement: number
): RiskFlag | null {
  if (previousEngagement <= 0) {
    return null;
  }

  const variation =
    ((currentEngagement - previousEngagement) /
      previousEngagement) *
    100;

  if (variation >= 100) {
    return {
      type: "ENGAGEMENT_SPIKE",
      level: "HIGH",
      title: "Variación extrema del engagement",
      description:
        "El engagement se ha duplicado o más respecto a la medición anterior.",
      value: variation,
    };
  }

  if (variation <= -60) {
    return {
      type: "ENGAGEMENT_DROP",
      level: "MEDIUM",
      title: "Caída del engagement",
      description:
        "El engagement ha disminuido considerablemente respecto a la medición anterior.",
      value: variation,
    };
  }

  return null;
}

export async function analyzeCreatorRisk(
  creatorId: string
) {
  const creator = await prisma.creator.findUnique({
    where: {
      id: creatorId,
    },
    include: {
      socialAccounts: {
        include: {
          metrics: {
            where: {
              verificationStatus: "VERIFIED",
            },
            orderBy: {
              recordedAt: "asc",
            },
          },
        },
      },
    },
  });

  if (!creator) {
    throw new Error("CREATOR_NOT_FOUND");
  }

  const flags: RiskFlag[] = [];

  let verifiedMetricsCount = 0;

  for (const socialAccount of creator.socialAccounts) {
    const metrics = socialAccount.metrics;

    verifiedMetricsCount += metrics.length;

    if (metrics.length === 0) {
      continue;
    }

    const latest = metrics[metrics.length - 1];

    const engagementRisk = getEngagementRisk(
      latest.followers,
      latest.engagementRate
    );

    if (engagementRisk) {
      flags.push({
        ...engagementRisk,
        title: `${socialAccount.platform}: ${engagementRisk.title}`,
      });
    }

    if (metrics.length >= 2) {
      const previous =
        metrics[metrics.length - 2];

      const growthRisk = getGrowthRisk(
        previous.followers,
        latest.followers
      );

      if (growthRisk) {
        flags.push({
          ...growthRisk,
          title: `${socialAccount.platform}: ${growthRisk.title}`,
        });
      }

      const engagementConsistencyRisk =
        getEngagementConsistencyRisk(
          previous.engagementRate,
          latest.engagementRate
        );

      if (engagementConsistencyRisk) {
        flags.push({
          ...engagementConsistencyRisk,
          title: `${socialAccount.platform}: ${engagementConsistencyRisk.title}`,
        });
      }
    }
  }

  if (verifiedMetricsCount === 0) {
    flags.push({
      type: "NO_VERIFIED_METRICS",
      level: "MEDIUM",
      title: "Sin métricas verificadas",
      description:
        "No existen métricas verificadas suficientes para validar la audiencia del creador.",
    });
  }

  const highRiskFlags = flags.filter(
    (flag) => flag.level === "HIGH"
  ).length;

  const mediumRiskFlags = flags.filter(
    (flag) => flag.level === "MEDIUM"
  ).length;

  let riskScore = 0;

  riskScore += highRiskFlags * 30;
  riskScore += mediumRiskFlags * 12;

  riskScore = clamp(riskScore);

  let riskLevel: RiskLevel;

  if (riskScore >= 50) {
    riskLevel = "HIGH";
  } else if (riskScore >= 20) {
    riskLevel = "MEDIUM";
  } else {
    riskLevel = "LOW";
  }

  return {
    creatorId,

    riskScore,

    riskLevel,

    flags,

    verifiedMetricsCount,

    analyzedSocialAccounts:
      creator.socialAccounts.length,
  };
}