/**
 * Comprehensive Call Metrics and Coaching Analysis
 * Phase 2: Deep analysis of sales calls for coaching insights
 */

import { saveTranscriptMetrics } from '../db/queries.js';

const METRICS_PROMPT = `Analyze this sales call for coaching insights.

TRANSCRIPT:
{TRANSCRIPT_CONTENT}

Analyze deeply:

1. TALK RATIO
   - Estimate what percentage of words were spoken by the salesperson vs prospect
   - Ideal is 30-50% salesperson

2. QUESTION QUALITY
   - List all questions asked by the salesperson
   - Categorize: discovery, clarifying, closing, filler
   - Rate overall questioning: excellent, good, fair, poor

3. LISTENING INDICATORS
   - Did the salesperson build on what the prospect said?
   - Were there interruptions?
   - Did they miss obvious follow-up opportunities?

4. DISCOVERY DEPTH
   - Did they uncover: pain, impact, timeline, budget, process, competition?
   - What's still unknown?

5. STRONG MOMENTS
   - Specific things done well (with timestamps if possible)

6. IMPROVEMENT AREAS
   - Specific things to improve (be constructive, actionable)

7. OBJECTION HANDLING
   - Were any objections raised? How were they handled?

8. NEXT STEPS
   - Were clear next steps established?
   - Was there a specific commitment?

Respond ONLY with valid JSON:
{
  "talkRatio": 0.45,
  "talkRatioAssessment": "good",

  "questions": {
    "discovery": ["What's driving this initiative?", "Who else is involved?"],
    "clarifying": ["Just to confirm, you said Q2?"],
    "closing": [],
    "filler": ["Does that make sense?"],
    "quality": "good",
    "missedOpportunities": ["Could have asked about budget", "Didn't explore the competitor mention"]
  },

  "listening": {
    "score": 0.7,
    "builtOnProspectPoints": true,
    "interruptions": 1,
    "missedFollowups": ["When they mentioned the CFO, could have asked for name"]
  },

  "discoveryDepth": {
    "pain": "identified",
    "impact": "partial",
    "timeline": "identified",
    "budget": "unknown",
    "process": "partial",
    "competition": "identified"
  },

  "strongMoments": [
    {"moment": "Great open-ended question about their challenges", "timestamp": "2:30"},
    {"moment": "Effectively connected feature to their specific pain", "timestamp": "8:45"}
  ],

  "improvementAreas": [
    {"area": "Ask about budget earlier", "suggestion": "Try: 'Do you have budget allocated for this?'"},
    {"area": "Interrupted at 5:15", "suggestion": "Practice pausing 2 seconds before responding"}
  ],

  "objections": [
    {"objection": "Concerned about implementation time", "handling": "good", "response": "Addressed with typical timeline"}
  ],

  "nextSteps": {
    "established": true,
    "specific": true,
    "commitment": "Demo scheduled for next Tuesday",
    "owner": "both"
  },

  "overallScore": 72,
  "topPriority": "Focus on discovering budget earlier in the conversation"
}`;

/**
 * Perform comprehensive metrics analysis on a transcript
 * @param {object} transcript - Transcript object
 * @param {function} callAI - AI calling function
 * @returns {object} Comprehensive metrics
 */
export async function analyzeMetrics(transcript, callAI) {
  const prompt = METRICS_PROMPT
    .replace('{TRANSCRIPT_CONTENT}', transcript.raw_content.substring(0, 10000));

  try {
    const response = await callAI(prompt, { maxTokens: 2048 });
    const metrics = parseJSON(response);

    // Add derived metrics
    metrics.computed = computeDerivedMetrics(metrics);

    return metrics;
  } catch (err) {
    console.error('Metrics analysis failed:', err.message);
    return getDefaultMetrics();
  }
}

/**
 * Save comprehensive metrics to database
 * @param {string} transcriptId - Transcript ID
 * @param {object} metrics - Metrics from analyzeMetrics
 */
export function saveComprehensiveMetrics(transcriptId, metrics) {
  // Save basic metrics to existing table
  saveTranscriptMetrics(transcriptId, {
    talkRatio: metrics.talkRatio,
    strongMoments: metrics.strongMoments || [],
    improvementAreas: metrics.improvementAreas || [],
    questionsAsked: metrics.questions?.discovery?.concat(metrics.questions?.clarifying || []) || []
  });

  // Return full metrics for API response
  return metrics;
}

/**
 * Get coaching recommendations based on metrics
 * @param {object} metrics - Metrics from analyzeMetrics
 * @returns {Array} Prioritized coaching recommendations
 */
