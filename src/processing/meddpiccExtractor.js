/**
 * MEDDPICC Signal Detection and Extraction
 * Phase 2: Auto-populates MEDDPICC scorecard from call analysis
 */

import { getDealMeddpicc, updateDealMeddpicc } from '../db/queries.js';

const MEDDPICC_PROMPT = `Analyze this sales conversation for MEDDPICC qualification signals.

TRANSCRIPT:
{TRANSCRIPT_CONTENT}

CURRENT DEAL CONTEXT:
Company: {COMPANY_NAME}
Current MEDDPICC Status: {CURRENT_STATUS}

For each MEDDPICC element, identify any NEW information:

M - METRICS: Quantified business impact, ROI expectations, success criteria
   Look for: numbers, percentages, "reduce by X", "save Y hours", "increase Z"

E - ECONOMIC BUYER: The person who controls budget and can say yes
   Look for: "signs off", "approves", "budget owner", "final decision"

D1 - DECISION CRITERIA: How they will evaluate and choose
   Look for: requirements, must-haves, priorities, evaluation criteria

D2 - DECISION PROCESS: Steps and stages to reach a decision
   Look for: "next steps", "then we'll", "approval process", timeline mentions

P - PAPER PROCESS: Legal, procurement, security review requirements
   Look for: "legal review", "procurement", "security assessment", "vendor process"

I - IDENTIFIED PAIN: The specific problem they're trying to solve
   Look for: frustrations, problems, challenges, "we're struggling with"

C1 - CHAMPION: An internal advocate pushing for your solution
   Look for: enthusiasm, "I'll push for", setting up meetings, sharing info

C2 - COMPETITION: Other vendors or alternatives being considered
   Look for: competitor names, "also looking at", "compared to", "currently using"

Respond ONLY with valid JSON:
{
  "findings": [
    {
      "letter": "M",
      "element": "Metrics",
      "status": "identified",
      "evidence": "Need to reduce security breaches by 50%",
      "verbatim": "We need to cut our breach incidents in half",
      "confidence": 0.9
    },
    {
      "letter": "E",
      "element": "Economic Buyer",
      "status": "partial",
      "evidence": "CFO signs off on purchases over $50k, but name unknown",
      "verbatim": "anything over fifty thousand needs CFO approval",
      "confidence": 0.7
    }
  ],
  "gaps": [
    {
      "letter": "P",
      "element": "Paper Process",
      "suggestedQuestion": "What does your typical procurement timeline look like?"
    }
  ],
  "overallReadiness": 0.65
}`;

const ELEMENT_NAMES = {
  'M': 'Metrics',
  'E': 'Economic Buyer',
  'D1': 'Decision Criteria',
  'D2': 'Decision Process',
  'P': 'Paper Process',
  'I': 'Identified Pain',
  'C1': 'Champion',
  'C2': 'Competition'
};

/**
 * Extract MEDDPICC signals from a transcript
 * @param {object} transcript - Transcript object
 * @param {object} deal - Deal object (or dealContext from entity extraction)
 * @param {function} callAI - AI calling function
 * @returns {object} MEDDPICC findings
 */
export async function extractMeddpicc(transcript, deal, callAI) {
  // Get current MEDDPICC status for the deal
  let currentStatus = {};
  if (deal && deal.id) {
    const meddpiccRows = getDealMeddpicc(deal.id);
    currentStatus = formatMeddpiccStatus(meddpiccRows);
  }

  const prompt = MEDDPICC_PROMPT
    .replace('{TRANSCRIPT_CONTENT}', transcript.raw_content.substring(0, 8000))
    .replace('{COMPANY_NAME}', deal?.company_name || 'Unknown')
    .replace('{CURRENT_STATUS}', JSON.stringify(currentStatus));

  try {
    const response = await callAI(prompt, { maxTokens: 2048 });
    const result = parseJSON(response);

    // Process findings
    if (result.findings && result.findings.length > 0) {
      result.processedFindings = result.findings.map(f => ({
        ...f,
        elementName: ELEMENT_NAMES[f.letter] || f.element,
        isNew: !currentStatus[f.letter] || currentStatus[f.letter].status === 'unknown'
      }));
    }

    return result;
  } catch (err) {
    console.error('MEDDPICC extraction failed:', err.message);
    return {
      findings: [],
      gaps: [],
      overallReadiness: 0
    };
  }
}

/**
 * Update MEDDPICC scorecard for a deal based on extracted findings
 * @param {string} dealId - Deal ID
 * @param {object} meddpiccFindings - Output from extractMeddpicc
 * @param {string} sourceSegmentId - Optional segment ID for evidence linking
 * @returns {object} Update results
 */
export async function updateDealMeddpiccFromFindings(dealId, meddpiccFindings, sourceSegmentId = null) {
  const updates = [];

  if (!meddpiccFindings.findings || meddpiccFindings.findings.length === 0) {
    return { updated: false, updates: [] };
  }

  for (const finding of meddpiccFindings.findings) {
    // Map finding letter to database letter
    const dbLetter = mapFindingLetter(finding.letter);
    if (!dbLetter) continue;

    // Only update if we have meaningful evidence
    if (finding.evidence && finding.confidence >= 0.5) {
      updateDealMeddpicc(dealId, dbLetter, {
        status: finding.status || 'partial',
        evidence: formatEvidence(finding),
        sourceSegmentId: sourceSegmentId,
        confidence: finding.confidence
      });

      updates.push({
        letter: dbLetter,
        status: finding.status,
        confidence: finding.confidence
      });
    }
  }

  return { updated: updates.length > 0, updates };
}

