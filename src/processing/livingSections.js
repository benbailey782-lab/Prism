/**
 * Living Sections - AI-generated cached profiles
 * Phase 3: Track C
 */

import * as queries from '../db/queries.js';
import crypto from 'crypto';

/**
 * Section types for different entities
 */
const SECTION_TYPES = {
  // Deal sections
  DEAL_SUMMARY: 'deal_summary',
  MEDDPICC_ANALYSIS: 'meddpicc_analysis',
  RISK_ASSESSMENT: 'risk_assessment',
  NEXT_ACTIONS: 'next_actions',

  // Person sections
  PERSON_SUMMARY: 'person_summary',
  INTERACTION_HIGHLIGHTS: 'interaction_highlights',
  TALKING_POINTS: 'talking_points',

  // Global sections
  WEEKLY_DIGEST: 'weekly_digest',
  COACHING_REPORT: 'coaching_report',
  ICP_UPDATE: 'icp_update'
};

/**
 * Compute a hash of input data for staleness detection
 */
function computeDataHash(data) {
  const str = typeof data === 'string' ? data : JSON.stringify(data);
  return crypto.createHash('md5').update(str).digest('hex');
}

/**
 * Get or generate a living section
 */
export async function getLivingSection(entityType, entityId, sectionType, callAI, forceRegenerate = false) {
  // Check for existing section
  const existing = queries.getLivingSection(entityType, entityId, sectionType);

  if (existing && !existing.is_stale && !forceRegenerate) {
    return {
      content: existing.content,
      generatedAt: existing.generated_at,
      isStale: false,
      isRefreshing: false
    };
  }

  // If stale or missing, generate new content
  const isRefreshing = existing && existing.is_stale;

  // Return stale content immediately while regenerating in background
  if (isRefreshing && existing.content) {
    // Trigger async regeneration
    regenerateSectionAsync(entityType, entityId, sectionType, callAI).catch(err => {
      console.error(`Background regeneration failed for ${entityType}/${entityId}/${sectionType}:`, err.message);
    });

    return {
      content: existing.content,
      generatedAt: existing.generated_at,
      isStale: true,
      isRefreshing: true
    };
  }

  // No existing content - must generate synchronously
  try {
    const newContent = await generateSection(entityType, entityId, sectionType, callAI);
    return {
      content: newContent.content,
      generatedAt: new Date().toISOString(),
      isStale: false,
      isRefreshing: false
    };
  } catch (err) {
    console.error(`Section generation failed for ${entityType}/${entityId}/${sectionType}:`, err.message);
    return {
      content: null,
      error: err.message,
      isStale: true,
      isRefreshing: false
    };
  }
}

/**
 * Regenerate section asynchronously
 */
async function regenerateSectionAsync(entityType, entityId, sectionType, callAI) {
  await generateSection(entityType, entityId, sectionType, callAI);
}

/**
 * Generate a section based on type
 */
async function generateSection(entityType, entityId, sectionType, callAI) {
  let content;
  let dataHash;

  switch (entityType) {
    case 'deal':
      ({ content, dataHash } = await generateDealSection(entityId, sectionType, callAI));
      break;
    case 'person':
      ({ content, dataHash } = await generatePersonSection(entityId, sectionType, callAI));
      break;
    case 'global_insights':
      ({ content, dataHash } = await generateGlobalSection(sectionType, callAI));
      break;
    default:
      throw new Error(`Unknown entity type: ${entityType}`);
  }

  // Save to database
  queries.saveLivingSection({
    entityType,
    entityId,
    sectionType,
    content,
    dataHash
  });

  return { content, dataHash };
}

/**
 * Generate deal sections
 */
