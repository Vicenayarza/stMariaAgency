import { prisma } from "../lib/prisma.js";

export async function calculateTrustScore(
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
            orderBy: {
              recordedAt: "desc",
            },
          },
        },
      },
      campaignLinks: {
        include: {
          deliverables: true,
        },
      },
    },
  });

  if (!creator) {
    throw new Error("CREATOR_NOT_FOUND");
  }

  /*
   * ==========================================
   * MÉTRICAS
   * ==========================================
   */

  const allMetrics = creator.socialAccounts
    .flatMap((account) => account.metrics)
    .sort(
      (a, b) =>
        b.recordedAt.getTime() -
        a.recordedAt.getTime()
    );

  const verifiedMetrics = allMetrics
    .filter(
      (metric) =>
        metric.verificationStatus === "VERIFIED"
    )
    .sort(
      (a, b) =>
        b.recordedAt.getTime() -
        a.recordedAt.getTime()
    );

  /*
   * ==========================================
   * AUDIENCIA
   * ==========================================
   */

  let audienceScore = 50;

  if (verifiedMetrics.length > 0) {
    audienceScore += 30;
  }

  if (creator.followers >= 10_000) {
    audienceScore += 5;
  }

  if (creator.followers >= 50_000) {
    audienceScore += 5;
  }

  if (creator.followers >= 100_000) {
    audienceScore += 5;
  }

  audienceScore = Math.min(
    audienceScore,
    100
  );

  /*
   * ==========================================
   * ENGAGEMENT
   * ==========================================
   */

  let engagementScore = 50;

  if (creator.engagementRate >= 2) {
    engagementScore += 10;
  }

  if (creator.engagementRate >= 4) {
    engagementScore += 10;
  }

  if (creator.engagementRate >= 6) {
    engagementScore += 10;
  }

  if (creator.engagementRate >= 8) {
    engagementScore += 10;
  }

  engagementScore = Math.min(
    engagementScore,
    100
  );

  /*
   * ==========================================
   * EVOLUCIÓN
   * ==========================================
   */

  let evolutionScore = 50;

  if (verifiedMetrics.length >= 2) {
    const latest = verifiedMetrics[0];
    const previous = verifiedMetrics[1];

    if (
      latest.followers >
      previous.followers
    ) {
      evolutionScore += 25;
    } else if (
      latest.followers ===
      previous.followers
    ) {
      evolutionScore += 10;
    } else {
      evolutionScore -= 10;
    }

    if (
      latest.engagementRate >=
      previous.engagementRate
    ) {
      evolutionScore += 15;
    }
  } else if (
    verifiedMetrics.length === 1
  ) {
    evolutionScore += 15;
  }

  evolutionScore = Math.max(
    0,
    Math.min(evolutionScore, 100)
  );

  /*
   * ==========================================
   * CAMPAÑAS
   * ==========================================
   */

  const totalCampaigns =
    creator.campaignLinks.length;

  const completedCampaigns =
    creator.campaignLinks.filter(
      (campaign) =>
        campaign.status === "PUBLISHED" ||
        campaign.status === "PAID"
    ).length;

  let campaignScore = 50;

  if (totalCampaigns > 0) {
    campaignScore += 10;
  }

  if (totalCampaigns >= 3) {
    campaignScore += 10;
  }

  if (totalCampaigns >= 5) {
    campaignScore += 10;
  }

  if (completedCampaigns > 0) {
    campaignScore += 10;
  }

  campaignScore = Math.min(
    campaignScore,
    100
  );

  /*
   * ==========================================
   * ENTREGAS
   * ==========================================
   */

  const allDeliverables =
    creator.campaignLinks.flatMap(
      (campaign) =>
        campaign.deliverables
    );

  const approvedDeliverables =
    allDeliverables.filter(
      (deliverable) =>
        deliverable.status === "APPROVED"
    ).length;

  let deliveryScore = 50;

  if (allDeliverables.length > 0) {
    const approvalRate =
      approvedDeliverables /
      allDeliverables.length;

    deliveryScore = Math.round(
      50 + approvalRate * 50
    );
  }

  deliveryScore = Math.min(
    deliveryScore,
    100
  );

  /*
   * ==========================================
   * FIABILIDAD
   * ==========================================
   */

  let reliabilityScore = 50;

  if (totalCampaigns > 0) {
    reliabilityScore += 10;
  }

  if (completedCampaigns >= 2) {
    reliabilityScore += 15;
  }

  if (allDeliverables.length > 0) {
    const approvalRate =
      approvedDeliverables /
      allDeliverables.length;

    reliabilityScore += Math.round(
      approvalRate * 25
    );
  }

  reliabilityScore = Math.min(
    reliabilityScore,
    100
  );

  /*
   * ==========================================
   * AUDIENCE QUALITY
   * ==========================================
   */

  const {
    calculateAudienceQuality,
  } = await import(
    "./audience-quality.service.js"
  );

  const audienceQuality =
    await calculateAudienceQuality(
      creator.id
    );

  /*
   * ==========================================
   * TRUST SCORE
   * ==========================================
   */

  const baseTrustScore = Math.round(
    audienceScore * 0.15 +
      engagementScore * 0.15 +
      evolutionScore * 0.15 +
      campaignScore * 0.15 +
      deliveryScore * 0.15 +
      reliabilityScore * 0.15 +
      audienceQuality.audienceQualityScore *
        0.10
  );

  /*
   * ==========================================
   * RISK PENALTY
   * ==========================================
   *
   * El análisis de riesgo no sustituye al
   * Trust Score. Solamente puede reducirlo
   * cuando existen señales relevantes.
   */

  const {
    analyzeCreatorRisk,
  } = await import(
    "./creator-risk.service.js"
  );

  const riskAnalysis =
    await analyzeCreatorRisk(
      creator.id
    );

  let riskPenalty = 0;

  if (
    riskAnalysis.riskLevel === "MEDIUM"
  ) {
    riskPenalty = Math.min(
      8,
      Math.round(
        riskAnalysis.riskScore * 0.15
      )
    );
  }

  if (
    riskAnalysis.riskLevel === "HIGH"
  ) {
    riskPenalty = Math.min(
      15,
      Math.round(
        riskAnalysis.riskScore * 0.2
      )
    );
  }

  const trustScore = Math.max(
    0,
    Math.min(
      100,
      baseTrustScore - riskPenalty
    )
  );

  /*
   * ==========================================
   * RESPUESTA
   * ==========================================
   */

  return {
    creatorId: creator.id,

    trustScore,

    baseTrustScore,

    riskPenalty,

    breakdown: {
      audience: audienceScore,
      engagement: engagementScore,
      evolution: evolutionScore,
      campaigns: campaignScore,
      deliveries: deliveryScore,
      reliability: reliabilityScore,
    },

    risk: {
      score: riskAnalysis.riskScore,
      level: riskAnalysis.riskLevel,
      flags: riskAnalysis.flags,
    },

    metrics: {
      total: allMetrics.length,
      verified: verifiedMetrics.length,
    },

    campaigns: {
      total: totalCampaigns,
      completed: completedCampaigns,
    },

    deliverables: {
      total: allDeliverables.length,
      approved: approvedDeliverables,
    },

    audienceQuality: {
      score:
        audienceQuality.audienceQualityScore,
      breakdown:
        audienceQuality.breakdown,
    },
  };
}