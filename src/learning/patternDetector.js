/**
 * Pattern Detection Module
 * Phase 2: Identifies behavioral patterns in sales calls that correlate with success
 */

import {
  getTranscriptsWithMetrics,
  getDealsWithOutcome,
  createInsight,
  getLatestInsight
} from '../db/queries.js';

const PATTERN_DETECTION_PROMPT = `Analyze these sales call transcripts for behavioral patterns.

SUCCESSFUL CALLS (led to advancement):
{SUCCESSFUL_CALLS}

UNSUCCESSFUL CALLS (stalled or lost):
{UNSUCCESSFUL_CALLS}

CALL METRICS:
{METRICS}

Find patterns in:

1. QUESTION PATTERNS
   - What questions appear in successful calls but not unsuccessful?
   - Timing patterns - when are certain questions asked?
   - Question sequences that work well

2. TALK RATIO PATTERNS
   - How does talk ratio correlate with success?
   - Are there topic-specific patterns?

3. TOPIC PATTERNS
   - Which topics correlate with success?
   - Topics that correlate with stalls?
   - Order/timing of topics

4. OBJECTION PATTERNS
   - Common objections
   - Successful vs unsuccessful responses
   - Prevention patterns

5. CLOSING PATTERNS
   - What closing behaviors correlate with next steps?
   - What's missing in unsuccessful calls?

Respond ONLY with valid JSON:
{
  "patterns": [
    {
      "id": "pattern_1",
      "type": "question",
      "observation": "Asking about decision process in first 10 minutes correlates with 2.5x higher conversion",
      "evidence": ["Found in 8/10 successful calls", "Missing in 7/10 unsuccessful calls"],
      "confidence": 0.78,
      "recommendation": "Add 'decision process' question to first-call checklist",
      "priority": "high"
    },
    {
      "id": "pattern_2",
      "type": "talk_ratio",
      "observation": "Calls with 35-45% talk ratio close 2x more often than those over 55%",
      "evidence": ["Average talk ratio in wins: 42%", "Average in losses: 58%"],
      "confidence": 0.82,
      "recommendation": "Monitor talk ratio, pause more after prospect speaks",
      "priority": "high"
    }
  ],

  "antiPatterns": [
    {
      "id": "anti_1",
      "observation": "Jumping to demo before discovery correlates with 70% loss rate",
      "evidence": ["5/7 quick-to-demo calls resulted in no follow-up"],
      "recommendation": "Minimum 15 minutes of discovery before any demo",
      "priority": "high"
    }
  ],

  "questionEffectiveness": [
    {"question": "What happens if you don't solve this?", "successRate": 0.85},
    {"question": "What's your timeline?", "successRate": 0.72},
    {"question": "Does that make sense?", "successRate": 0.35, "note": "Filler question, avoid"}
  ],

  "topRecommendations": [
    "Ask about decision process within first 10 minutes",
    "Keep talk ratio under 50%",
    "Always quantify the pain before discussing solution"
  ]
}`;

/**
 * Detect patterns in sales calls
 * @param {object} options - { scope: 'recent' | 'full', days: number }
 * @param {function} callAI - AI calling function
 * @returns {object} Detected patterns
 */
export async function detectPatterns(options = {}, callAI) {
  const { scope = 'full', days = 30 } = options;

  // Get transcripts with metrics
  const transcripts = getTranscriptsWithMetrics();

  // Filter by date if recent scope
  let filteredTranscripts = transcripts;
  if (scope === 'recent' && days) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    filteredTranscripts = transcripts.filter(t =>
      new Date(t.call_date || t.created_at) >= cutoff
    );
  }

  // Get deal outcomes to categorize calls
  const wonDeals = getDealsWithOutcome('won');
  const lostDeals = getDealsWithOutcome('lost');

  // Categorize transcripts by outcome (simplified - in reality would need better linking)
  const successfulCalls = filteredTranscripts.filter(t => {
    const talkRatio = t.talk_ratio;
    // Heuristic: good talk ratio + has strong moments = likely successful
    return talkRatio && talkRatio <= 0.55 && t.strong_moments?.length > 0;
  });

  const unsuccessfulCalls = filteredTranscripts.filter(t => {
    const talkRatio = t.talk_ratio;
    return talkRatio && (talkRatio > 0.60 || !t.strong_moments || t.strong_moments.length === 0);
  });

  // Format for prompt
  const formatCalls = (calls) => {
    if (calls.length === 0) return 'Insufficient data';
    return calls.slice(0, 10).map(c => `- ${c.filename}: Talk ratio ${c.talk_ratio ? Math.round(c.talk_ratio * 100) + '%' : 'N/A'}, ${c.strong_moments?.length || 0} strong moments`).join('\n');
  };

  const formatMetrics = (all) => {
    const ratios = all.filter(t => t.talk_ratio).map(t => t.talk_ratio);
    const avgRatio = ratios.length > 0 ? ratios.reduce((a, b) => a + b, 0) / ratios.length : null;

    return `Average talk ratio: ${avgRatio ? Math.round(avgRatio * 100) + '%' : 'N/A'}
Total calls analyzed: ${all.length}
Calls with metrics: ${ratios.length}`;
  };

  const prompt = PATTERN_DETECTION_PROMPT
    .replace('{SUCCESSFUL_CALLS}', formatCalls(successfulCalls))
    .replace('{UNSUCCESSFUL_CALLS}', formatCalls(unsuccessfulCalls))
    .replace('{METRICS}', formatMetrics(filteredTranscripts));

  try {
    const response = await callAI(prompt, { maxTokens: 3072 });
    const analysis = parseJSON(response);

    // Store patterns as insights
    if (analysis.patterns) {
      for (const pattern of analysis.patterns.slice(0, 5)) { // Top 5 patterns
        createInsight({
          insightType: 'pattern',
          category: pattern.type,
          title: `Pattern: ${pattern.type}`,
          hypothesis: pattern.observation,
          confidence: pattern.confidence || 0.5,
          evidence: {
            pattern,
            evidence: pattern.evidence,
            recommendation: pattern.recommendation
          },
          sampleSize: successfulCalls.length + unsuccessfulCalls.length
        });
      }
    }

    // Store anti-patterns
    if (analysis.antiPatterns) {
      for (const anti of analysis.antiPatterns.slice(0, 3)) {
        createInsight({
          insightType: 'pattern',
          category: 'anti_pattern',
          title: 'Anti-pattern detected',
          hypothesis: anti.observation,
          confidence: 0.7,
          evidence: {
            antiPattern: anti,
            evidence: anti.evidence,
            recommendation: anti.recommendation
          },
          sampleSize: successfulCalls.length + unsuccessfulCalls.length
        });
      }
    }

    return {
      ...analysis,
      dataUsed: {
        totalCalls: filteredTranscripts.length,
        successfulCalls: successfulCalls.length,
        unsuccessfulCalls: unsuccessfulCalls.length,
        scope,
        days
      }
    };
  } catch (err) {
    console.error('Pattern detection failed:', err.message);
    return {
      error: err.message,
      patterns: [],
      antiPatterns: [],
      questionEffectiveness: [],
      topRecommendations: []
    };
  }
}