async function generateDealSection(dealId, sectionType, callAI) {
  const deal = queries.getDeal(dealId);
  if (!deal) throw new Error(`Deal not found: ${dealId}`);

  const meddpicc = queries.getDealMeddpicc(dealId);
  const segments = queries.getSegmentsForDeal(dealId);

  // Compute hash for staleness tracking
  const inputData = {
    deal: { status: deal.status, value: deal.value_amount, updated: deal.updated_at },
    meddpicc: meddpicc.map(m => ({ letter: m.letter, status: m.status, confidence: m.confidence })),
    segmentCount: segments.length,
    lastSegment: segments[0]?.id,
    segmentContentHash: crypto.createHash('md5')
      .update(segments.slice(0, 10).map(s => s.summary || s.content?.substring(0, 100) || '').join('|'))
      .digest('hex')
  };
  const dataHash = computeDataHash(inputData);

  // Build context for AI
  const meddpiccContext = meddpicc.map(m => {
    const names = {
      'M': 'Metrics', 'E': 'Economic Buyer', 'D1': 'Decision Criteria',
      'D2': 'Decision Process', 'P': 'Paper Process', 'I': 'Identified Pain',
      'C1': 'Champion', 'C2': 'Competition'
    };
    return `${m.letter} (${names[m.letter]}): ${m.status}${m.evidence ? ` - "${m.evidence.substring(0, 200)}"` : ''}`;
  }).join('\n');

  const segmentContext = segments.slice(0, 10).map(s =>
    `[${s.knowledge_type}] ${s.summary || s.content?.substring(0, 200) || 'No content'}`
  ).join('\n');

  let prompt;
  let content;

  switch (sectionType) {
    case SECTION_TYPES.DEAL_SUMMARY:
      prompt = `Generate a 3-paragraph executive briefing for this sales deal.

Deal: ${deal.company_name}
Value: $${deal.value_amount || 'TBD'}
Status: ${deal.status}
Contact: ${deal.contact_name || 'Unknown'} (${deal.contact_role || 'Unknown role'})
Expected Close: ${deal.expected_close_date || 'Not set'}

MEDDPICC Status:
${meddpiccContext}

Recent Intelligence:
${segmentContext || 'No segments recorded yet'}

Write a natural language briefing with:
1. Situation overview (what's the deal about, where are we)
2. MEDDPICC status assessment (what's strong, what's missing)
3. Recommended next steps and path forward

Be concise and actionable. Write in natural prose, not bullet points.`;

      content = await callAI(prompt, { maxTokens: 800, temperature: 0.7 });
      break;

    case SECTION_TYPES.MEDDPICC_ANALYSIS:
      prompt = `Analyze the MEDDPICC qualification status for this deal.

Deal: ${deal.company_name}

Current MEDDPICC Status:
${meddpiccContext}

For each MEDDPICC element, provide:
1. Current status assessment
2. Evidence summary (if available)
3. Key questions to ask to strengthen this element

Format as JSON:
{
  "elements": [
    {
      "letter": "M",
      "name": "Metrics",
      "status": "identified|partial|unknown",
      "assessment": "Brief assessment...",
      "evidence": "Evidence if available...",
      "questions": ["Question to ask..."]
    }
  ],
  "biggestGaps": ["M", "P"],
  "priorityQuestions": ["Top question to ask..."]
}`;

      const meddpiccResponse = await callAI(prompt, { maxTokens: 1500, temperature: 0.3 });

      // Parse JSON from response
      try {
        let jsonStr = meddpiccResponse;
        const codeBlockMatch = meddpiccResponse.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (codeBlockMatch) jsonStr = codeBlockMatch[1];
        else {
          const jsonMatch = meddpiccResponse.match(/\{[\s\S]*\}/);
          if (jsonMatch) jsonStr = jsonMatch[0];
        }
        content = JSON.parse(jsonStr);
      } catch (e) {
        content = { raw: meddpiccResponse, parseError: true };
      }
      break;

    case SECTION_TYPES.RISK_ASSESSMENT:
      // Calculate risk based on MEDDPICC gaps
      const identifiedCount = meddpicc.filter(m => m.status === 'identified').length;
      const partialCount = meddpicc.filter(m => m.status === 'partial').length;
      const unknownCount = meddpicc.filter(m => m.status === 'unknown').length;

      // Calculate days since last activity
      const lastActivity = deal.last_activity_at ? new Date(deal.last_activity_at) : new Date(deal.updated_at);
      const daysSinceActivity = Math.floor((Date.now() - lastActivity) / (1000 * 60 * 60 * 24));

      let riskLevel = 'low';
      const riskFactors = [];

      if (unknownCount >= 4) {
        riskLevel = 'high';
        riskFactors.push(`${unknownCount} MEDDPICC elements still unknown`);
      } else if (unknownCount >= 2) {
        riskLevel = 'medium';
        riskFactors.push(`${unknownCount} MEDDPICC elements need discovery`);
      }

      if (daysSinceActivity > 14) {
        riskLevel = riskLevel === 'low' ? 'medium' : 'high';
        riskFactors.push(`${daysSinceActivity} days since last activity`);
      }

      // Check for critical gaps
      const economicBuyer = meddpicc.find(m => m.letter === 'E');
      if (economicBuyer?.status === 'unknown') {
        riskLevel = 'high';
        riskFactors.push('Economic Buyer not identified');
      }

      const champion = meddpicc.find(m => m.letter === 'C1');
      if (champion?.status === 'unknown') {
        if (riskLevel !== 'high') riskLevel = 'medium';
        riskFactors.push('No Champion identified');
      }

      content = {
        riskLevel,
        riskFactors,
        meddpiccScore: {
          identified: identifiedCount,
          partial: partialCount,
          unknown: unknownCount,
          percentage: Math.round((identifiedCount * 100 + partialCount * 50) / 800 * 100)
        },
        daysSinceActivity,
        recommendation: riskLevel === 'high'
          ? 'This deal needs immediate attention. Focus on identifying the gaps.'
          : riskLevel === 'medium'
          ? 'Schedule a discovery call to fill in missing elements.'
          : 'Deal is well-qualified. Maintain momentum.'
      };
      break;

    case SECTION_TYPES.NEXT_ACTIONS:
      prompt = `Based on this deal's current state, suggest 3-5 specific, actionable next steps.

Deal: ${deal.company_name}
Value: $${deal.value_amount || 'TBD'}
Status: ${deal.status}
Contact: ${deal.contact_name || 'Unknown'}

MEDDPICC Status:
${meddpiccContext}

Recent Intelligence:
${segmentContext || 'No segments recorded yet'}

Respond with JSON:
{
  "actions": [
    {
      "priority": 1,
      "action": "Schedule discovery call with...",
      "reason": "To identify Economic Buyer",
      "meddpiccTarget": "E"
    }
  ]
}`;

      const actionsResponse = await callAI(prompt, { maxTokens: 800, temperature: 0.5 });

      try {
        let jsonStr = actionsResponse;
        const codeBlockMatch = actionsResponse.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (codeBlockMatch) jsonStr = codeBlockMatch[1];
        else {
          const jsonMatch = actionsResponse.match(/\{[\s\S]*\}/);
          if (jsonMatch) jsonStr = jsonMatch[0];
        }
        content = JSON.parse(jsonStr);
      } catch (e) {
        content = { raw: actionsResponse, parseError: true };
      }
      break;

    default:
      throw new Error(`Unknown deal section type: ${sectionType}`);
  }

  return { content, dataHash };
}

