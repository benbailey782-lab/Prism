/**
 * Insight Management Module
 * Phase 2: Manages the lifecycle of system-generated insights
 */

import {
  createInsight,
  getInsight,
  getAllInsights,
  getLatestInsight,
  updateInsightFeedback,
  updateInsightStatus
} from '../db/queries.js';

/**
 * Store a new insight
 * @param {object} insightData - Insight data
 * @returns {string} Insight ID
 */
export function storeInsight(insightData) {
  return createInsight({
    insightType: insightData.type || insightData.insightType,
    category: insightData.category,
    title: insightData.title,
    hypothesis: insightData.hypothesis,
    confidence: insightData.confidence || 0.5,
    evidence: insightData.evidence,
    sampleSize: insightData.sampleSize,
    previousInsightId: insightData.previousInsightId
  });
}

/**
 * Get all active insights formatted for display
 * @param {object} filters - Optional filters
 * @returns {Array} Formatted insights
 */
export function getActiveInsights(filters = {}) {
  const insights = getAllInsights({
    type: filters.type,
    category: filters.category,
    minConfidence: filters.minConfidence,
    status: 'active'
  });

  return insights.map(formatInsightForDisplay);
}

/**
 * Get the current ICP insight
 * @returns {object|null} ICP insight or null
 */
export function getCurrentICP() {
  const insight = getLatestInsight('icp');
  return insight ? formatInsightForDisplay(insight) : null;
}

/**
 * Get pattern insights
 * @returns {Array} Pattern insights
 */
export function getPatternInsights() {
  const insights = getAllInsights({ type: 'pattern', status: 'active' });
  return insights.map(formatInsightForDisplay);
}

/**
 * Get coaching insights
 * @returns {Array} Coaching insights
 */
export function getCoachingInsights() {
  const insights = getAllInsights({ type: 'coaching', status: 'active' });
  return insights.map(formatInsightForDisplay);
}

/**
 * Record user feedback on an insight
 * @param {string} insightId - Insight ID
 * @param {string} feedback - 'helpful' | 'not_helpful' | 'incorrect'
 */
export function recordFeedback(insightId, feedback) {
  const validFeedback = ['helpful', 'not_helpful', 'incorrect'];
  if (!validFeedback.includes(feedback)) {
    throw new Error(`Invalid feedback: ${feedback}`);
  }

  updateInsightFeedback(insightId, feedback);

  // If marked as incorrect, reduce confidence or invalidate
  if (feedback === 'incorrect') {
    const insight = getInsight(insightId);
    if (insight && insight.confidence < 0.5) {
      updateInsightStatus(insightId, 'invalidated');
    }
  }
}

/**
 * Dismiss/hide an insight
 * @param {string} insightId - Insight ID
 */
export function dismissInsight(insightId) {
  updateInsightStatus(insightId, 'invalidated');
}

/**
 * Get insight with full history
 * @param {string} insightId - Insight ID
 * @returns {object|null} Insight with history
 */
export function getInsightWithHistory(insightId) {
  const insight = getInsight(insightId);
  if (!insight) return null;

  return {
    ...formatInsightForDisplay(insight),
    history: insight.history || [],
    evolutionSummary: summarizeEvolution(insight)
  };
}

/**
 * Check if insights need refresh based on data changes
 * @returns {object} Refresh recommendations
 */
export function checkInsightFreshness() {
  const recommendations = [];

  // Check ICP freshness
  const icpInsight = getLatestInsight('icp');
  if (icpInsight) {
    const daysSinceUpdate = daysSince(icpInsight.updated_at);
    if (daysSinceUpdate > 14) {
      recommendations.push({
        type: 'icp',
        reason: `ICP insight is ${daysSinceUpdate} days old`,
        action: 'run_analysis'
      });
    }
  } else {
    recommendations.push({
      type: 'icp',
      reason: 'No ICP insight exists',
      action: 'run_analysis'
    });
  }

  // Check pattern freshness
  const patternInsights = getAllInsights({ type: 'pattern', status: 'active' });
  const recentPatterns = patternInsights.filter(p => daysSince(p.updated_at) < 7);
  if (recentPatterns.length === 0 && patternInsights.length > 0) {
    recommendations.push({
      type: 'patterns',
      reason: 'Pattern insights may be stale',
      action: 'run_analysis'
    });
  }

  return {
    needsRefresh: recommendations.length > 0,
    recommendations
  };
}

