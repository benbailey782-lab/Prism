import { getDatabase } from './schema.js';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

// ============================================
// TRANSCRIPT QUERIES
// ============================================

function computeContentHash(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

export function createTranscript({ filename, filepath, rawContent, durationMinutes, callDate, context }) {
  const db = getDatabase();
  const id = uuidv4();
  const contentHash = computeContentHash(rawContent);

  // Check for duplicate content
  const existing = db.prepare('SELECT id FROM transcripts WHERE content_hash = ?').get(contentHash);
  if (existing) {
    db.close();
    return existing.id; // Return existing transcript ID
  }

  const stmt = db.prepare(`
    INSERT INTO transcripts (id, filename, filepath, raw_content, content_hash, duration_minutes, call_date, context)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(id, filename, filepath, rawContent, contentHash, durationMinutes, callDate, context);
  db.close();

  return id;
}

export function getTranscript(id) {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM transcripts WHERE id = ?');
  const result = stmt.get(id);
  db.close();
  return result;
}

export function getAllTranscripts() {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM transcripts ORDER BY created_at DESC');
  const results = stmt.all();
  db.close();
  return results;
}

export function updateTranscript(id, updates) {
  const db = getDatabase();
  const fields = Object.keys(updates).map(k => `${k} = ?`).join(', ');
  const values = Object.values(updates);
  
  const stmt = db.prepare(`UPDATE transcripts SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`);
  stmt.run(...values, id);
  db.close();
}

export function transcriptExists(filepath) {
  const db = getDatabase();
  const stmt = db.prepare('SELECT id FROM transcripts WHERE filepath = ?');
  const result = stmt.get(filepath);
  db.close();
  return !!result;
}

export function transcriptExistsByHash(content) {
  const db = getDatabase();
  const contentHash = computeContentHash(content);
  const stmt = db.prepare('SELECT id FROM transcripts WHERE content_hash = ?');
  const result = stmt.get(contentHash);
  db.close();
  return result ? result.id : null;
}

export function deleteTranscript(id) {
  const db = getDatabase();
  const stmt = db.prepare('DELETE FROM transcripts WHERE id = ?');
  stmt.run(id);
  db.close();
}

// ============================================
// SEGMENT QUERIES
// ============================================

export function createSegment({ transcriptId, content, startTime, endTime, speaker, knowledgeType, summary }) {
  const db = getDatabase();
  const id = uuidv4();
  
  const stmt = db.prepare(`
    INSERT INTO segments (id, transcript_id, content, start_time, end_time, speaker, knowledge_type, summary)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  stmt.run(id, transcriptId, content, startTime, endTime, speaker, knowledgeType, summary);
  db.close();
  
  return id;
}

export function getSegmentsByTranscript(transcriptId) {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM segments WHERE transcript_id = ? ORDER BY start_time');
  const results = stmt.all(transcriptId);
  db.close();
  return results;
}

export function getSegmentsByKnowledgeType(knowledgeType) {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM segments WHERE knowledge_type = ? ORDER BY created_at DESC');
  const results = stmt.all(knowledgeType);
  db.close();
  return results;
}

export function getAllSegments() {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT s.*, t.filename as transcript_filename 
    FROM segments s 
    JOIN transcripts t ON s.transcript_id = t.id 
    ORDER BY s.created_at DESC
  `);
  const results = stmt.all();
  db.close();
  return results;
}

// ============================================
// TAG QUERIES
// ============================================

export function addSegmentTag(segmentId, tag, confidence = 1.0) {
  const db = getDatabase();
  const id = uuidv4();
  
  const stmt = db.prepare(`
    INSERT INTO segment_tags (id, segment_id, tag, confidence)
    VALUES (?, ?, ?, ?)
  `);
  
  stmt.run(id, segmentId, tag, confidence);
  db.close();
  
  return id;
}

export function getSegmentTags(segmentId) {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM segment_tags WHERE segment_id = ?');
  const results = stmt.all(segmentId);
  db.close();
  return results;
}

export function getSegmentsByTag(tag) {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT s.*, st.tag, st.confidence
    FROM segments s
    JOIN segment_tags st ON s.id = st.segment_id
    WHERE st.tag LIKE ?
    ORDER BY st.confidence DESC
  `);
  const results = stmt.all(`%${tag}%`);
  db.close();
  return results;
}

// ============================================
// PEOPLE QUERIES
// ============================================

export function createPerson({ name, role, company, relationshipType, notes }) {
  const db = getDatabase();
  const id = uuidv4();
  
  const stmt = db.prepare(`
    INSERT INTO people (id, name, role, company, relationship_type, notes)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  
  stmt.run(id, name, role, company, relationshipType, notes);
  db.close();
  
  return id;
}

export function getPersonByName(name) {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM people WHERE name LIKE ?');
  const result = stmt.get(`%${name}%`);
  db.close();
  return result;
}

export function getAllPeople(relationshipType = null) {
  const db = getDatabase();
  let stmt;
  if (relationshipType) {
    stmt = db.prepare('SELECT * FROM people WHERE relationship_type = ? ORDER BY name');
    const results = stmt.all(relationshipType);
    db.close();
    return results;
  }
  stmt = db.prepare('SELECT * FROM people ORDER BY name');
  const results = stmt.all();
  db.close();
  return results;
}

export function getPerson(id) {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM people WHERE id = ?');
  const result = stmt.get(id);
  db.close();
  return result;
}

export function updatePerson(id, updates) {
  const db = getDatabase();
  const fields = Object.keys(updates).map(k => `${k} = ?`).join(', ');
  const values = Object.values(updates);

  const stmt = db.prepare(`UPDATE people SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`);
  stmt.run(...values, id);
  db.close();
}

// ============================================
// DEAL QUERIES
// ============================================

export function createDeal({ companyName, contactName, contactRole, status, notes, valueAmount, valueCurrency, expectedCloseDate }) {
  const db = getDatabase();
  const id = uuidv4();

  const stmt = db.prepare(`
    INSERT INTO deals (id, company_name, contact_name, contact_role, status, notes, value_amount, value_currency, expected_close_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(id, companyName, contactName, contactRole, status || 'active', notes, valueAmount, valueCurrency || 'USD', expectedCloseDate);
  db.close();

  // Initialize MEDDPICC letters
  initializeDealMeddpicc(id);

  return id;
}

function initializeDealMeddpicc(dealId) {
  const db = getDatabase();
  const letters = ['M', 'E', 'D1', 'D2', 'P', 'I', 'C1', 'C2'];

  const stmt = db.prepare(`
    INSERT OR IGNORE INTO deal_meddpicc (id, deal_id, letter, status)
    VALUES (?, ?, ?, 'unknown')
  `);

  for (const letter of letters) {
    stmt.run(uuidv4(), dealId, letter);
  }
  db.close();
}

export function getDeal(id) {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM deals WHERE id = ?');
  const result = stmt.get(id);
  db.close();
  return result;
}

export function updateDeal(id, updates) {
  const db = getDatabase();
  const fields = Object.keys(updates).map(k => `${k} = ?`).join(', ');
  const values = Object.values(updates);

  const stmt = db.prepare(`UPDATE deals SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`);
  stmt.run(...values, id);
  db.close();
}

export function getDealByCompany(companyName) {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM deals WHERE company_name LIKE ?');
  const result = stmt.get(`%${companyName}%`);
  db.close();
  return result;
}

export function getAllDeals() {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM deals ORDER BY updated_at DESC');
  const results = stmt.all();
  db.close();
  return results;
}

export function updateDealMeddpicc(dealId, letter, { status, evidence, sourceSegmentId, confidence }) {
  const db = getDatabase();
  const id = uuidv4();

  const stmt = db.prepare(`
    INSERT INTO deal_meddpicc (id, deal_id, letter, status, evidence, source_segment_id, confidence)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(deal_id, letter) DO UPDATE SET
      status = excluded.status,
      evidence = excluded.evidence,
      source_segment_id = excluded.source_segment_id,
      confidence = excluded.confidence,
      updated_at = CURRENT_TIMESTAMP
  `);

  stmt.run(id, dealId, letter, status, evidence, sourceSegmentId, confidence);
  db.close();
}

export function getDealMeddpicc(dealId) {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM deal_meddpicc WHERE deal_id = ?');
  const results = stmt.all(dealId);
  db.close();
  return results;
}

// ============================================
// METRICS QUERIES
// ============================================

export function saveTranscriptMetrics(transcriptId, metrics) {
  const db = getDatabase();
  const id = uuidv4();
  
  const stmt = db.prepare(`
    INSERT INTO transcript_metrics (id, transcript_id, talk_ratio, strong_moments, improvement_areas, questions_asked)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(transcript_id) DO UPDATE SET
      talk_ratio = excluded.talk_ratio,
      strong_moments = excluded.strong_moments,
      improvement_areas = excluded.improvement_areas,
      questions_asked = excluded.questions_asked,
      computed_at = CURRENT_TIMESTAMP
  `);
  
  stmt.run(
    id,
    transcriptId,
    metrics.talkRatio,
    JSON.stringify(metrics.strongMoments || []),
    JSON.stringify(metrics.improvementAreas || []),
    JSON.stringify(metrics.questionsAsked || [])
  );
  db.close();
}

export function getTranscriptMetrics(transcriptId) {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM transcript_metrics WHERE transcript_id = ?');
  const result = stmt.get(transcriptId);
  db.close();
  
  if (result) {
    result.strongMoments = JSON.parse(result.strong_moments || '[]');
    result.improvementAreas = JSON.parse(result.improvement_areas || '[]');
    result.questionsAsked = JSON.parse(result.questions_asked || '[]');
  }
  
  return result;
}

// ============================================
// STATS QUERIES
// ============================================

export function getStats() {
  const db = getDatabase();
  
  const transcriptCount = db.prepare('SELECT COUNT(*) as count FROM transcripts').get().count;
  const segmentCount = db.prepare('SELECT COUNT(*) as count FROM segments').get().count;
  const peopleCount = db.prepare('SELECT COUNT(*) as count FROM people').get().count;
  const dealCount = db.prepare('SELECT COUNT(*) as count FROM deals').get().count;
  
  const knowledgeTypes = db.prepare(`
    SELECT knowledge_type, COUNT(*) as count 
    FROM segments 
    WHERE knowledge_type IS NOT NULL
    GROUP BY knowledge_type
  `).all();
  
  // Convert to object format for easier UI consumption
  const segmentsByType = {};
  knowledgeTypes.forEach(row => {
    segmentsByType[row.knowledge_type] = row.count;
  });
  
  // Calculate average talk ratio
  const avgTalkRatioResult = db.prepare(`
    SELECT AVG(talk_ratio) as avg 
    FROM transcript_metrics 
    WHERE talk_ratio IS NOT NULL
  `).get();
  
  db.close();
  
  return {
    totalTranscripts: transcriptCount,
    totalSegments: segmentCount,
    totalPeople: peopleCount,
    totalDeals: dealCount,
    segmentsByType,
    avgTalkRatio: avgTalkRatioResult?.avg || null
  };
}

export function getSegment(id) {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM segments WHERE id = ?');
  const result = stmt.get(id);
  db.close();
  return result;
}

export function searchSegments(query) {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT s.*, t.filename as transcript_filename
    FROM segments s
    JOIN transcripts t ON s.transcript_id = t.id
    WHERE s.content LIKE ? OR s.summary LIKE ?
    ORDER BY s.created_at DESC
  `);
  const results = stmt.all(`%${query}%`, `%${query}%`);
  db.close();
  return results;
}

export default {
  createTranscript,
  getTranscript,
  getAllTranscripts,
  updateTranscript,
  transcriptExists,
  transcriptExistsByHash,
  deleteTranscript,
  createSegment,
  getSegment,
  getSegmentsByTranscript,
  getSegmentsByKnowledgeType,
  getAllSegments,
  searchSegments,
  addSegmentTag,
  getSegmentTags,
  getSegmentsByTag,
  createPerson,
  getPerson,
  getPersonByName,
  getAllPeople,
  updatePerson,
  createDeal,
  getDeal,
  getDealByCompany,
  getAllDeals,
  updateDeal,
  updateDealMeddpicc,
  getDealMeddpicc,
  saveTranscriptMetrics,
  getTranscriptMetrics,
  getStats
};