export function getCoachingRecommendations(metrics) {
  const recommendations = [];

  // Talk ratio recommendations
  if (metrics.talkRatio > 0.55) {
    recommendations.push({
      category: 'talk_ratio',
      priority: 'high',
      issue: `Talk ratio is ${Math.round(metrics.talkRatio * 100)}% - too high`,
      recommendation: 'Ask more open-ended questions and pause after prospect speaks',
      specificActions: [
        'Count to 3 before responding',
        'Replace statements with questions',
        'Use "Tell me more about that" frequently'
      ]
    });
  } else if (metrics.talkRatio < 0.30) {
    recommendations.push({
      category: 'talk_ratio',
      priority: 'medium',
      issue: `Talk ratio is ${Math.round(metrics.talkRatio * 100)}% - may be too passive`,
      recommendation: 'Ensure you\'re adding value and guiding the conversation',
      specificActions: [
        'Share relevant insights or stories',
        'Summarize what you\'ve heard',
        'Provide clear next steps'
      ]
    });
  }

  // Question quality recommendations
  if (metrics.questions?.quality === 'poor' || metrics.questions?.quality === 'fair') {
    recommendations.push({
      category: 'questions',
      priority: 'high',
      issue: 'Question quality needs improvement',
      recommendation: 'Focus on deeper discovery questions',
      specificActions: [
        'Prepare 5-7 discovery questions before calls',
        'Ask "why" and "what" more than "do you"',
        'Follow up with "Help me understand..."'
      ],
      missedOpportunities: metrics.questions?.missedOpportunities || []
    });
  }

  // Listening recommendations
  if (metrics.listening?.score < 0.6) {
    recommendations.push({
      category: 'listening',
      priority: 'high',
      issue: 'Active listening could be improved',
      recommendation: 'Build more on what the prospect says',
      specificActions: [
        'Take notes on specific phrases to reference later',
        'Repeat back key points: "I heard you say..."',
        'Connect your responses to their words'
      ],
      missedFollowups: metrics.listening?.missedFollowups || []
    });
  }

  if (metrics.listening?.interruptions > 0) {
    recommendations.push({
      category: 'listening',
      priority: 'medium',
      issue: `${metrics.listening.interruptions} interruption(s) detected`,
      recommendation: 'Practice waiting until prospect finishes speaking',
      specificActions: [
        'Mute yourself when not speaking',
        'Wait for a full pause before responding',
        'If you interrupt, apologize and let them continue'
      ]
    });
  }

  // Discovery depth recommendations
  if (metrics.discoveryDepth) {
    const unknown = Object.entries(metrics.discoveryDepth)
      .filter(([_, status]) => status === 'unknown')
      .map(([topic, _]) => topic);

    if (unknown.length > 2) {
      recommendations.push({
        category: 'discovery',
        priority: 'high',
        issue: `Missing discovery on: ${unknown.join(', ')}`,
        recommendation: 'Use a discovery framework checklist',
        specificActions: unknown.map(topic => getDiscoveryQuestion(topic))
      });
    }
  }

  // Next steps recommendations
  if (metrics.nextSteps && !metrics.nextSteps.established) {
    recommendations.push({
      category: 'next_steps',
      priority: 'high',
      issue: 'No clear next steps established',
      recommendation: 'Always end with a concrete commitment',
      specificActions: [
        'Ask "What should our next step be?"',
        'Propose a specific time for follow-up',
        'Get agreement on action items for both sides'
      ]
    });
  } else if (metrics.nextSteps && !metrics.nextSteps.specific) {
    recommendations.push({
      category: 'next_steps',
      priority: 'medium',
      issue: 'Next steps were vague',
      recommendation: 'Make commitments specific and time-bound',
      specificActions: [
        'Instead of "I\'ll follow up" say "I\'ll email you Tuesday with X"',
        'Put meetings on the calendar during the call',
        'Confirm who does what by when'
      ]
    });
  }

  // Sort by priority
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return recommendations;
}

/**
 * Get improvement trends across multiple calls
 * @param {Array} metricsHistory - Array of metrics objects with dates
 * @returns {object} Trend analysis
 */
