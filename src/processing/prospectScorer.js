/**
 * Prospect Scoring Module
 * Phase 2: Calculates and updates prospect scores based on signals
 */

import {
  getProspect,
  getProspectSignals,
  updateProspect,
  getAllProspects,
  getSignalWeights,
  getConfig
} from '../db/queries.js';

/**
 * Calculate prospect score based on signals
 * @param {string} prospectId - Prospect ID
 * @returns {object} Score calculation result
 */
export async function calculateProspectScore(prospectId) {
  const prospect = getProspect(prospectId);
  if (!prospect) {
    throw new Error(`Prospect not found: ${prospectId}`);
  }

  const signals = getProspectSignals(prospectId);
  const weights = getSignalWeights();

  let totalScore = 0;
  let maxPossibleScore = 0;
  const breakdown = [];

  for (const signal of signals) {
    // Get weight from learned weights, fall back to signal's own weight or default
    const learnedWeight = weights[signal.signal_type];
    const signalWeight = signal.weight || learnedWeight || 10;

    totalScore += signalWeight;
    maxPossibleScore += learnedWeight || signalWeight;

    breakdown.push({
      signalType: signal.signal_type,
      signalValue: signal.signal_value,
      points: signalWeight,
      source: signal.source
    });
  }

  // Normalize to 0-100 scale (cap at 100)
  const normalizedScore = Math.min(100, Math.round(totalScore));

  // Determine tier based on thresholds
  const tier1Threshold = parseInt(getConfig('tier1_threshold') || '70');
  const tier2Threshold = parseInt(getConfig('tier2_threshold') || '40');

  let tier = 3;
  if (normalizedScore >= tier1Threshold) tier = 1;
  else if (normalizedScore >= tier2Threshold) tier = 2;

  // Update prospect with new score and tier
  updateProspect(prospectId, {
    score: normalizedScore,
    tier: tier
  });

  return {
    prospectId,
    score: normalizedScore,
    tier,
    previousScore: prospect.score,
    previousTier: prospect.tier,
    breakdown,
    totalSignals: signals.length,
    maxPossibleScore,
    tierThresholds: { tier1: tier1Threshold, tier2: tier2Threshold }
  };
}

/**
 * Recalculate scores for all active prospects
 * @returns {object} Recalculation results
 */
export async function recalculateAllProspectScores() {
  const prospects = getAllProspects({ status: 'active' });

  const results = {
    updated: 0,
    tierChanges: [],
    errors: []
  };

  for (const prospect of prospects) {
    try {
      const result = await calculateProspectScore(prospect.id);

      results.updated++;

      if (result.tier !== result.previousTier) {
        results.tierChanges.push({
          prospectId: prospect.id,
          companyName: prospect.company_name,
          previousTier: result.previousTier,
          newTier: result.tier,
          score: result.score
        });
      }
    } catch (err) {
      results.errors.push({
        prospectId: prospect.id,
        error: err.message
      });
    }
  }

  return results;
}

/**
 * Get scoring breakdown for a prospect
 * @param {string} prospectId - Prospect ID
 * @returns {object} Detailed scoring breakdown
 */
export function getProspectScoreBreakdown(prospectId) {
  const prospect = getProspect(prospectId);
  if (!prospect) {
    throw new Error(`Prospect not found: ${prospectId}`);
  }

  const signals = getProspectSignals(prospectId);
  const weights = getSignalWeights();

  // Group signals by type
  const signalsByType = {};
  let totalPoints = 0;

  for (const signal of signals) {
    const type = signal.signal_type;
    if (!signalsByType[type]) {
      signalsByType[type] = {
        type,
        weight: weights[type] || signal.weight || 10,
        signals: [],
        totalPoints: 0
      };
    }

    const points = signal.weight || weights[type] || 10;
    signalsByType[type].signals.push({
      value: signal.signal_value,
      source: signal.source,
      points,
      detectedAt: signal.detected_at
    });
    signalsByType[type].totalPoints += points;
    totalPoints += points;
  }

  // Get tier thresholds
  const tier1Threshold = parseInt(getConfig('tier1_threshold') || '70');
  const tier2Threshold = parseInt(getConfig('tier2_threshold') || '40');

  // Calculate points needed for tier upgrade
  let pointsToNextTier = null;
  if (prospect.tier === 3) {
    pointsToNextTier = Math.max(0, tier2Threshold - prospect.score);
  } else if (prospect.tier === 2) {
    pointsToNextTier = Math.max(0, tier1Threshold - prospect.score);
  }

  return {
    prospectId,
    companyName: prospect.company_name,
    currentScore: prospect.score,
    currentTier: prospect.tier,
    totalSignals: signals.length,
    totalPoints,
    signalsByType: Object.values(signalsByType),
    tierThresholds: { tier1: tier1Threshold, tier2: tier2Threshold },
    pointsToNextTier,
    suggestedSignals: getSuggestedSignals(signalsByType, weights)
  };
}

