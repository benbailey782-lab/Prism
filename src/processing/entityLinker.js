/**
 * Entity Linking Module
 * Phase 2: Links extracted entities to existing records or creates new ones
 */

import {
  createPerson,
  getPerson,
  getPersonByName,
  updatePerson,
  createDeal,
  getDeal,
  getDealByCompany,
  linkSegmentToPerson,
  linkSegmentToDeal
} from '../db/queries.js';

/**
 * Link extracted entities to database records
 * Creates new records if they don't exist
 * @param {object} extractedEntities - Output from entityExtractor
 * @param {string} transcriptId - Source transcript ID
 * @param {Array} segmentIds - IDs of segments to link
 * @returns {object} Linking results with created/matched IDs
 */
export async function linkEntities(extractedEntities, transcriptId, segmentIds = []) {
  const results = {
    people: [],
    deals: [],
    newRecords: [],
    linkedSegments: []
  };

  // Process people
  if (extractedEntities.people && extractedEntities.people.length > 0) {
    for (const person of extractedEntities.people) {
      const linkedPerson = await linkPerson(person);
      results.people.push(linkedPerson);

      if (linkedPerson.created) {
        results.newRecords.push({ type: 'person', id: linkedPerson.id, name: person.name });
      }

      // Link segments to this person
      for (const segmentId of segmentIds) {
        linkSegmentToPerson(segmentId, linkedPerson.id, person.role);
        results.linkedSegments.push({ segmentId, personId: linkedPerson.id });
      }
    }
  }

  // Process deal context
  if (extractedEntities.dealContext && extractedEntities.dealContext.companyName) {
    const linkedDeal = await linkDeal(extractedEntities.dealContext);
    results.deals.push(linkedDeal);

    if (linkedDeal.created) {
      results.newRecords.push({ type: 'deal', id: linkedDeal.id, name: extractedEntities.dealContext.companyName });
    }

    // Link segments to this deal
    for (const segmentId of segmentIds) {
      linkSegmentToDeal(segmentId, linkedDeal.id);
      results.linkedSegments.push({ segmentId, dealId: linkedDeal.id });
    }
  }

  return results;
}

/**
 * Link or create a person record
 * @param {object} personData - Extracted person data
 * @returns {object} Person record with created flag
 */
async function linkPerson(personData) {
  // Check for existing match
  if (personData.existingMatch) {
    const existing = getPerson(personData.existingMatch);
    if (existing) {
      // Update with any new information
      const updates = {};
      if (personData.role && !existing.role) {
        updates.role = personData.role;
      }
      if (personData.company && !existing.company) {
        updates.company = personData.company;
      }
      if (personData.keyInfo && personData.keyInfo.length > 0) {
        const existingNotes = existing.notes || '';
        const newInfo = personData.keyInfo.join('; ');
        if (!existingNotes.includes(newInfo)) {
          updates.notes = existingNotes ? `${existingNotes}\n${newInfo}` : newInfo;
        }
      }

      if (Object.keys(updates).length > 0) {
        updatePerson(existing.id, updates);
      }

      return { id: existing.id, created: false, updated: Object.keys(updates).length > 0 };
    }
  }

  // Try to find by name
  const existingByName = getPersonByName(personData.name);
  if (existingByName) {
    // Update existing record
    const updates = {};
    if (personData.role && !existingByName.role) {
      updates.role = personData.role;
    }
    if (personData.company && !existingByName.company) {
      updates.company = personData.company;
    }
    if (personData.keyInfo && personData.keyInfo.length > 0) {
      const existingNotes = existingByName.notes || '';
      const newInfo = personData.keyInfo.join('; ');
      if (!existingNotes.includes(newInfo)) {
        updates.notes = existingNotes ? `${existingNotes}\n${newInfo}` : newInfo;
      }
    }

    if (Object.keys(updates).length > 0) {
      updatePerson(existingByName.id, updates);
    }

    return { id: existingByName.id, created: false, updated: Object.keys(updates).length > 0 };
  }

  // Create new person
  const personId = createPerson({
    name: personData.name,
    role: personData.role,
    company: personData.company,
    relationshipType: mapRelationshipType(personData.relationshipType),
    notes: personData.keyInfo ? personData.keyInfo.join('; ') : null
  });

  return { id: personId, created: true, updated: false };
}

/**
 * Link or create a deal record
 * @param {object} dealContext - Extracted deal context
 * @returns {object} Deal record with created flag
 */
async function linkDeal(dealContext) {
  // Check for existing match
  if (dealContext.existingDealMatch) {
    const existing = getDeal(dealContext.existingDealMatch);
    if (existing) {
      return { id: existing.id, created: false };
    }
  }

  // Try to find by company name
  const existingByCompany = getDealByCompany(dealContext.companyName);
  if (existingByCompany) {
    return { id: existingByCompany.id, created: false };
  }

  // Create new deal
  const dealId = createDeal({
    companyName: dealContext.companyName,
    contactName: null,
    contactRole: null,
    status: mapDealStage(dealContext.stage) || 'active',
    notes: dealContext.timeline ? `Timeline: ${dealContext.timeline}` : null,
    valueAmount: dealContext.estimatedValue
  });

  return { id: dealId, created: true };
}

/**
 * Map extracted relationship type to database enum
 */
function mapRelationshipType(type) {
  const mapping = {
    'prospect': 'prospect',
    'colleague': 'colleague',
    'mentor': 'mentor',
    'competitor_contact': 'competitor_contact',
    'customer': 'customer',
    'other': 'other'
  };
  return mapping[type] || 'other';
}

/**
 * Map extracted deal stage to status
 */
function mapDealStage(stage) {
  const mapping = {
    'discovery': 'active',
    'qualification': 'active',
    'demo': 'active',
    'proposal': 'active',
    'negotiation': 'active',
    'closed_won': 'won',
    'closed_lost': 'lost',
    'stalled': 'stalled'
  };
  return mapping[stage] || 'active';
}

/**
 * Link a specific segment to entities based on content analysis
 * @param {string} segmentId - Segment to link
 * @param {object} entities - Entities found in segment
 * @param {object} existingLinks - Existing entity records to match against
 */
export function linkSegmentToEntities(segmentId, entities, existingLinks = {}) {
  // Link to people
  if (entities.people) {
    for (const person of entities.people) {
      const matchedPerson = existingLinks.people?.find(p =>
        p.name.toLowerCase() === person.name?.toLowerCase()
      );
      if (matchedPerson) {
        linkSegmentToPerson(segmentId, matchedPerson.id, person.role);
      }
    }
  }

  // Link to deal
  if (entities.companies && existingLinks.deals) {
    for (const company of entities.companies) {
      const matchedDeal = existingLinks.deals.find(d =>
        d.company_name?.toLowerCase() === company.toLowerCase()
      );
      if (matchedDeal) {
        linkSegmentToDeal(segmentId, matchedDeal.id);
      }
    }
  }
}

export default {
  linkEntities,
  linkSegmentToEntities
};