export function analyzeImprovementTrends(metricsHistory) {
  if (metricsHistory.length < 2) {
    return { trends: [], needsMoreData: true };
  }

  const trends = [];

  // Analyze talk ratio trend
  const talkRatios = metricsHistory.filter(m => m.talkRatio).map(m => m.talkRatio);
  if (talkRatios.length >= 2) {
    const recent = talkRatios.slice(-3).reduce((a, b) => a + b, 0) / Math.min(3, talkRatios.length);
    const older = talkRatios.slice(0, -3).reduce((a, b) => a + b, 0) / Math.max(1, talkRatios.length - 3);

    if (recent < older - 0.05) {
      trends.push({
        metric: 'talk_ratio',
        direction: 'improving',
        message: `Talk ratio improving: ${Math.round(older * 100)}% → ${Math.round(recent * 100)}%`
      });
    } else if (recent > older + 0.05) {
      trends.push({
        metric: 'talk_ratio',
        direction: 'declining',
        message: `Talk ratio increasing: ${Math.round(older * 100)}% → ${Math.round(recent * 100)}%`
      });
    }
  }

  // Analyze overall score trend
  const scores = metricsHistory.filter(m => m.overallScore).map(m => m.overallScore);
  if (scores.length >= 2) {
    const recent = scores.slice(-3).reduce((a, b) => a + b, 0) / Math.min(3, scores.length);
    const older = scores.slice(0, -3).reduce((a, b) => a + b, 0) / Math.max(1, scores.length - 3);

    if (recent > older + 5) {
      trends.push({
        metric: 'overall_score',
        direction: 'improving',
        message: `Overall performance improving: ${Math.round(older)} → ${Math.round(recent)}`
      });
    } else if (recent < older - 5) {
      trends.push({
        metric: 'overall_score',
        direction: 'declining',
        message: `Overall performance declining: ${Math.round(older)} → ${Math.round(recent)}`
      });
    }
  }

  return { trends, needsMoreData: false };
}

/**
 * Compute derived metrics
 */
function computeDerivedMetrics(metrics) {
  const computed = {};

  // Discovery completeness
  if (metrics.discoveryDepth) {
    const statuses = Object.values(metrics.discoveryDepth);
    computed.discoveryCompleteness =
      (statuses.filter(s => s === 'identified').length * 1 +
       statuses.filter(s => s === 'partial').length * 0.5) / statuses.length;
  }

  // Question ratio (discovery + clarifying vs filler)
  if (metrics.questions) {
    const good = (metrics.questions.discovery?.length || 0) +
                 (metrics.questions.clarifying?.length || 0) +
                 (metrics.questions.closing?.length || 0);
    const filler = metrics.questions.filler?.length || 0;
    computed.questionQualityRatio = good / Math.max(1, good + filler);
  }

  // Call quality score
  computed.callQualityScore = metrics.overallScore || calculateCallScore(metrics);

  return computed;
}

/**
 * Calculate call quality score if not provided
 */
function calculateCallScore(metrics) {
  let score = 50; // Base score

  // Talk ratio impact (+/- 10)
  if (metrics.talkRatio) {
    if (metrics.talkRatio >= 0.35 && metrics.talkRatio <= 0.50) {
      score += 10;
    } else if (metrics.talkRatio < 0.30 || metrics.talkRatio > 0.60) {
      score -= 10;
    }
  }

  // Question quality impact (+/- 15)
  if (metrics.questions?.quality) {
    const qualityScores = { excellent: 15, good: 10, fair: 0, poor: -10 };
    score += qualityScores[metrics.questions.quality] || 0;
  }

  // Listening score impact (+/- 10)
  if (metrics.listening?.score) {
    score += (metrics.listening.score - 0.5) * 20;
  }

  // Next steps impact (+/- 10)
  if (metrics.nextSteps) {
    if (metrics.nextSteps.established && metrics.nextSteps.specific) {
      score += 10;
    } else if (!metrics.nextSteps.established) {
      score -= 10;
    }
  }

  // Strong moments bonus
  if (metrics.strongMoments?.length > 2) {
    score += 5;
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Get discovery question suggestion for a topic
 */
function getDiscoveryQuestion(topic) {
  const questions = {
    pain: 'Try: "What challenges are you facing with X today?"',
    impact: 'Try: "What happens if this problem isn\'t solved?"',
    timeline: 'Try: "When do you need to have a solution in place?"',
    budget: 'Try: "Has budget been allocated for this initiative?"',
    process: 'Try: "What does your evaluation process typically look like?"',
    competition: 'Try: "What other solutions are you considering?"'
  };
  return questions[topic] || `Explore: ${topic}`;
}

/**
 * Get default metrics when analysis fails
 */
function getDefaultMetrics() {
  return {
    talkRatio: null,
    talkRatioAssessment: 'unknown',
    questions: {
      discovery: [],
      clarifying: [],
      closing: [],
      filler: [],
      quality: 'unknown',
      missedOpportunities: []
    },
    listening: {
      score: null,
      builtOnProspectPoints: null,
      interruptions: null,
      missedFollowups: []
    },
    discoveryDepth: {
      pain: 'unknown',
      impact: 'unknown',
      timeline: 'unknown',
      budget: 'unknown',
      process: 'unknown',
      competition: 'unknown'
    },
    strongMoments: [],
    improvementAreas: [],
    objections: [],
    nextSteps: {
      established: null,
      specific: null,
      commitment: null,
      owner: null
    },
    overallScore: null,
    topPriority: null,
    computed: {}
  };
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
  analyzeMetrics,
  saveComprehensiveMetrics,
  getCoachingRecommendations,
  analyzeImprovementTrends
};
