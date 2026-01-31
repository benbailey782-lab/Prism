import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

import { initDatabase } from './db/schema.js';
import * as queries from './db/queries.js';
import { startWatcher } from './ingestion/watcher.js';
import { initAI, getAIStatus, processTranscript, getCallAI } from './processing/processor.js';

// Phase 2 imports
import prospectRoutes from './api/prospects.js';
import outreachRoutes from './api/outreach.js';
import insightRoutes from './api/insights.js';
import learningRoutes from './api/learning.js';
import { initAnalysisJobs } from './learning/analysisJobs.js';
import { getMeddpiccSummary } from './processing/meddpiccExtractor.js';
import { getSegmentsForPerson, getSegmentsForDeal } from './db/queries.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function dirname(path) {
  return path.substring(0, path.lastIndexOf('/'));
}

const app = express();
const PORT = process.env.PORT || 3001;
const WATCH_FOLDER = process.env.WATCH_FOLDER || './transcripts';

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database
initDatabase();

// Initialize AI provider (Ollama by default, or Anthropic if key is set)
let aiInitialized = false;
(async () => {
  aiInitialized = await initAI({
    provider: process.env.AI_PROVIDER || (process.env.ANTHROPIC_API_KEY ? 'anthropic' : 'ollama'),
    apiKey: process.env.ANTHROPIC_API_KEY,
    baseUrl: process.env.OLLAMA_BASE_URL,
    model: process.env.OLLAMA_MODEL || process.env.AI_MODEL
  });

  // Initialize learning engine analysis jobs
  if (aiInitialized) {
    const callAI = getCallAI();
    if (callAI) {
      initAnalysisJobs(callAI);
    }
  }
})();

// Ensure transcripts folder exists
if (!fs.existsSync(WATCH_FOLDER)) {
  fs.mkdirSync(WATCH_FOLDER, { recursive: true });
}

// Start file watcher
const watcher = startWatcher(WATCH_FOLDER, {
  processImmediately: false, // Will check AI status when processing
  onNewFile: ({ transcriptId, filepath }) => {
    console.log(`API: New transcript ingested: ${transcriptId}`);
  }
});

// ============================================
// API ROUTES
// ============================================

// Health check
app.get('/api/health', (req, res) => {
  const aiStatus = getAIStatus();
  res.json({ 
    status: 'ok', 
    aiEnabled: aiStatus.enabled,
    aiProvider: aiStatus.provider,
    aiModel: aiStatus.model,
    watchFolder: WATCH_FOLDER
  });
});

