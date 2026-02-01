/**
 * Query Engine - Smart retrieval-augmented query pipeline
 * Phase 3: Track A
 */

import * as queries from '../db/queries.js';
import crypto from 'crypto';

/**
 * Intent types for query classification
 */
const INTENT_TYPES = {
  DEAL_STRATEGY: 'deal_strategy',
  KNOWLEDGE_RETRIEVAL: 'knowledge_retrieval',
  PEOPLE_INTEL: 'people_intel',
  COACHING: 'coaching',
  COMPETITIVE: 'competitive',
  OBJECTION: 'objection',
  GENERAL: 'general'
};

/**
 * Detect the intent of a user query
 */
async function detectIntent(query, callAI) {
  const prompt = `Classify this sales intelligence query into one of these intents:

- deal_strategy: Questions about specific deals, deal status, strategy, or MEDDPICC (e.g., "Build me a strategy for the Acme deal", "What's the status of my deals?")
- knowledge_retrieval: Questions about product knowledge, features, how things work (e.g., "How does our SSO work?", "What did we learn about pricing?")
- people_intel: Questions about specific people, contacts, relationships (e.g., "What did James tell me about procurement?", "Who are my key contacts?")
- coaching: Questions about performance, talk ratio, patterns, self-improvement (e.g., "What patterns do you see in my calls?", "How's my talk ratio trending?")
- competitive: Questions about competitors (e.g., "What do I know about Competitor X?")
- objection: Questions about handling objections (e.g., "How have I handled pricing objections?")
- general: Anything else

Also extract any entity hints from the query:
- Company names mentioned
- Person names mentioned
- MEDDPICC letters mentioned (M, E, D1, D2, P, I, C1, C2)
- Knowledge types mentioned
- Time ranges mentioned

Query: "${query}"

Respond ONLY with valid JSON:
{
  "intent": "deal_strategy",
  "confidence": 0.9,
  "entities": {
    "companies": ["Acme Corp"],
    "people": ["James"],
    "meddpicc_letters": ["M", "E"],
    "knowledge_types": [],
    "time_range": null
  }
}`;

  try {
    const response = await callAI(prompt, { maxTokens: 500, temperature: 0.3 });

    // Extract JSON from response
    let jsonStr = response;
    const codeBlockMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      jsonStr = codeBlockMatch[1];
    } else {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonStr = jsonMatch[0];
      }
    }

    return JSON.parse(jsonStr);
  } catch (err) {
    console.error('Intent detection failed:', err.message);
    return { intent: INTENT_TYPES.GENERAL, confidence: 0.5, entities: {} };
  }
}

/**
 * Retrieve relevant context based on intent
 */