/**
 * Generate person sections
 */
async function generatePersonSection(personId, sectionType, callAI) {
  const person = queries.getPerson(personId);
  if (!person) throw new Error(`Person not found: ${personId}`);

  const segments = queries.getSegmentsForPerson(personId);

  // Compute hash for staleness tracking
  const inputData = {
    person: { name: person.name, role: person.role, company: person.company, updated: person.updated_at },
    segmentCount: segments.length,
    lastSegment: segments[0]?.id,
    segmentContentHash: crypto.createHash('md5')
      .update(segments.slice(0, 15).map(s => s.summary || s.content?.substring(0, 100) || '').join('|'))
      .digest('hex')
  };
  const dataHash = computeDataHash(inputData);

  const segmentContext = segments.slice(0, 15).map(s =>
    `[${s.knowledge_type}] ${s.summary || s.content?.substring(0, 200) || 'No content'}`
  ).join('\n');

  let prompt;
  let content;

  switch (sectionType) {
    case SECTION_TYPES.PERSON_SUMMARY:
      prompt = `Write a brief profile summary for this contact.

Name: ${person.name}
Role: ${person.role || 'Unknown'}
Company: ${person.company || 'Unknown'}
Relationship: ${person.relationship_type || 'Contact'}
Notes: ${person.notes || 'None'}

Recorded Interactions:
${segmentContext || 'No interactions recorded yet'}

Write 2-3 sentences summarizing:
1. Who this person is and their role in your sales world
2. Key topics you've discussed
3. Relationship health assessment`;

      content = await callAI(prompt, { maxTokens: 300, temperature: 0.7 });
      break;

    case SECTION_TYPES.INTERACTION_HIGHLIGHTS:
      if (segments.length === 0) {
        content = { highlights: [], message: 'No interactions recorded yet' };
        break;
      }

      prompt = `From these recorded interactions, extract the top 5 most important things this person has told you.

Person: ${person.name} (${person.role || 'Unknown role'} at ${person.company || 'Unknown company'})

Interactions:
${segmentContext}

Respond with JSON:
{
  "highlights": [
    {
      "topic": "Budget approval process",
      "insight": "Said they need VP approval for anything over $50k",
      "importance": "high",
      "segmentRef": "segment_id if available"
    }
  ]
}`;

      const highlightsResponse = await callAI(prompt, { maxTokens: 800, temperature: 0.5 });

      try {
        let jsonStr = highlightsResponse;
        const codeBlockMatch = highlightsResponse.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (codeBlockMatch) jsonStr = codeBlockMatch[1];
        else {
          const jsonMatch = highlightsResponse.match(/\{[\s\S]*\}/);
          if (jsonMatch) jsonStr = jsonMatch[0];
        }
        content = JSON.parse(jsonStr);
      } catch (e) {
        content = { raw: highlightsResponse, parseError: true };
      }
      break;

    case SECTION_TYPES.TALKING_POINTS:
      prompt = `Suggest talking points for the next conversation with this person.

Person: ${person.name} (${person.role || 'Unknown role'} at ${person.company || 'Unknown company'})
Relationship: ${person.relationship_type || 'Contact'}

Previous Interactions:
${segmentContext || 'No interactions recorded yet'}

Notes: ${person.notes || 'None'}

Respond with JSON:
{
  "talkingPoints": [
    {
      "topic": "Follow up on budget timeline",
      "context": "They mentioned Q2 budget review",
      "suggestedApproach": "Ask how the review went and if there are any updates"
    }
  ],
  "openQuestions": ["Things you should clarify..."],
  "avoidTopics": ["Things to be careful about..."]
}`;

      const talkingResponse = await callAI(prompt, { maxTokens: 800, temperature: 0.6 });

      try {
        let jsonStr = talkingResponse;
        const codeBlockMatch = talkingResponse.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (codeBlockMatch) jsonStr = codeBlockMatch[1];
        else {
          const jsonMatch = talkingResponse.match(/\{[\s\S]*\}/);
          if (jsonMatch) jsonStr = jsonMatch[0];
        }
        content = JSON.parse(jsonStr);
      } catch (e) {
        content = { raw: talkingResponse, parseError: true };
      }
      break;

    default:
      throw new Error(`Unknown person section type: ${sectionType}`);
  }

  return { content, dataHash };
}