// Get stats
app.get('/api/stats', (req, res) => {
  try {
    const stats = queries.getStats();
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// TRANSCRIPT ROUTES
// ============================================

// List all transcripts
app.get('/api/transcripts', (req, res) => {
  try {
    const transcripts = queries.getAllTranscripts();
    res.json(transcripts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single transcript
app.get('/api/transcripts/:id', (req, res) => {
  try {
    const transcript = queries.getTranscript(req.params.id);
    if (!transcript) {
      return res.status(404).json({ error: 'Transcript not found' });
    }
    res.json(transcript);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get transcript segments
app.get('/api/transcripts/:id/segments', (req, res) => {
  try {
    const segments = queries.getSegmentsByTranscript(req.params.id);
    res.json(segments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get transcript metrics
app.get('/api/transcripts/:id/metrics', (req, res) => {
  try {
    const metrics = queries.getTranscriptMetrics(req.params.id);
    res.json(metrics || {});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reprocess a transcript
app.post('/api/transcripts/:id/process', async (req, res) => {
  try {
    const aiStatus = getAIStatus();
    if (!aiStatus.enabled) {
      return res.status(400).json({
        error: 'AI processing not available',
        suggestion: 'Start Ollama with: ollama serve'
      });
    }

    const result = await processTranscript(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a transcript
app.delete('/api/transcripts/:id', (req, res) => {
  try {
    const transcript = queries.getTranscript(req.params.id);
    if (!transcript) {
      return res.status(404).json({ error: 'Transcript not found' });
    }
    queries.deleteTranscript(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// SEGMENT ROUTES
// ============================================

// List all segments
app.get('/api/segments', (req, res) => {
  try {
    const { knowledgeType, tag } = req.query;
    
    let segments;
    if (knowledgeType) {
      segments = queries.getSegmentsByKnowledgeType(knowledgeType);
    } else if (tag) {
      segments = queries.getSegmentsByTag(tag);
    } else {
      segments = queries.getAllSegments();
    }
    
    res.json(segments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get segment tags
app.get('/api/segments/:id/tags', (req, res) => {
  try {
    const tags = queries.getSegmentTags(req.params.id);
    res.json(tags);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single segment
app.get('/api/segments/:id', (req, res) => {
  try {
    const segment = queries.getSegment(req.params.id);
    if (!segment) {
      return res.status(404).json({ error: 'Segment not found' });
    }
    const tags = queries.getSegmentTags(req.params.id);
    res.json({ ...segment, tags });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Search segments
app.get('/api/segments/search', (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ error: 'Query parameter q is required' });
    }
    const segments = queries.searchSegments(q);
    res.json(segments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// PEOPLE ROUTES
// ============================================

app.get('/api/people', (req, res) => {
  try {
    const { relationship_type } = req.query;
    const people = queries.getAllPeople(relationship_type);
    res.json(people);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/people', (req, res) => {
  try {
    const id = queries.createPerson(req.body);
    res.json({ id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/people/:id', (req, res) => {
  try {
    const person = queries.getPerson(req.params.id);
    if (!person) {
      return res.status(404).json({ error: 'Person not found' });
    }
    res.json(person);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/people/:id', (req, res) => {
  try {
    queries.updatePerson(req.params.id, req.body);
    const updated = queries.getPerson(req.params.id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// DEAL ROUTES
// ============================================

app.get('/api/deals', (req, res) => {
  try {
    const deals = queries.getAllDeals();
    res.json(deals);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/deals', (req, res) => {
  try {
    const id = queries.createDeal(req.body);
    res.json({ id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/deals/:id', (req, res) => {
  try {
    const deal = queries.getDeal(req.params.id);
    if (!deal) {
      return res.status(404).json({ error: 'Deal not found' });
    }
    const meddpicc = queries.getDealMeddpicc(req.params.id);
    res.json({ ...deal, meddpicc });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/deals/:id', (req, res) => {
  try {
    queries.updateDeal(req.params.id, req.body);
    const updated = queries.getDeal(req.params.id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/deals/:id/meddpicc', (req, res) => {
  try {
    const meddpicc = queries.getDealMeddpicc(req.params.id);
    res.json(meddpicc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/deals/:id/meddpicc/:letter', (req, res) => {
  try {
    const { id, letter } = req.params;
    queries.updateDealMeddpicc(id, letter, req.body);
    const meddpicc = queries.getDealMeddpicc(id);
    res.json(meddpicc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get MEDDPICC summary for a deal
app.get('/api/deals/:id/meddpicc/summary', (req, res) => {
  try {
    const summary = getMeddpiccSummary(req.params.id);
    res.json(summary);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get segments linked to a deal
app.get('/api/deals/:id/segments', (req, res) => {
  try {
    const segments = getSegmentsForDeal(req.params.id);
    res.json(segments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get segments linked to a person
app.get('/api/people/:id/segments', (req, res) => {
  try {
    const segments = getSegmentsForPerson(req.params.id);
    res.json(segments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// ASK (Natural Language Query)
// ============================================

app.post('/api/ask', async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    const aiStatus = getAIStatus();
    if (!aiStatus.enabled) {
      return res.status(400).json({
        error: 'AI not available. Please start Ollama or configure Anthropic API key.'
      });
    }

    const callAI = getCallAI();
    if (!callAI) {
      return res.status(500).json({ error: 'AI not initialized' });
    }

    // Gather context from the database
    const deals = queries.getAllDeals();
    const people = queries.getAllPeople();
    const recentTranscripts = queries.getAllTranscripts().slice(0, 10);
    const prospects = queries.getAllProspects ? queries.getAllProspects() : [];

    // Build context for the AI
    const context = `
You are Sales Brain, a personal sales intelligence assistant. Answer questions based on the following sales data:

## Active Deals (${deals.length} total)
${deals.slice(0, 10).map(d => `- ${d.company_name}: $${d.value_amount || 'TBD'}, Status: ${d.status || 'active'}, Contact: ${d.contact_name || 'Unknown'}`).join('\n')}

## Key Contacts (${people.length} total)
${people.slice(0, 10).map(p => `- ${p.name} (${p.relationship_type || 'contact'}): ${p.role || ''} at ${p.company || 'Unknown company'}`).join('\n')}

## Prospects (${prospects.length} total)
${prospects.slice(0, 10).map(p => `- ${p.company_name}: Tier ${p.tier || 3}, Score: ${p.score || 0}`).join('\n')}

## Recent Transcripts (${recentTranscripts.length} shown)
${recentTranscripts.map(t => `- ${t.filename}: ${t.processed ? 'Processed' : 'Pending'}, ${t.segment_count || 0} segments`).join('\n')}

Answer the user's question concisely and helpfully. If you don't have enough information, say so.
`;

    const prompt = `${context}\n\nUser Question: ${query}\n\nAnswer:`;

    const response = await callAI(prompt, {
      maxTokens: 500,
      temperature: 0.7
    });

    // Extract sources from the response context
    const sources = [];
    if (deals.length > 0) sources.push({ type: 'deals', name: `${deals.length} deals` });
    if (people.length > 0) sources.push({ type: 'people', name: `${people.length} contacts` });
    if (prospects.length > 0) sources.push({ type: 'prospects', name: `${prospects.length} prospects` });

    res.json({
      answer: response,
      sources
    });
  } catch (err) {
    console.error('Ask error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// PHASE 2: MOUNT NEW ROUTES
// ============================================

app.use('/api/prospects', prospectRoutes);
app.use('/api/outreach', outreachRoutes);
app.use('/api/insights', insightRoutes);
app.use('/api/learning', learningRoutes);

// ============================================
// START SERVER
// ============================================

app.listen(PORT, () => {
  const aiStatus = getAIStatus();
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                      SALES BRAIN                          ║
║                                                           ║
║  API Server:     http://localhost:${PORT}                   ║
║  Watch Folder:   ${WATCH_FOLDER.padEnd(36)}  ║
║  AI Provider:    ${(aiStatus.provider || 'none').padEnd(36)}  ║
║  AI Model:       ${(aiStatus.model || 'n/a').padEnd(36)}  ║
║                                                           ║
║  Drop transcripts in the watch folder to begin.           ║
╚═══════════════════════════════════════════════════════════╝
  `);
});

export default app;