/**
 * Get quick pattern summary without AI
 * Uses existing metrics data
 * @returns {object} Quick pattern summary
 */
export function getQuickPatternSummary() {
  const transcripts = getTranscriptsWithMetrics();

  const withMetrics = transcripts.filter(t => t.talk_ratio);
  if (withMetrics.length < 3) {
    return {
      needsMoreData: true,
      message: 'Need at least 3 calls with metrics for patterns'
    };
  }

  // Calculate averages
  const avgTalkRatio = withMetrics.reduce((a, t) => a + t.talk_ratio, 0) / withMetrics.length;

  // Categorize by talk ratio
  const goodRatioCalls = withMetrics.filter(t => t.talk_ratio >= 0.35 && t.talk_ratio <= 0.50);
  const highRatioCalls = withMetrics.filter(t => t.talk_ratio > 0.55);

  // Find common strong moments
  const strongMomentTypes = {};
  for (const t of withMetrics) {
    if (t.strong_moments) {
      for (const moment of t.strong_moments) {
        const type = categorizeStrongMoment(moment);
        strongMomentTypes[type] = (strongMomentTypes[type] || 0) + 1;
      }
    }
  }

  // Find common improvements
  const improvementTypes = {};
  for (const t of withMetrics) {
    if (t.improvement_areas) {
      for (const area of t.improvement_areas) {
        const type = categorizeImprovement(area);
        improvementTypes[type] = (improvementTypes[type] || 0) + 1;
      }
    }
  }

  return {
    needsMoreData: false,
    summary: {
      callsAnalyzed: withMetrics.length,
      avgTalkRatio: Math.round(avgTalkRatio * 100),
      goodRatioPercentage: Math.round((goodRatioCalls.length / withMetrics.length) * 100),
      highRatioPercentage: Math.round((highRatioCalls.length / withMetrics.length) * 100)
    },
    topStrengths: Object.entries(strongMomentTypes)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([type, count]) => ({ type, count })),
    topImprovements: Object.entries(improvementTypes)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([type, count]) => ({ type, count }))
  };
}

/**
 * Categorize a strong moment for aggregation
 */
function categorizeStrongMoment(moment) {
  const text = (typeof moment === 'string' ? moment : moment.moment || '').toLowerCase();

  if (text.includes('question')) return 'discovery_questions';
  if (text.includes('listen')) return 'active_listening';
  if (text.includes('pain') || text.includes('problem')) return 'pain_identification';
  if (text.includes('next step')) return 'next_steps';
  if (text.includes('objection')) return 'objection_handling';
  if (text.includes('value') || text.includes('benefit')) return 'value_communication';

  return 'other';
}

/**
 * Categorize an improvement area for aggregation
 */
function categorizeImprovement(area) {
  const text = (typeof area === 'string' ? area : area.area || '').toLowerCase();

  if (text.includes('talk') || text.includes('ratio')) return 'talk_ratio';
  if (text.includes('question')) return 'questioning';
  if (text.includes('listen') || text.includes('interrupt')) return 'listening';
  if (text.includes('budget') || text.includes('money')) return 'budget_discovery';
  if (text.includes('next step')) return 'closing';
  if (text.includes('decision')) return 'decision_process';

  return 'other';
}

/**
 * Parse JSON from AI response
 */
function parseJSON(text) {
  let jsonStr = text;

  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    jsonStr = codeBlockMatch[1];
  } else {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonStr = jsonMatch[0];
    }
  }

  return JSON.parse(jsonStr.trim());
}

export default {
  detectPatterns,
  getQuickPatternSummary
};
