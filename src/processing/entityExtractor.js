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

    // Deduplicate people extracted from this transcript
    // (AI may extract "Sarah Chen" and "Sarah" as separate entities)
    if (result.people && result.people.length > 1) {
      const deduped = [];
      const merged = new Set();

      for (let i = 0; i < result.people.length; i++) {
        if (merged.has(i)) continue;

        let primary = { ...result.people[i] };

        for (let j = i + 1; j < result.people.length; j++) {
          if (merged.has(j)) continue;

          const other = result.people[j];
          const isSamePerson = checkSamePersonExtracted(primary, other);

          if (isSamePerson) {
            // Merge: keep the more complete record
            primary = mergeExtractedPeople(primary, other);
            merged.add(j);
          }
        }

        deduped.push(primary);
      }

      result.people = deduped;
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

  const nameLower = extracted.name.toLowerCase().trim();

  // Exact name match
  const exactMatch = existing.find(p =>
    p.name.toLowerCase().trim() === nameLower
  );
  if (exactMatch) return exactMatch;

  const nameParts = nameLower.split(/\s+/).filter(p => p.length > 1);
  const extractedCompany = (extracted.company || '').toLowerCase().trim();

  if (nameParts.length > 1) {
    // Strong match: 2+ name parts match (e.g., "Sarah Chen" vs "Sarah C. Chen")
    const strongMatch = existing.find(p => {
      const existingParts = p.name.toLowerCase().split(/\s+/).filter(ep => ep.length > 1);
      const matchingParts = nameParts.filter(part => existingParts.includes(part));
      return matchingParts.length >= 2;
    });
    if (strongMatch) return strongMatch;

    // Medium match: last name matches + same company
    if (extractedCompany) {
      const lastNameCompanyMatch = existing.find(p => {
        const existingParts = p.name.toLowerCase().split(/\s+/);
        const existingCompany = (p.company || '').toLowerCase().trim();
        const lastNameMatches = existingParts[existingParts.length - 1] === nameParts[nameParts.length - 1];
        return lastNameMatches && existingCompany === extractedCompany;
      });
      if (lastNameCompanyMatch) return lastNameCompanyMatch;
    }

    // Abbreviation match: "Sarah C." matches "Sarah Chen" (initial + first name + same company)
    if (extractedCompany) {
      const abbrMatch = existing.find(p => {
        const existingParts = p.name.toLowerCase().split(/\s+/);
        const existingCompany = (p.company || '').toLowerCase().trim();
        if (existingCompany !== extractedCompany) return false;
        // Check if first names match and one side has an initial
        const firstMatch = existingParts[0] === nameParts[0];
        const hasInitial = nameParts.some(p => p.length <= 2) || existingParts.some(p => p.length <= 2);
        return firstMatch && hasInitial;
      });
      if (abbrMatch) return abbrMatch;
    }
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

/**
 * Check if two extracted people are likely the same person
 */
function checkSamePersonExtracted(a, b) {
  const nameA = (a.name || '').toLowerCase().trim();
  const nameB = (b.name || '').toLowerCase().trim();

  // Exact match
  if (nameA === nameB) return true;

  // One name is a subset of the other (e.g., "Sarah" vs "Sarah Chen")
  if (nameA.startsWith(nameB + ' ') || nameB.startsWith(nameA + ' ')) return true;
  if (nameA.endsWith(' ' + nameB) || nameB.endsWith(' ' + nameA)) return true;

  // Same company + same role = likely same person even with different name strings
  if (a.company && b.company && a.role && b.role) {
    if (a.company.toLowerCase() === b.company.toLowerCase() &&
        a.role.toLowerCase() === b.role.toLowerCase()) {
      return true;
    }
  }

  return false;
}

/**
 * Merge two extracted person records, keeping the most complete data
 */
function mergeExtractedPeople(primary, secondary) {
  return {
    name: primary.name.length >= secondary.name.length ? primary.name : secondary.name,
    role: primary.role || secondary.role,
    company: primary.company || secondary.company,
    relationshipType: primary.relationshipType || secondary.relationshipType,
    keyInfo: [...new Set([...(primary.keyInfo || []), ...(secondary.keyInfo || [])])],
    existingMatch: primary.existingMatch || secondary.existingMatch
  };
}

export default {
  extractEntities,
  extractSegmentEntities
};
