/**
 * ICP (Ideal Customer Profile) Analyzer
 * Phase 2: Discovers patterns in won/lost deals to identify ideal customers
 */

import {
  getDealsWithOutcome,
  getDealsWithStatus,
  getProspectsWithStatus,
  createInsight,
  getLatestInsight
} from '../db/queries.js';

const ICP_ANALYSIS_PROMPT = `You are analyzing sales data to discover the Ideal Customer Profile.

CLOSED WON DEALS:
{WON_DEALS}

CLOSED LOST DEALS:
{LOST_DEALS}

STALLED/GHOSTED DEALS:
{STALLED_DEALS}

SUCCESSFUL PROSPECTS (converted to deals):
{CONVERTED_PROSPECTS}

UNSUCCESSFUL PROSPECTS (disqualified or no response):
{FAILED_PROSPECTS}

PREVIOUS ICP HYPOTHESIS (if any):
{PREVIOUS_INSIGHT}

Analyze for patterns:

1. COMPANY CHARACTERISTICS
   - Industry patterns
   - Company size patterns
   - Growth stage patterns
   - Tech stack patterns

2. BUYING SIGNALS
   - Which signals predicted success?
   - Which signals were false positives?

3. PERSONAS
   - Which roles/titles were involved in wins?
   - Which personas were missing in losses?

4. TIMING & CONTEXT
   - Any patterns in when/why they bought?
   - Trigger events that led to wins?

5. ANTI-PATTERNS
   - Characteristics that predict failure
   - Warning signs to watch for

If there's a previous hypothesis, evaluate:
- Does new data support or contradict it?
- What refinements are needed?
- Should confidence increase or decrease?

Respond ONLY with valid JSON:
{
  "icp": {
    "summary": "Mid-market FinTech and Healthcare companies (200-1000 employees) with security or compliance pain, especially those currently using a competitor or with recent funding",

    "companyProfile": {
      "industries": ["FinTech", "Healthcare", "SaaS"],
      "industryConfidence": 0.75,
      "employeeRange": {"min": 200, "max": 1000, "sweet_spot": "400-600"},
      "sizeConfidence": 0.8,
      "stages": ["Series A", "Series B", "Growth"],
      "stageConfidence": 0.6
    },

    "buyingSignals": {
      "strongPositive": [
        {"signal": "Currently using competitor", "correlation": 0.85},
        {"signal": "Recent security incident", "correlation": 0.78},
        {"signal": "Compliance deadline", "correlation": 0.72}
      ],
      "weakOrFalse": [
        {"signal": "Recent funding", "note": "Not as predictive as expected, correlation only 0.4"}
      ]
    },

    "personas": {
      "mustHave": ["Security/IT Director level or above"],
      "beneficial": ["CISO involvement", "Business sponsor"],
      "redFlag": ["Only IT admin involved", "No executive sponsor"]
    },

    "antiPatterns": [
      {"pattern": "Company over 2000 employees", "reason": "Procurement delays kill deals"},
      {"pattern": "No identified pain", "reason": "80% of these stall"},
      {"pattern": "Price-only evaluation", "reason": "Usually goes to competitor"}
    ]
  },

  "confidence": 0.72,
  "sampleSize": {"won": 8, "lost": 5, "stalled": 12},
  "dataQuality": "medium",

  "refinementsFromPrevious": [
    "Added Healthcare to industries based on 2 recent wins",
    "Reduced confidence in 'recent funding' signal",
    "Added 'compliance deadline' as strong signal"
  ],

  "recommendedActions": [
    "Deprioritize companies over 2000 employees",
    "Add 'compliance deadline' to prospect signal tracking",
    "Require executive sponsor identification before demo"
  ]
}`;

/**
 * Run ICP analysis on current data
 * @param {function} callAI - AI calling function from processor
 * @returns {object} ICP analysis results
 */
