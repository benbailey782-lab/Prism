/**
 * Entity Extraction Module
 * Phase 2: Extracts people, companies, and products from transcripts
 */

import { getAllPeople, getAllDeals } from '../db/queries.js';

const ENTITY_EXTRACTION_PROMPT = `Analyze this sales conversation and extract all entities mentioned.

TRANSCRIPT:
{TRANSCRIPT_CONTENT}

KNOWN PEOPLE IN SYSTEM:
{KNOWN_PEOPLE}

KNOWN DEALS IN SYSTEM:
{KNOWN_DEALS}

Extract:
1. PEOPLE - Anyone mentioned by name or role
2. COMPANIES - Any organizations mentioned
3. PRODUCTS - Your products, competitor products, or tools mentioned
4. DEALS - If this relates to a specific opportunity

For each person, determine:
- Name (or role if name unknown, e.g., "the CFO")
- Role/Title if mentioned
- Company affiliation
- Relationship type: prospect, colleague, mentor, competitor_contact, other
- Key information learned about them

For each company, determine:
- Name
- Type: prospect, competitor, partner, customer, other
- Key information learned

Respond ONLY with valid JSON:
{
  "people": [
    {
      "name": "Sarah Chen",
      "role": "Director of IT",
      "company": "Acme Corp",
      "relationshipType": "prospect",
      "keyInfo": ["Leading the evaluation", "Reports to CFO", "Prefers Okta integration"],
      "existingMatch": null
    },
    {
      "name": "CFO",
      "role": "CFO",
      "company": "Acme Corp",
      "relationshipType": "prospect",
      "keyInfo": ["Signs off on purchases over $50k", "Name unknown"],
      "existingMatch": null
    }
  ],
  "companies": [
    {
      "name": "Acme Corp",
      "type": "prospect",
      "keyInfo": ["FinTech company", "Had 3 breaches last year", "500 employees"]
    },
    {
      "name": "Competitor X",
      "type": "competitor",
      "keyInfo": ["Also being evaluated"]
    }
  ],
  "products": [
    {
      "name": "Platform Pro",
      "owner": "us",
      "mentions": ["SSO capabilities", "Okta integration"]
    }
  ],
  "dealContext": {
    "companyName": "Acme Corp",
    "stage": "discovery",
    "estimatedValue": null,
    "timeline": "Q2",
    "existingDealMatch": null
  }
}`;

/**
 * Extract entities from a transcript
 * @param {object} transcript - Transcript object with raw_content
 * @param {function} callAI - AI calling function from processor
 * @returns {object} Extracted entities
 */
export async function extractEntities(transcript, callAI) {
  // Get existing entities for context
  const existingPeople = getAllPeople();
  const existingDeals = getAllDeals();

  const knownPeopleStr = existingPeople.length > 0
    ? existingPeople.map(p => `- ${p.name} (${p.company || 'unknown company'}, ${p.relationship_type || 'unknown'})`).join('\n')
    : 'None';

  const knownDealsStr = existingDeals.length > 0
    ? existingDeals.map(d => `- ${d.company_name} (${d.status})`).join('\n')
    : 'None';

  const prompt = ENTITY_EXTRACTION_PROMPT
    .replace('{TRANSCRIPT_CONTENT}', transcript.raw_content.substring(0, 8000)) // Truncate for context length
    .replace('{KNOWN_PEOPLE}', knownPeopleStr)
    .replace('{KNOWN_DEALS}', knownDealsStr);

  try {
    const response = await callAI(prompt, { maxTokens: 2048 });
    const result = parseJSON(response);

    // Enhance with matching existing entities
    if (result.people) {
      for (const person of result.people) {
        const match = findPersonMatch(person, existingPeople);
        if (match) {
          person.existingMatch = match.id;
        }
      }
    }

    if (result.dealContext && result.dealContext.companyName) {
      const dealMatch = existingDeals.find(d =>
        d.company_name.toLowerCase() === result.dealContext.companyName.toLowerCase()
      );
      if (dealMatch) {
        result.dealContext.existingDealMatch = dealMatch.id;
      }
    }

    return result;
  } catch (err) {
    console.error('Entity extraction failed:', err.message);
    return {
      people: [],
      companies: [],
      products: [],
      dealContext: null
    };
  }
}

/**
 * Extract entities from a single segment
 * @param {object} segment - Segment with content
 * @param {object} context - Context (transcript info, existing entities)
 * @param {function} callAI - AI calling function
 * @returns {object} Extracted entities
 */
export async function extractSegmentEntities(segment, context, callAI) {
  const prompt = `Extract entities mentioned in this segment of a sales conversation.

SEGMENT:
${segment.content}

CONTEXT:
Source: ${context.source || 'Unknown'}
Deal: ${context.dealName || 'Unknown'}

Identify any:
1. People mentioned (name, role, company)
2. Companies mentioned
3. Products or competitors mentioned

Respond ONLY with valid JSON:
{
  "people": [{"name": "...", "role": "...", "company": "..."}],
  "companies": ["..."],
  "products": ["..."]
}`;

  try {
    const response = await callAI(prompt, { maxTokens: 512 });
    return parseJSON(response);
  } catch (err) {
    console.error('Segment entity extraction failed:', err.message);
    return { people: [], companies: [], products: [] };
  }
}

/**
 * Find a matching person in existing records
 * @param {object} extracted - Extracted person data
 * @param {Array} existing - Existing people records
 * @returns {object|null} Matching person or null
 */
function findPersonMatch(extracted, existing) {
  if (!extracted.name) return null;

  const nameLower = extracted.name.toLowerCase();

  // Exact name match
  const exactMatch = existing.find(p =>
    p.name.toLowerCase() === nameLower
  );
  if (exactMatch) return exactMatch;

  // Partial name match (first name or last name)
  const nameParts = nameLower.split(' ');
  if (nameParts.length > 1) {
    const partialMatch = existing.find(p => {
      const existingParts = p.name.toLowerCase().split(' ');
      return nameParts.some(part =>
        existingParts.includes(part) && part.length > 2
      );
    });
    if (partialMatch) return partialMatch;
  }

  // Match by role + company (for unknown names like "the CFO")
  if (extracted.role && extracted.company) {
    const roleMatch = existing.find(p =>
      p.role?.toLowerCase() === extracted.role.toLowerCase() &&
      p.company?.toLowerCase() === extracted.company.toLowerCase()
    );
    if (roleMatch) return roleMatch;
  }

  return null;
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
  extractEntities,
  extractSegmentEntities
};