/**
 * Analyze MEDDPICC gaps and suggest next questions
 * @param {string} dealId - Deal ID
 * @param {function} callAI - AI calling function
 * @returns {object} Gap analysis with suggestions
 */
export async function analyzeMeddpiccGaps(dealId, callAI) {
  const meddpiccRows = getDealMeddpicc(dealId);
  const status = formatMeddpiccStatus(meddpiccRows);

  const gaps = [];
  for (const [letter, data] of Object.entries(status)) {
    if (data.status === 'unknown' || data.status === 'partial') {
      gaps.push({
        letter,
        element: ELEMENT_NAMES[letter],
        currentStatus: data.status,
        currentEvidence: data.evidence
      });
    }
  }

  if (gaps.length === 0) {
    return { gaps: [], suggestions: [], readiness: 1.0 };
  }

  const prompt = `For this MEDDPICC qualification, suggest discovery questions for each gap:

GAPS:
${gaps.map(g => `- ${g.element} (${g.letter}): ${g.currentStatus}${g.currentEvidence ? ` - Current: ${g.currentEvidence}` : ''}`).join('\n')}

For each gap, provide 2-3 natural discovery questions to uncover this information.

Respond ONLY with valid JSON:
{
  "suggestions": [
    {
      "letter": "P",
      "element": "Paper Process",
      "questions": [
        "What does your typical vendor approval process look like?",
        "Are there any security or compliance reviews we should be aware of?"
      ],
      "priority": "high"
    }
  ],
  "recommendedFocus": "Start with Paper Process - often the biggest blocker"
}`;

  try {
    const response = await callAI(prompt, { maxTokens: 1024 });
    const result = parseJSON(response);

    // Calculate readiness score
    const identifiedCount = Object.values(status).filter(s => s.status === 'identified').length;
    const readiness = identifiedCount / 8;

    return {
      gaps,
      suggestions: result.suggestions || [],
      recommendedFocus: result.recommendedFocus,
      readiness
    };
  } catch (err) {
    console.error('MEDDPICC gap analysis failed:', err.message);
    return { gaps, suggestions: [], readiness: 0 };
  }
}

/**
 * Get MEDDPICC summary for display
 * @param {string} dealId - Deal ID
 * @returns {object} Formatted MEDDPICC status
 */
export function getMeddpiccSummary(dealId) {
  const rows = getDealMeddpicc(dealId);
  const status = formatMeddpiccStatus(rows);

  const summary = {
    letters: {},
    identifiedCount: 0,
    partialCount: 0,
    unknownCount: 0,
    readiness: 0
  };

  for (const [letter, data] of Object.entries(status)) {
    summary.letters[letter] = {
      name: ELEMENT_NAMES[letter],
      status: data.status,
      evidence: data.evidence,
      confidence: data.confidence
    };

    if (data.status === 'identified') summary.identifiedCount++;
    else if (data.status === 'partial') summary.partialCount++;
    else summary.unknownCount++;
  }

  summary.readiness = (summary.identifiedCount + (summary.partialCount * 0.5)) / 8;

  return summary;
}

/**
 * Format MEDDPICC rows into status object
 */
function formatMeddpiccStatus(rows) {
  const status = {};
  for (const row of rows) {
    status[row.letter] = {
      status: row.status,
      evidence: row.evidence,
      confidence: row.confidence
    };
  }
  return status;
}

/**
 * Map finding letter to database letter
 */
function mapFindingLetter(letter) {
  const normalized = (letter || '').toUpperCase().trim();

  const mapping = {
    'M': 'M',
    'E': 'E',
    'D1': 'D1',
    'D2': 'D2',
    'P': 'P',
    'I': 'I',
    'C1': 'C1',
    'C2': 'C2'
  };

  if (mapping[normalized]) return mapping[normalized];

  // Handle bare D/C with a warning — default but log the ambiguity
  if (normalized === 'D') {
    console.warn('MEDDPICC: AI returned bare "D" instead of D1/D2. Defaulting to D1 (Decision Criteria). Review prompt if this recurs.');
    return 'D1';
  }
  if (normalized === 'C') {
    console.warn('MEDDPICC: AI returned bare "C" instead of C1/C2. Defaulting to C1 (Champion). Review prompt if this recurs.');
    return 'C1';
  }

  console.warn(`MEDDPICC: Unknown letter "${letter}" — skipping this finding.`);
  return null;
}

/**
 * Format evidence for storage
 */
function formatEvidence(finding) {
  let evidence = finding.evidence || '';
  if (finding.verbatim && !evidence.includes(finding.verbatim)) {
    evidence += `\n\nVerbatim: "${finding.verbatim}"`;
  }
  return evidence.trim();
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
  extractMeddpicc,
  updateDealMeddpiccFromFindings,
  analyzeMeddpiccGaps,
  getMeddpiccSummary
};