function retrieveContext(intent, entities) {
  const context = {
    deals: [],
    people: [],
    segments: [],
    transcripts: [],
    patterns: [],
    prospects: [],
    meddpicc: null
  };

  const sources = [];

  try {
    switch (intent.intent) {
      case INTENT_TYPES.DEAL_STRATEGY: {
        // Get specific deal if mentioned
        if (entities.companies && entities.companies.length > 0) {
          for (const company of entities.companies) {
            const deal = queries.getDealByCompany(company);
            if (deal) {
              context.deals.push(deal);
              context.meddpicc = queries.getDealMeddpicc(deal.id);
              const dealSegments = queries.getSegmentsForDeal(deal.id);
              context.segments.push(...dealSegments.slice(0, 10));
              sources.push({ type: 'deal', id: deal.id, name: deal.company_name, relevance: 0.95 });
            }
          }
        }
        // If no specific deal, get all active deals
        if (context.deals.length === 0) {
          const allDeals = queries.getAllDeals();
          context.deals = allDeals.slice(0, 5);
          for (const deal of context.deals) {
            sources.push({ type: 'deal', id: deal.id, name: deal.company_name, relevance: 0.7 });
          }
        }
        break;
      }

      case INTENT_TYPES.KNOWLEDGE_RETRIEVAL: {
        // Search segments by knowledge type
        const productSegments = queries.getSegmentsByKnowledgeType('product_knowledge');
        context.segments = productSegments.slice(0, 15);

        // If specific keywords, search segments
        if (entities.knowledge_types && entities.knowledge_types.length > 0) {
          for (const kt of entities.knowledge_types) {
            const ktSegments = queries.getSegmentsByKnowledgeType(kt);
            context.segments.push(...ktSegments.slice(0, 5));
          }
        }

        for (const seg of context.segments) {
          sources.push({
            type: 'segment',
            id: seg.id,
            transcriptFilename: seg.transcript_filename,
            snippet: seg.content?.substring(0, 100),
            relevance: seg.confidence || 0.8
          });
        }
        break;
      }

      case INTENT_TYPES.PEOPLE_INTEL: {
        // Get specific person if mentioned
        if (entities.people && entities.people.length > 0) {
          for (const personName of entities.people) {
            const person = queries.getPersonByName(personName);
            if (person) {
              context.people.push(person);
              const personSegments = queries.getSegmentsForPerson(person.id);
              context.segments.push(...personSegments.slice(0, 10));
              sources.push({ type: 'person', id: person.id, name: person.name, relevance: 0.95 });
            }
          }
        }
        // Get all contacts if no specific person
        if (context.people.length === 0) {
          context.people = queries.getAllPeople().slice(0, 10);
          for (const p of context.people) {
            sources.push({ type: 'person', id: p.id, name: p.name, relevance: 0.6 });
          }
        }
        break;
      }

      case INTENT_TYPES.COACHING: {
        // Get transcripts with metrics
        context.transcripts = queries.getTranscriptsWithMetrics();
        // Get computed patterns
        context.patterns = queries.getComputedPatterns();

        for (const t of context.transcripts.slice(0, 10)) {
          sources.push({
            type: 'transcript',
            id: t.id,
            name: t.filename,
            relevance: 0.8
          });
        }
        break;
      }

      case INTENT_TYPES.COMPETITIVE: {
        // Search for competitive intel segments
        const compSegments = queries.getSegmentsByKnowledgeType('competitive_intel');
        context.segments = compSegments.slice(0, 15);

        // Also search by company name if provided
        if (entities.companies && entities.companies.length > 0) {
          for (const company of entities.companies) {
            const searchResults = queries.searchSegments(company);
            context.segments.push(...searchResults.slice(0, 5));
          }
        }

        for (const seg of context.segments) {
          sources.push({
            type: 'segment',
            id: seg.id,
            transcriptFilename: seg.transcript_filename,
            snippet: seg.content?.substring(0, 100),
            relevance: seg.confidence || 0.8
          });
        }
        break;
      }

      case INTENT_TYPES.OBJECTION: {
        // Search segments with objection tags
        const objectionSegments = queries.getSegmentsByTag('objection');
        context.segments = objectionSegments.slice(0, 15);

        // Also get sales insight segments
        const salesInsights = queries.getSegmentsByKnowledgeType('sales_insight');
        context.segments.push(...salesInsights.slice(0, 10));

        for (const seg of context.segments) {
          sources.push({
            type: 'segment',
            id: seg.id,
            transcriptFilename: seg.transcript_filename,
            snippet: seg.content?.substring(0, 100),
            relevance: seg.confidence || 0.75
          });
        }
        break;
      }

      default: {
        // General query - get a sample of everything
        context.deals = queries.getAllDeals().slice(0, 5);
        context.people = queries.getAllPeople().slice(0, 5);
        const allProspects = queries.getAllProspects ? queries.getAllProspects({ limit: 5 }) : [];
        context.prospects = allProspects;
        context.transcripts = queries.getAllTranscripts().slice(0, 5);

        const stats = queries.getStats();
        sources.push({ type: 'stats', relevance: 0.7, summary: `${stats.totalDeals} deals, ${stats.totalPeople} contacts` });
        break;
      }
    }
  } catch (err) {
    console.error('Context retrieval error:', err.message);
  }

  // De-duplicate sources by id
  const uniqueSources = [];
  const seenIds = new Set();
  for (const source of sources) {
    if (source.id && !seenIds.has(source.id)) {
      seenIds.add(source.id);
      uniqueSources.push(source);
    } else if (!source.id) {
      uniqueSources.push(source);
    }
  }

  return { context, sources: uniqueSources.slice(0, 20) };
}

