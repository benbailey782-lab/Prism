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

// Phase 3 imports
import uploadRoutes from './api/upload.js';
import { processQuery, getQueryHistory, submitQueryFeedback } from './processing/queryEngine.js';
import { getLivingSection, getAllSections, regenerateAllSections } from './processing/livingSections.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
// ASK (Natural Language Query) - Phase 3 Smart Query Engine
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

    // Use the smart query engine
    const result = await processQuery(query, callAI);

    res.json(result);
  } catch (err) {
    console.error('Ask error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Query history endpoints
app.get('/api/ask/history', (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;
    const history = getQueryHistory({ limit: parseInt(limit), offset: parseInt(offset) });
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/ask/:id/feedback', (req, res) => {
  try {
    const { id } = req.params;
    const { feedback } = req.body;

    if (!feedback || !['helpful', 'not_helpful'].includes(feedback)) {
      return res.status(400).json({ error: 'Feedback must be "helpful" or "not_helpful"' });
    }

    const result = submitQueryFeedback(id, feedback);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// LIVING SECTIONS (AI-Generated Profiles) - Phase 3
// ============================================

// Get living section for an entity
app.get('/api/living-sections/:entityType/:entityId/:sectionType', async (req, res) => {
  try {
    const { entityType, entityId, sectionType } = req.params;

    const callAI = getCallAI();
    if (!callAI) {
      return res.status(400).json({ error: 'AI not available' });
    }

    const section = await getLivingSection(entityType, entityId, sectionType, callAI);
    res.json(section);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all sections for an entity
app.get('/api/living-sections/:entityType/:entityId', async (req, res) => {
  try {
    const { entityType, entityId } = req.params;

    const callAI = getCallAI();
    if (!callAI) {
      return res.status(400).json({ error: 'AI not available' });
    }

    const sections = await getAllSections(entityType, entityId, callAI);
    res.json(sections);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Force regeneration of all sections for an entity
app.post('/api/living-sections/:entityType/:entityId/regenerate', async (req, res) => {
  try {
    const { entityType, entityId } = req.params;

    const callAI = getCallAI();
    if (!callAI) {
      return res.status(400).json({ error: 'AI not available' });
    }

    const sections = await regenerateAllSections(entityType, entityId, callAI);
    res.json(sections);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// PHASE 2 & 3: MOUNT NEW ROUTES
// ============================================

app.use('/api/prospects', prospectRoutes);
app.use('/api/outreach', outreachRoutes);
app.use('/api/insights', insightRoutes);
app.use('/api/learning', learningRoutes);

// Phase 3: Upload routes
app.use('/api', uploadRoutes);

// ============================================
// CONFIG ROUTES (for Electron)
// ============================================

// Get current watch folder
app.get('/api/config/watch-folder', (req, res) => {
  res.json({ watchFolder: WATCH_FOLDER });
});

// Update watch folder at runtime
app.put('/api/config/watch-folder', (req, res) => {
  try {
    const { watchFolder: newFolder } = req.body;
    if (!newFolder) {
      return res.status(400).json({ error: 'watchFolder is required' });
    }

    // Validate path exists
    if (!fs.existsSync(newFolder)) {
      return res.status(400).json({ error: 'Folder does not exist' });
    }

    // Restart watcher with new folder
    const { restartWatcher } = require('./ingestion/watcher.js');
    if (restartWatcher) {
      restartWatcher(newFolder, {
        processImmediately: false,
        onNewFile: ({ transcriptId, filepath }) => {
          console.log(`API: New transcript ingested: ${transcriptId}`);
        }
      });
    }

    res.json({ success: true, watchFolder: newFolder });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// ELECTRON STATIC FILE SERVING
// ============================================

// In production (Electron), serve the built frontend
if (process.env.ELECTRON === 'true') {
  const uiDistPath = path.join(__dirname, 'ui', 'dist');
  if (fs.existsSync(uiDistPath)) {
    app.use(express.static(uiDistPath));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api')) return next();
      res.sendFile(path.join(uiDistPath, 'index.html'));
    });
  }
}

// ============================================
// START SERVER
// ============================================

app.listen(PORT, () => {
  const aiStatus = getAIStatus();
  const isElectron = process.env.ELECTRON === 'true';
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                         PRISM                             ║
║                   Intelligence Engine                     ║
║                                                           ║
║  API Server:     http://localhost:${PORT}                   ║
║  Watch Folder:   ${WATCH_FOLDER.padEnd(36)}  ║
║  AI Provider:    ${(aiStatus.provider || 'none').padEnd(36)}  ║
║  AI Model:       ${(aiStatus.model || 'n/a').padEnd(36)}  ║
║  Mode:           ${(isElectron ? 'Electron' : 'Development').padEnd(36)}  ║
║                                                           ║
║  Drop transcripts in the watch folder to begin.           ║
╚═══════════════════════════════════════════════════════════╝
  `);
});

export default app;