/**
 * Generate global insight sections
 */
async function generateGlobalSection(sectionType, callAI) {
  const stats = queries.getStats();
  const transcripts = queries.getTranscriptsWithMetrics();
  const deals = queries.getAllDeals();
  const patterns = queries.getComputedPatterns();

  const inputData = {
    stats,
    dealCount: deals.length,
    transcriptCount: transcripts.length,
    lastUpdated: new Date().toISOString()
  };
  const dataHash = computeDataHash(inputData);

  let prompt;
  let content;

  switch (sectionType) {
    case SECTION_TYPES.WEEKLY_DIGEST:
      const recentTranscripts = transcripts.slice(0, 10);
      const activeDeals = deals.filter(d => d.status === 'active');

      prompt = `Generate a weekly sales digest summary.

Stats:
- ${stats.totalTranscripts} total transcripts
- ${stats.totalDeals} deals (${activeDeals.length} active)
- ${stats.totalPeople} contacts

Recent Calls:
${recentTranscripts.map(t => `- ${t.filename}: Talk ratio ${t.talk_ratio ? Math.round(t.talk_ratio * 100) + '%' : 'N/A'}`).join('\n')}

Active Deals:
${activeDeals.slice(0, 5).map(d => `- ${d.company_name}: $${d.value_amount || 'TBD'}`).join('\n')}

Write a brief weekly digest (3-4 paragraphs) covering:
1. Activity summary
2. Deal progress highlights
3. Areas to focus on this week`;

      content = await callAI(prompt, { maxTokens: 600, temperature: 0.7 });
      break;

    case SECTION_TYPES.COACHING_REPORT:
      const callsWithMetrics = transcripts.filter(t => t.talk_ratio !== null);
      const avgTalkRatio = callsWithMetrics.length > 0
        ? callsWithMetrics.reduce((sum, t) => sum + t.talk_ratio, 0) / callsWithMetrics.length
        : null;

      const allStrengths = callsWithMetrics.flatMap(t => t.strong_moments || []);
      const allImprovements = callsWithMetrics.flatMap(t => t.improvement_areas || []);

      content = {
        callsAnalyzed: callsWithMetrics.length,
        averageTalkRatio: avgTalkRatio,
        talkRatioTrend: avgTalkRatio ? (avgTalkRatio > 0.5 ? 'talking_more' : avgTalkRatio < 0.35 ? 'listening_more' : 'balanced') : 'unknown',
        topStrengths: [...new Set(allStrengths)].slice(0, 5),
        improvementAreas: [...new Set(allImprovements)].slice(0, 5),
        recommendation: avgTalkRatio > 0.5
          ? 'Focus on asking more questions and listening actively'
          : avgTalkRatio < 0.35
          ? 'Consider sharing more insights and driving the conversation'
          : 'Good balance - keep it up!'
      };
      break;

    case SECTION_TYPES.ICP_UPDATE:
      // Get ICP insight if exists
      const icpInsight = queries.getLatestInsight('icp');

      if (icpInsight && icpInsight.evidence) {
        content = icpInsight.evidence;
      } else {
        content = {
          message: 'Not enough data to generate ICP profile yet',
          suggestion: 'Record more deal outcomes (wins and losses) to build your ICP'
        };
      }
      break;

    default:
      throw new Error(`Unknown global section type: ${sectionType}`);
  }

  return { content, dataHash };
}