/**
 * Build the synthesis prompt based on context
 */
function buildSynthesisPrompt(query, intent, context, sources) {
  let contextText = '';

  // Add deals context
  if (context.deals.length > 0) {
    contextText += '\n## Active Deals\n';
    for (const deal of context.deals) {
      contextText += `- **${deal.company_name}**: $${deal.value_amount || 'TBD'}, Status: ${deal.status}, Contact: ${deal.contact_name || 'Unknown'}\n`;
    }
  }

  // Add MEDDPICC context
  if (context.meddpicc && context.meddpicc.length > 0) {
    contextText += '\n## MEDDPICC Scorecard\n';
    const letterNames = {
      'M': 'Metrics', 'E': 'Economic Buyer', 'D1': 'Decision Criteria',
      'D2': 'Decision Process', 'P': 'Paper Process', 'I': 'Identified Pain',
      'C1': 'Champion', 'C2': 'Competition'
    };
    for (const m of context.meddpicc) {
      const status = m.status === 'identified' ? 'Identified' : m.status === 'partial' ? 'Partial' : 'Unknown';
      contextText += `- **${m.letter} (${letterNames[m.letter]})**: ${status}${m.evidence ? ` - ${m.evidence.substring(0, 100)}` : ''}\n`;
    }
  }

  // Add people context
  if (context.people.length > 0) {
    contextText += '\n## Key Contacts\n';
    for (const person of context.people) {
      contextText += `- **${person.name}** (${person.relationship_type || 'contact'}): ${person.role || ''} at ${person.company || 'Unknown'}${person.notes ? ` - ${person.notes.substring(0, 100)}` : ''}\n`;
    }
  }

  // Add segments context
  if (context.segments.length > 0) {
    contextText += '\n## Relevant Knowledge\n';
    for (const seg of context.segments.slice(0, 10)) {
      const source = seg.transcript_filename || 'Unknown source';
      contextText += `- [Source: ${source}, ${seg.id}] ${seg.summary || seg.content?.substring(0, 150) || 'No content'}\n`;
    }
  }

  // Add transcripts/metrics context for coaching
  if (context.transcripts.length > 0 && intent.intent === INTENT_TYPES.COACHING) {
    contextText += '\n## Call Metrics\n';
    for (const t of context.transcripts.slice(0, 5)) {
      if (t.talk_ratio !== null && t.talk_ratio !== undefined) {
        contextText += `- **${t.filename}**: Talk ratio: ${Math.round(t.talk_ratio * 100)}%`;
        if (t.strong_moments && t.strong_moments.length > 0) {
          contextText += `, Strengths: ${t.strong_moments.slice(0, 2).join(', ')}`;
        }
        contextText += '\n';
      }
    }
  }

  // Add patterns context
  if (context.patterns.length > 0) {
    contextText += '\n## Detected Patterns\n';
    for (const pattern of context.patterns.slice(0, 5)) {
      const data = pattern.pattern_data;
      contextText += `- **${pattern.pattern_type}**: ${typeof data === 'string' ? data : JSON.stringify(data).substring(0, 100)}\n`;
    }
  }

  // Add prospects context
  if (context.prospects.length > 0) {
    contextText += '\n## Prospects\n';
    for (const p of context.prospects) {
      contextText += `- **${p.company_name}**: Tier ${p.tier || 3}, Score: ${p.score || 0}\n`;
    }
  }

  // Cap context to roughly 3000 tokens (~12000 chars)
  if (contextText.length > 12000) {
    contextText = contextText.substring(0, 12000) + '\n...[context truncated]';
  }

  const intentInstructions = {
    [INTENT_TYPES.DEAL_STRATEGY]: `For deal strategy queries:
- Structure your response with MEDDPICC gaps, next steps, and risks
- Be specific about what's missing and what needs to happen next
- Reference specific sources using [Source: filename, segment_id] notation`,

    [INTENT_TYPES.COACHING]: `For coaching queries:
- Include specific call references and trends
- Be constructive and actionable
- Reference specific metrics and patterns`,

    [INTENT_TYPES.GENERAL]: `For general queries:
- Answer naturally and concisely
- Reference specific sources when available`
  };

  const instruction = intentInstructions[intent.intent] || intentInstructions[INTENT_TYPES.GENERAL];

  return `You are Sales Brain, a personal sales intelligence assistant. Answer the user's question based ONLY on the following context from their sales data. Be concise and actionable.

${instruction}

If you don't have enough information to answer fully, say so honestly and suggest what data would help.

${contextText}

User Question: ${query}

Provide a clear, actionable answer:`;
}