export async function analyzeICP(callAI) {
  // Gather data
  const wonDeals = getDealsWithOutcome('won');
  const lostDeals = getDealsWithOutcome('lost');
  const stalledDeals = getDealsWithStatus('stalled');
  const convertedProspects = getProspectsWithStatus('converted');
  const failedProspects = getProspectsWithStatus(['disqualified', 'archived']);

  // Get previous ICP insight
  const previousInsight = getLatestInsight('icp');

  // Format data for prompt
  const formatDeals = (deals) => {
    if (deals.length === 0) return 'None';
    return deals.slice(0, 20).map(d => `- ${d.company_name}: ${d.value_amount || 'N/A'} value, ${d.notes || 'no notes'}`).join('\n');
  };

  const formatProspects = (prospects) => {
    if (prospects.length === 0) return 'None';
    return prospects.slice(0, 20).map(p =>
      `- ${p.company_name}: ${p.industry || 'Unknown industry'}, ${p.employee_range || 'Unknown size'}, score ${p.score}`
    ).join('\n');
  };

  const prompt = ICP_ANALYSIS_PROMPT
    .replace('{WON_DEALS}', formatDeals(wonDeals))
    .replace('{LOST_DEALS}', formatDeals(lostDeals))
    .replace('{STALLED_DEALS}', formatDeals(stalledDeals))
    .replace('{CONVERTED_PROSPECTS}', formatProspects(convertedProspects))
    .replace('{FAILED_PROSPECTS}', formatProspects(failedProspects))
    .replace('{PREVIOUS_INSIGHT}', previousInsight ? JSON.stringify(previousInsight.evidence) : 'None');

  try {
    const response = await callAI(prompt, { maxTokens: 4096 });
    const analysis = parseJSON(response);

    // Store the insight
    const insightId = createInsight({
      insightType: 'icp',
      category: 'customer_profile',
      title: 'Ideal Customer Profile',
      hypothesis: analysis.icp?.summary || 'ICP analysis completed',
      confidence: analysis.confidence || 0.5,
      evidence: analysis,
      sampleSize: (analysis.sampleSize?.won || 0) + (analysis.sampleSize?.lost || 0) + (analysis.sampleSize?.stalled || 0),
      previousInsightId: previousInsight?.id
    });

    return {
      ...analysis,
      insightId,
      dataUsed: {
        wonDeals: wonDeals.length,
        lostDeals: lostDeals.length,
        stalledDeals: stalledDeals.length,
        convertedProspects: convertedProspects.length,
        failedProspects: failedProspects.length
      }
    };
  } catch (err) {
    console.error('ICP analysis failed:', err.message);
    return {
      error: err.message,
      icp: null,
      confidence: 0,
      sampleSize: {}
    };
  }
}

/**
 * Score a prospect against the current ICP
 * @param {object} prospect - Prospect to score
 * @returns {object} ICP fit score and explanation
 */
export function scoreProspectAgainstICP(prospect) {
  const icpInsight = getLatestInsight('icp');

  if (!icpInsight || !icpInsight.evidence || !icpInsight.evidence.icp) {
    return {
      score: null,
      fit: 'unknown',
      explanation: 'No ICP defined yet - need more data'
    };
  }

  const icp = icpInsight.evidence.icp;
  let score = 50; // Base score
  const matches = [];
  const mismatches = [];

  // Industry match
  if (icp.companyProfile?.industries && prospect.industry) {
    const industryMatch = icp.companyProfile.industries.some(
      ind => prospect.industry.toLowerCase().includes(ind.toLowerCase())
    );
    if (industryMatch) {
      score += 15 * (icp.companyProfile.industryConfidence || 0.7);
      matches.push(`Industry match: ${prospect.industry}`);
    } else {
      score -= 10;
      mismatches.push(`Industry mismatch: ${prospect.industry}`);
    }
  }

  // Company size match
  if (icp.companyProfile?.employeeRange && prospect.employee_count) {
    const { min, max } = icp.companyProfile.employeeRange;
    if (prospect.employee_count >= min && prospect.employee_count <= max) {
      score += 10 * (icp.companyProfile.sizeConfidence || 0.7);
      matches.push(`Size in range: ${prospect.employee_count} employees`);
    } else if (prospect.employee_count < min / 2 || prospect.employee_count > max * 2) {
      score -= 15;
      mismatches.push(`Size far from ideal: ${prospect.employee_count} employees`);
    }
  }

  // Check anti-patterns
  if (icp.antiPatterns) {
    for (const antiPattern of icp.antiPatterns) {
      if (matchesAntiPattern(prospect, antiPattern)) {
        score -= 20;
        mismatches.push(`Anti-pattern: ${antiPattern.pattern}`);
      }
    }
  }

  // Normalize score
  score = Math.max(0, Math.min(100, score));

  // Determine fit level
  let fit = 'medium';
  if (score >= 70) fit = 'high';
  else if (score < 40) fit = 'low';

  return {
    score,
    fit,
    matches,
    mismatches,
    explanation: `ICP fit ${fit} (${score}/100) based on ${matches.length} matches and ${mismatches.length} concerns`
  };
}

/**
 * Check if a prospect matches an anti-pattern
 */
function matchesAntiPattern(prospect, antiPattern) {
  const pattern = antiPattern.pattern.toLowerCase();

  // Employee count patterns
  if (pattern.includes('over') && pattern.includes('employees')) {
    const match = pattern.match(/over (\d+) employees/);
    if (match && prospect.employee_count > parseInt(match[1])) {
      return true;
    }
  }

  if (pattern.includes('under') && pattern.includes('employees')) {
    const match = pattern.match(/under (\d+) employees/);
    if (match && prospect.employee_count < parseInt(match[1])) {
      return true;
    }
  }

  // Industry exclusions
  if (pattern.includes('industry')) {
    const industryMentioned = pattern.split(' ').find(word =>
      prospect.industry?.toLowerCase().includes(word)
    );
    if (industryMentioned) return true;
  }

  return false;
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
  analyzeICP,
  scoreProspectAgainstICP
};