/**
 * Mark sections as stale when related data changes
 */
export function markEntitySectionsStale(entityType, entityId) {
  queries.markLivingSectionStale(entityType, entityId);
}

/**
 * Get all sections for an entity
 */
export async function getAllSections(entityType, entityId, callAI) {
  const sections = queries.getAllLivingSections(entityType, entityId);

  // If no sections exist, generate them
  if (sections.length === 0) {
    const sectionTypes = entityType === 'deal'
      ? [SECTION_TYPES.DEAL_SUMMARY, SECTION_TYPES.RISK_ASSESSMENT, SECTION_TYPES.NEXT_ACTIONS]
      : entityType === 'person'
      ? [SECTION_TYPES.PERSON_SUMMARY, SECTION_TYPES.TALKING_POINTS]
      : [SECTION_TYPES.WEEKLY_DIGEST, SECTION_TYPES.COACHING_REPORT];

    const results = [];
    for (const sectionType of sectionTypes) {
      try {
        const section = await getLivingSection(entityType, entityId, sectionType, callAI);
        results.push({ sectionType, ...section });
      } catch (err) {
        results.push({ sectionType, error: err.message });
      }
    }
    return results;
  }

  return sections.map(s => ({
    sectionType: s.section_type,
    content: s.content,
    generatedAt: s.generated_at,
    isStale: !!s.is_stale
  }));
}

/**
 * Force regenerate all sections for an entity
 */
export async function regenerateAllSections(entityType, entityId, callAI) {
  const sectionTypes = entityType === 'deal'
    ? [SECTION_TYPES.DEAL_SUMMARY, SECTION_TYPES.MEDDPICC_ANALYSIS, SECTION_TYPES.RISK_ASSESSMENT, SECTION_TYPES.NEXT_ACTIONS]
    : entityType === 'person'
    ? [SECTION_TYPES.PERSON_SUMMARY, SECTION_TYPES.INTERACTION_HIGHLIGHTS, SECTION_TYPES.TALKING_POINTS]
    : [SECTION_TYPES.WEEKLY_DIGEST, SECTION_TYPES.COACHING_REPORT, SECTION_TYPES.ICP_UPDATE];

  const results = [];
  for (const sectionType of sectionTypes) {
    try {
      const section = await getLivingSection(entityType, entityId, sectionType, callAI, true);
      results.push({ sectionType, ...section });
    } catch (err) {
      results.push({ sectionType, error: err.message });
    }
  }

  return results;
}

export default {
  getLivingSection,
  getAllSections,
  regenerateAllSections,
  markEntitySectionsStale,
  SECTION_TYPES
};
