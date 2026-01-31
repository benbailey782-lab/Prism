import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Ensure data directory exists
const dataDir = join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = process.env.DB_PATH || join(dataDir, 'sales-brain.db');

export function initDatabase() {
  const db = new Database(dbPath);
  
  // Enable foreign keys
  db.pragma('foreign_keys = ON');
  
  // ============================================
  // CORE TABLES
  // ============================================
  
  // Transcripts - the raw source files
  db.exec(`
    CREATE TABLE IF NOT EXISTS transcripts (
      id TEXT PRIMARY KEY,
      filename TEXT NOT NULL,
      filepath TEXT NOT NULL,
      raw_content TEXT NOT NULL,
      content_hash TEXT UNIQUE,
      duration_minutes INTEGER,
      call_date DATETIME,
      context TEXT,
      summary TEXT,
      processed_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // Segments - chunks of transcripts tagged by knowledge type
  db.exec(`
    CREATE TABLE IF NOT EXISTS segments (
      id TEXT PRIMARY KEY,
      transcript_id TEXT NOT NULL,
      content TEXT NOT NULL,
      start_time TEXT,
      end_time TEXT,
      speaker TEXT,
      knowledge_type TEXT CHECK(knowledge_type IN (
        'product_knowledge',
        'process_knowledge',
        'people_context',
        'sales_insight',
        'advice_received',
        'decision_rationale',
        'competitive_intel',
        'small_talk',
        'unknown'
      )),
      summary TEXT,
      confidence REAL DEFAULT 1.0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (transcript_id) REFERENCES transcripts(id) ON DELETE CASCADE
    )
  `);
  
  // Segment tags - multiple tags per segment
  db.exec(`
    CREATE TABLE IF NOT EXISTS segment_tags (
      id TEXT PRIMARY KEY,
      segment_id TEXT NOT NULL,
      tag TEXT NOT NULL,
      confidence REAL DEFAULT 1.0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (segment_id) REFERENCES segments(id) ON DELETE CASCADE
    )
  `);
  
  // ============================================
  // ENTITY TABLES
  // ============================================
  
  // People - colleagues, prospects, anyone mentioned
  db.exec(`
    CREATE TABLE IF NOT EXISTS people (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      role TEXT,
      company TEXT,
      relationship_type TEXT CHECK(relationship_type IN (
        'colleague',
        'manager',
        'prospect',
        'customer',
        'competitor_contact',
        'mentor',
        'other'
      )),
      email TEXT,
      phone TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // Deals - tracked opportunities
  db.exec(`
    CREATE TABLE IF NOT EXISTS deals (
      id TEXT PRIMARY KEY,
      company_name TEXT NOT NULL,
      contact_name TEXT,
      contact_role TEXT,
      status TEXT DEFAULT 'active',
      value_amount REAL,
      value_currency TEXT DEFAULT 'USD',
      expected_close_date DATE,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_activity_at DATETIME
    )
  `);
  
  // MEDDPICC tracking for deals
  db.exec(`
    CREATE TABLE IF NOT EXISTS deal_meddpicc (
      id TEXT PRIMARY KEY,
      deal_id TEXT NOT NULL,
      letter TEXT CHECK(letter IN ('M', 'E', 'D1', 'D2', 'P', 'I', 'C1', 'C2')),
      status TEXT CHECK(status IN ('unknown', 'partial', 'identified')) DEFAULT 'unknown',
      evidence TEXT,
      source_segment_id TEXT,
      confidence REAL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (deal_id) REFERENCES deals(id) ON DELETE CASCADE,
      FOREIGN KEY (source_segment_id) REFERENCES segments(id) ON DELETE SET NULL,
      UNIQUE(deal_id, letter)
    )
  `);
  
  // Products/Features - knowledge about your product
  db.exec(`
    CREATE TABLE IF NOT EXISTS product_knowledge (
      id TEXT PRIMARY KEY,
      topic TEXT NOT NULL,
      category TEXT,
      content TEXT NOT NULL,
      source_segment_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (source_segment_id) REFERENCES segments(id) ON DELETE SET NULL
    )
  `);
  
  // Objections - library of objections encountered
  db.exec(`
    CREATE TABLE IF NOT EXISTS objections (
      id TEXT PRIMARY KEY,
      objection_text TEXT NOT NULL,
      category TEXT,
      frequency INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // Objection responses - how you've handled each objection
  db.exec(`
    CREATE TABLE IF NOT EXISTS objection_responses (
      id TEXT PRIMARY KEY,
      objection_id TEXT NOT NULL,
      response_text TEXT NOT NULL,
      effectiveness TEXT CHECK(effectiveness IN ('unknown', 'poor', 'okay', 'good', 'excellent')),
      source_segment_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (objection_id) REFERENCES objections(id) ON DELETE CASCADE,
      FOREIGN KEY (source_segment_id) REFERENCES segments(id) ON DELETE SET NULL
    )
  `);
  
  // ============================================
  // RELATIONSHIP TABLES
  // ============================================
  
  // Link segments to people mentioned in them
  db.exec(`
    CREATE TABLE IF NOT EXISTS segment_people (
      segment_id TEXT NOT NULL,
      person_id TEXT NOT NULL,
      role_in_segment TEXT,
      PRIMARY KEY (segment_id, person_id),
      FOREIGN KEY (segment_id) REFERENCES segments(id) ON DELETE CASCADE,
      FOREIGN KEY (person_id) REFERENCES people(id) ON DELETE CASCADE
    )
  `);
  
  // Link segments to deals
  db.exec(`
    CREATE TABLE IF NOT EXISTS segment_deals (
      segment_id TEXT NOT NULL,
      deal_id TEXT NOT NULL,
      PRIMARY KEY (segment_id, deal_id),
      FOREIGN KEY (segment_id) REFERENCES segments(id) ON DELETE CASCADE,
      FOREIGN KEY (deal_id) REFERENCES deals(id) ON DELETE CASCADE
    )
  `);
  
  // ============================================
  // PRECOMPUTED METRICS
  // ============================================
  
  // Self-coaching metrics per transcript
  db.exec(`
    CREATE TABLE IF NOT EXISTS transcript_metrics (
      id TEXT PRIMARY KEY,
      transcript_id TEXT NOT NULL UNIQUE,
      talk_ratio REAL,
      strong_moments TEXT,
      improvement_areas TEXT,
      questions_asked TEXT,
      computed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (transcript_id) REFERENCES transcripts(id) ON DELETE CASCADE
    )
  `);
  
  // Aggregated patterns (rebuilt periodically)
  db.exec(`
    CREATE TABLE IF NOT EXISTS computed_patterns (
      id TEXT PRIMARY KEY,
      pattern_type TEXT NOT NULL,
      pattern_data TEXT NOT NULL,
      computed_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // ============================================
  // INDEXES
  // ============================================
  
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_segments_transcript ON segments(transcript_id);
    CREATE INDEX IF NOT EXISTS idx_segments_knowledge_type ON segments(knowledge_type);
    CREATE INDEX IF NOT EXISTS idx_segment_tags_segment ON segment_tags(segment_id);
    CREATE INDEX IF NOT EXISTS idx_segment_tags_tag ON segment_tags(tag);
    CREATE INDEX IF NOT EXISTS idx_segment_people_segment ON segment_people(segment_id);
    CREATE INDEX IF NOT EXISTS idx_segment_people_person ON segment_people(person_id);
    CREATE INDEX IF NOT EXISTS idx_segment_deals_segment ON segment_deals(segment_id);
    CREATE INDEX IF NOT EXISTS idx_segment_deals_deal ON segment_deals(deal_id);
    CREATE INDEX IF NOT EXISTS idx_deal_meddpicc_deal ON deal_meddpicc(deal_id);
    CREATE INDEX IF NOT EXISTS idx_transcripts_date ON transcripts(call_date);
    CREATE INDEX IF NOT EXISTS idx_transcripts_content_hash ON transcripts(content_hash);
  `);
  
  console.log('Database initialized successfully');
  return db;
}

export function getDatabase() {
  return new Database(dbPath);
}

export default { initDatabase, getDatabase };