/**
 * Get aggregated insights summary
 * @returns {object} Summary statistics
 */
export function getInsightsSummary() {
  const allInsights = getAllInsights({ status: 'active' });

  const byType = {};
  let totalConfidence = 0;
  let helpfulCount = 0;
  let notHelpfulCount = 0;

  for (const insight of allInsights) {
    byType[insight.insight_type] = (byType[insight.insight_type] || 0) + 1;
    totalConfidence += insight.confidence || 0;

    if (insight.user_feedback === 'helpful') helpfulCount++;
    if (insight.user_feedback === 'not_helpful') notHelpfulCount++;
  }

  const avgConfidence = allInsights.length > 0
    ? totalConfidence / allInsights.length
    : 0;

  return {
    totalActive: allInsights.length,
    byType,
    avgConfidence: Math.round(avgConfidence * 100) / 100,
    feedbackStats: {
      helpful: helpfulCount,
      notHelpful: notHelpfulCount,
      noFeedback: allInsights.length - helpfulCount - notHelpfulCount
    },
    topInsights: allInsights
      .sort((a, b) => (b.confidence || 0) - (a.confidence || 0))
      .slice(0, 3)
      .map(formatInsightForDisplay)
  };
}

/**
 * Format an insight for display
 * @param {object} insight - Raw insight from database
 * @returns {object} Formatted insight
 */
function formatInsightForDisplay(insight) {
  const formatted = {
    id: insight.id,
    type: insight.insight_type,
    category: insight.category,
    title: insight.title,
    hypothesis: insight.hypothesis,
    confidence: insight.confidence,
    confidencePercent: Math.round((insight.confidence || 0) * 100),
    status: insight.status,
    userFeedback: insight.user_feedback,
    sampleSize: insight.sample_size,
    createdAt: insight.created_at,
    updatedAt: insight.updated_at
  };

  // Parse evidence if it's a string
  if (insight.evidence) {
    formatted.evidence = typeof insight.evidence === 'string'
      ? tryParseJSON(insight.evidence)
      : insight.evidence;
  }

  // Add display helpers
  formatted.confidenceLevel = getConfidenceLevel(insight.confidence);
  formatted.ageLabel = getAgeLabel(insight.created_at);

  return formatted;
}

/**
 * Summarize how an insight has evolved
 */
function summarizeEvolution(insight) {
  if (!insight.history || insight.history.length < 2) {
    return { hasEvolution: false };
  }

  const first = insight.history[insight.history.length - 1];
  const latest = insight.history[0];

  const confidenceChange = (latest.confidence || 0) - (first.confidence || 0);
  const sampleSizeChange = (latest.sample_size || 0) - (first.sample_size || 0);

  return {
    hasEvolution: true,
    confidenceChange,
    confidenceTrend: confidenceChange > 0 ? 'increasing' : confidenceChange < 0 ? 'decreasing' : 'stable',
    sampleSizeChange,
    revisions: insight.history.length
  };
}

/**
 * Get confidence level label
 */
function getConfidenceLevel(confidence) {
  if (confidence >= 0.8) return 'high';
  if (confidence >= 0.6) return 'medium';
  if (confidence >= 0.4) return 'low';
  return 'very_low';
}

/**
 * Get human-readable age label
 */
function getAgeLabel(dateStr) {
  const days = daysSince(dateStr);
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  return `${Math.floor(days / 30)} months ago`;
}

/**
 * Calculate days since a date
 */
function daysSince(dateStr) {
  if (!dateStr) return 999;
  const date = new Date(dateStr);
  const now = new Date();
  return Math.floor((now - date) / (1000 * 60 * 60 * 24));
}

/**
 * Try to parse JSON, return original if fails
 */
function tryParseJSON(str) {
  try {
    return JSON.parse(str);
  } catch {
    return str;
  }
}

export default {
  storeInsight,
  getActiveInsights,
  getCurrentICP,
  getPatternInsights,
  getCoachingInsights,
  recordFeedback,
  dismissInsight,
  getInsightWithHistory,
  checkInsightFreshness,
  getInsightsSummary
};
