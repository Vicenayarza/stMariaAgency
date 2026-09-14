import { prisma } from "../lib/prisma.js";

function clamp(
  value: number,
  min = 0,
  max = 100
) {
  return Math.max(min, Math.min(max, value));
}

function normalizeRatio(
  value: number,
  target: number
) {
  if (target <= 0) {
    return 0;
  }

  return clamp((value / target) * 100);
}

export async function calculateAudienceQuality(
  creatorId: string
) {
  const creator =
    await prisma.creator.findUnique({
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

  const verifiedMetrics =
    creator.socialAccounts.flatMap(
      (socialAccount) =>
        socialAccount.metrics.map((metric) => ({
          ...metric,
          platform: socialAccount.platform,
          username: socialAccount.username,
        }))
    );

  if (verifiedMetrics.length === 0) {
    return {
      creatorId,
      audienceQualityScore: 0,
      breakdown: {
        engagementQuality: 0,
        viewEfficiency: 0,
        reachEfficiency: 0,
        interactionQuality: 0,
        consistency: 0,
      },
      metrics: {
        total: 0,
        verified: 0,
      },
    };
  }

  /*
   * Utilizamos la última métrica verificada
   * disponible de cada red social.
   */
  const latestByPlatform =
    creator.socialAccounts
      .map((socialAccount) => {
        const metrics =
          socialAccount.metrics;

        if (metrics.length === 0) {
          return null;
        }

        return {
          platform: socialAccount.platform,
          username: socialAccount.username,
          metric:
            metrics[metrics.length - 1],
          history: metrics,
        };
      })
      .filter(Boolean);

  /*
   * --------------------------------------------------
   * ENGAGEMENT QUALITY
   * --------------------------------------------------
   *
   * El engagement ya viene calculado en CreatorMetric.
   *
   * 2%  -> 50
   * 4%  -> 70
   * 6%  -> 85
   * 8%+ -> 100
   */
  const engagementScores =
    latestByPlatform.map((item) => {
      if (!item) {
        return 0;
      }

      const engagement =
        item.metric.engagementRate;

      if (engagement >= 8) {
        return 100;
      }

      if (engagement >= 6) {
        return 85;
      }

      if (engagement >= 4) {
        return 70;
      }

      if (engagement >= 2) {
        return 50;
      }

      return normalizeRatio(
        engagement,
        2
      );
    });

  const engagementQuality =
    engagementScores.length > 0
      ? engagementScores.reduce(
          (sum, value) => sum + value,
          0
        ) / engagementScores.length
      : 0;

  /*
   * --------------------------------------------------
   * VIEW EFFICIENCY
   * --------------------------------------------------
   *
   * views / followers
   *
   * 100% de views respecto a followers
   * representa una audiencia muy eficiente.
   */
  const viewEfficiencyScores =
    latestByPlatform.map((item) => {
      if (!item) {
        return 0;
      }

      const followers =
        item.metric.followers;

      if (
        followers <= 0 ||
        item.metric.views <= 0
      ) {
        return 0;
      }

      const ratio =
        item.metric.views / followers;

      return normalizeRatio(
        ratio,
        1
      );
    });

  const viewEfficiency =
    viewEfficiencyScores.length > 0
      ? viewEfficiencyScores.reduce(
          (sum, value) => sum + value,
          0
        ) / viewEfficiencyScores.length
      : 0;

  /*
   * --------------------------------------------------
   * REACH EFFICIENCY
   * --------------------------------------------------
   *
   * reach / followers
   *
   * 50% de reach sobre followers
   * se considera una referencia fuerte.
   */
  const reachEfficiencyScores =
    latestByPlatform.map((item) => {
      if (!item) {
        return 0;
      }

      const followers =
        item.metric.followers;

      const reach =
        item.metric.reach ?? 0;

      if (
        followers <= 0 ||
        reach <= 0
      ) {
        return 0;
      }

      const ratio =
        reach / followers;

      return normalizeRatio(
        ratio,
        0.5
      );
    });

  const reachEfficiency =
    reachEfficiencyScores.length > 0
      ? reachEfficiencyScores.reduce(
          (sum, value) => sum + value,
          0
        ) / reachEfficiencyScores.length
      : 0;

  /*
   * --------------------------------------------------
   * INTERACTION QUALITY
   * --------------------------------------------------
   *
   * Calculamos la relación entre:
   *
   * likes + comments
   * ----------------
   * followers
   *
   * Los comentarios tienen más peso porque
   * representan una interacción más profunda.
   */
  const interactionScores =
    latestByPlatform.map((item) => {
      if (!item) {
        return 0;
      }

      const followers =
        item.metric.followers;

      if (followers <= 0) {
        return 0;
      }

      const likes =
        item.metric.likes;

      const comments =
        item.metric.comments;

      const interactionRate =
        (likes +
          comments * 3) /
        followers;

      return normalizeRatio(
        interactionRate,
        0.05
      );
    });

  const interactionQuality =
    interactionScores.length > 0
      ? interactionScores.reduce(
          (sum, value) => sum + value,
          0
        ) / interactionScores.length
      : 0;

  /*
   * --------------------------------------------------
   * CONSISTENCY
   * --------------------------------------------------
   *
   * Si tenemos histórico podemos analizar
   * estabilidad de followers y engagement.
   */
  const consistencyScores: number[] =
  latestByPlatform.map((item): number => {
    if (!item) {
      return 0;
    }

    const history = item.history;

    if (history.length < 2) {
      return 60;
    }

    const engagementValues: number[] =
      history.map(
        (metric) =>
          metric.engagementRate
      );

    const average =
      engagementValues.reduce(
        (sum: number, value: number) =>
          sum + value,
        0
      ) /
      engagementValues.length;

    if (average <= 0) {
      return 0;
    }

    const variance =
      engagementValues.reduce(
        (sum: number, value: number) =>
          sum +
          Math.pow(
            value - average,
            2
          ),
        0
      ) /
      engagementValues.length;

    const standardDeviation =
      Math.sqrt(variance);

    const variation =
      standardDeviation /
      average;

    if (variation <= 0.1) {
      return 100;
    }

    if (variation <= 0.2) {
      return 90;
    }

    if (variation <= 0.35) {
      return 75;
    }

    if (variation <= 0.5) {
      return 60;
    }

    return 40;
  });

  const consistency =
    consistencyScores.length > 0
      ? consistencyScores.reduce(
          (sum, value) => sum + value,
          0
        ) / consistencyScores.length
      : 0;

  /*
   * --------------------------------------------------
   * FINAL SCORE
   * --------------------------------------------------
   */

  const audienceQualityScore =
    Math.round(
      engagementQuality * 0.30 +
        viewEfficiency * 0.20 +
        reachEfficiency * 0.15 +
        interactionQuality * 0.20 +
        consistency * 0.15
    );

  return {
    creatorId,

    audienceQualityScore: clamp(
      audienceQualityScore
    ),

    breakdown: {
      engagementQuality: Math.round(
        clamp(engagementQuality)
      ),

      viewEfficiency: Math.round(
        clamp(viewEfficiency)
      ),

      reachEfficiency: Math.round(
        clamp(reachEfficiency)
      ),

      interactionQuality: Math.round(
        clamp(interactionQuality)
      ),

      consistency: Math.round(
        clamp(consistency)
      ),
    },

    metrics: {
      total: verifiedMetrics.length,
      verified: verifiedMetrics.length,
    },
  };
}