/**
 * Generate follow-up question suggestions
 */
function generateFollowUps(intent, context) {
  const followUps = [];

  if (intent.intent === INTENT_TYPES.DEAL_STRATEGY && context.deals.length > 0) {
    const deal = context.deals[0];
    followUps.push(`What's the paper process for ${deal.company_name}?`);
    followUps.push(`Who else should I be talking to at ${deal.company_name}?`);
    followUps.push(`What competitive threats exist for this deal?`);
  }

  if (intent.intent === INTENT_TYPES.PEOPLE_INTEL && context.people.length > 0) {
    const person = context.people[0];
    followUps.push(`When was my last interaction with ${person.name}?`);
    followUps.push(`What deals is ${person.name} involved in?`);
  }

  if (intent.intent === INTENT_TYPES.COACHING) {
    followUps.push(`What questions should I be asking more?`);
    followUps.push(`Show me my best performing calls`);
    followUps.push(`What patterns lead to won deals?`);
  }

  // Generic fallbacks
  if (followUps.length === 0) {
    followUps.push(`What are my top deals this quarter?`);
    followUps.push(`Who should I follow up with today?`);
    followUps.push(`What objections am I hearing most?`);
  }

  return followUps.slice(0, 3);
}

/**
 * Extract visualizations to include in response
 */
function extractVisualizations(intent, context) {
  const visualizations = [];

  if (context.meddpicc && context.deals.length > 0) {
    visualizations.push({
      type: 'meddpicc_scorecard',
      dealId: context.deals[0].id,
      dealName: context.deals[0].company_name
    });
  }

  return visualizations;
}

/**
 * Main query pipeline
 */
export async function processQuery(query, callAI) {
  const startTime = Date.now();

  try {
    // Step 1: Detect intent
    const intent = await detectIntent(query, callAI);

    // Step 2: Retrieve relevant context
    const { context, sources } = retrieveContext(intent, intent.entities || {});

    // Step 3: Build and send synthesis prompt
    const synthesisPrompt = buildSynthesisPrompt(query, intent, context, sources);
    const answer = await callAI(synthesisPrompt, { maxTokens: 1500, temperature: 0.7 });

    // Step 4: Generate follow-ups and extract visualizations
    const followUpQuestions = generateFollowUps(intent, context);
    const visualizations = extractVisualizations(intent, context);

    const responseTimeMs = Date.now() - startTime;

    // Save to query history
    const historyId = queries.createQueryHistory({
      query,
      intent: intent.intent,
      response: answer,
      sources,
      responseTimeMs
    });

    return {
      id: historyId,
      answer,
      intent: intent.intent,
      intentConfidence: intent.confidence,
      sources,
      followUpQuestions,
      visualizations,
      responseTimeMs
    };

  } catch (err) {
    console.error('Query processing failed:', err);
    const responseTimeMs = Date.now() - startTime;

    // Save failed query to history
    queries.createQueryHistory({
      query,
      intent: 'error',
      response: `I encountered an error processing your question: ${err.message}`,
      sources: [],
      responseTimeMs
    });

    throw err;
  }
}

/**
 * Get query history
 */
export function getQueryHistory(options = {}) {
  return queries.getQueryHistory(options);
}

/**
 * Update query feedback
 */
export function submitQueryFeedback(queryId, feedback) {
  queries.updateQueryFeedback(queryId, feedback);
  return { success: true };
}

export default {
  processQuery,
  getQueryHistory,
  submitQueryFeedback,
  INTENT_TYPES
};