/**
 * Suggest signals that could improve the score
 * @param {object} existingSignals - Signals grouped by type
 * @param {object} weights - Signal weights
 * @returns {Array} Suggested signals to look for
 */
function getSuggestedSignals(existingSignals, weights) {
  const existingTypes = Object.keys(existingSignals);

  // All possible signal types from weights
  const allTypes = Object.keys(weights);

  // Find high-value signals not yet present
  const missing = allTypes
    .filter(type => !existingTypes.includes(type))
    .map(type => ({
      type,
      potentialPoints: weights[type],
      description: getSignalDescription(type)
    }))
    .sort((a, b) => b.potentialPoints - a.potentialPoints)
    .slice(0, 5);

  return missing;
}

/**
 * Get human-readable description for a signal type
 */
function getSignalDescription(signalType) {
  const descriptions = {
    recent_funding: 'Company received recent funding',
    hiring_signals: 'Company is actively hiring in relevant roles',
    tech_stack_fit: 'Tech stack matches your product requirements',
    industry_fit: 'Company is in your target industry',
    company_size_fit: 'Company size is in your target range',
    social_engagement: 'Engaged with your content on social media',
    competitor_customer: 'Currently using a competitor product',
    inbound_signal: 'Showed inbound interest (demo request, etc.)',
    previous_relationship: 'Existing relationship with someone at the company',
    recent_news: 'Recent relevant news about the company',
    growth_indicators: 'Company showing strong growth indicators',
    pain_indicators: 'Company showing signs of pain you can solve'
  };

  return descriptions[signalType] || signalType.replace(/_/g, ' ');
}

/**
 * Estimate tier for a prospect before creation
 * @param {Array} signals - Array of signal objects
 * @returns {object} Estimated tier and score
 */
export function estimateTier(signals) {
  const weights = getSignalWeights();

  let totalScore = 0;
  for (const signal of signals) {
    const weight = weights[signal.signalType] || signal.weight || 10;
    totalScore += weight;
  }

  const normalizedScore = Math.min(100, totalScore);

  const tier1Threshold = parseInt(getConfig('tier1_threshold') || '70');
  const tier2Threshold = parseInt(getConfig('tier2_threshold') || '40');

  let tier = 3;
  if (normalizedScore >= tier1Threshold) tier = 1;
  else if (normalizedScore >= tier2Threshold) tier = 2;

  return {
    estimatedScore: normalizedScore,
    estimatedTier: tier,
    tierThresholds: { tier1: tier1Threshold, tier2: tier2Threshold }
  };
}

/**
 * Get prospects that need attention based on score changes
 * @returns {Array} Prospects with significant score changes
 */
export function getProspectsNeedingAttention() {
  const prospects = getAllProspects({ status: 'active' });

  const needingAttention = [];

  for (const prospect of prospects) {
    const issues = [];

    // High-tier prospect with low recent activity
    if (prospect.tier === 1 && !prospect.last_outreach_date) {
      issues.push('Tier 1 prospect with no outreach logged');
    }

    // Prospect with overdue follow-up
    if (prospect.next_followup_date) {
      const followupDate = new Date(prospect.next_followup_date);
      if (followupDate < new Date()) {
        issues.push('Follow-up is overdue');
      }
    }

    // High score but low tier (might need signals reviewed)
    if (prospect.score >= 70 && prospect.tier > 1) {
      issues.push('Score suggests higher tier');
    }

    if (issues.length > 0) {
      needingAttention.push({
        prospect,
        issues
      });
    }
  }

  return needingAttention.sort((a, b) =>
    (a.prospect.tier - b.prospect.tier) || (b.prospect.score - a.prospect.score)
  );
}

export default {
  calculateProspectScore,
  recalculateAllProspectScores,
  getProspectScoreBreakdown,
  estimateTier,
  getProspectsNeedingAttention
};
