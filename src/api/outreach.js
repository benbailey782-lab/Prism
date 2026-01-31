/**
 * Outreach API Routes
 * Phase 2: Outreach logging and tracking endpoints
 */

import express from 'express';
import {
  createOutreach,
  updateOutreach,
  getOutreachLog,
  getDueFollowups,
  getOverdueFollowups,
  getOutreachStats,
  getCadenceTemplates,
  getDefaultCadenceForTier
} from '../db/queries.js';

const router = express.Router();

// GET /api/outreach - List outreach activities
router.get('/', (req, res) => {
  try {
    const { prospectId, method, outcome, fromDate, toDate, limit, offset } = req.query;

    const outreach = getOutreachLog({
      prospectId,
      method,
      outcome,
      fromDate,
      toDate,
      limit: limit ? parseInt(limit) : 50,
      offset: offset ? parseInt(offset) : undefined
    });

    res.json(outreach);
  } catch (err) {
    console.error('Error fetching outreach:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/outreach/due - Get due follow-ups
router.get('/due', (req, res) => {
  try {
    const { days = 7 } = req.query;
    const followups = getDueFollowups(parseInt(days));
    res.json(followups);
  } catch (err) {
    console.error('Error fetching due follow-ups:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/outreach/overdue - Get overdue follow-ups
router.get('/overdue', (req, res) => {
  try {
    const followups = getOverdueFollowups();
    res.json(followups);
  } catch (err) {
    console.error('Error fetching overdue follow-ups:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/outreach/stats - Outreach statistics
router.get('/stats', (req, res) => {
  try {
    const stats = getOutreachStats();
    res.json(stats);
  } catch (err) {
    console.error('Error fetching outreach stats:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/outreach - Log outreach
router.post('/', (req, res) => {
  try {
    const {
      prospectId,
      contactId,
      outreachDate,
      method,
      direction,
      subject,
      contentSummary,
      outcome,
      nextAction,
      nextFollowupDate,
      sequenceStep
    } = req.body;

    if (!prospectId) {
      return res.status(400).json({ error: 'Prospect ID is required' });
    }

    if (!method) {
      return res.status(400).json({ error: 'Method is required' });
    }

    const outreachId = createOutreach({
      prospectId,
      contactId,
      outreachDate: outreachDate || new Date().toISOString().split('T')[0],
      method,
      direction,
      subject,
      contentSummary,
      outcome,
      nextAction,
      nextFollowupDate,
      sequenceStep
    });

    res.status(201).json({ outreachId });
  } catch (err) {
    console.error('Error logging outreach:', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/outreach/:id - Update outreach (e.g., update outcome)
router.put('/:id', (req, res) => {
  try {
    updateOutreach(req.params.id, req.body);
    res.json({ success: true });
  } catch (err) {
    console.error('Error updating outreach:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/outreach/cadences - Get cadence templates
router.get('/cadences', (req, res) => {
  try {
    const { tier } = req.query;
    const cadences = getCadenceTemplates(tier ? parseInt(tier) : null);
    res.json(cadences);
  } catch (err) {
    console.error('Error fetching cadences:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/outreach/cadences/:tier/default - Get default cadence for tier
router.get('/cadences/:tier/default', (req, res) => {
  try {
    const cadence = getDefaultCadenceForTier(parseInt(req.params.tier));

    if (!cadence) {
      return res.status(404).json({ error: 'No default cadence for this tier' });
    }

    res.json(cadence);
  } catch (err) {
    console.error('Error fetching default cadence:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/outreach/today - Get today's tasks
router.get('/today', (req, res) => {
  try {
    const overdue = getOverdueFollowups();
    const due = getDueFollowups(1); // Due within 1 day

    res.json({
      overdue: overdue.length,
      dueToday: due.length,
      tasks: [
        ...overdue.map(o => ({ ...o, urgency: 'overdue' })),
        ...due.map(o => ({ ...o, urgency: 'today' }))
      ].slice(0, 20) // Limit to 20 tasks
    });
  } catch (err) {
    console.error('Error fetching today\'s tasks:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
