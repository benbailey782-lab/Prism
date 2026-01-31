/**
 * Learning Engine API Routes
 * Phase 2: Trigger analysis jobs and manage learning engine
 */

import express from 'express';
import {
  triggerAnalysis,
  getLearningStatus,
  onOutcomeRecorded
} from '../learning/analysisJobs.js';
import { getQuickPatternSummary } from '../learning/patternDetector.js';
import {
  createOutcome,
  getOutcomes,
  getAllSignalWeights,
  updateSignalWeight
} from '../db/queries.js';

const router = express.Router();

// POST /api/learning/analyze - Trigger analysis job
router.post('/analyze', async (req, res) => {
  try {
    const { type = 'all' } = req.body;

    if (!['icp', 'patterns', 'signals', 'all'].includes(type)) {
      return res.status(400).json({ error: 'Invalid analysis type' });
    }

    const result = await triggerAnalysis(type);
    res.json(result);
  } catch (err) {
    console.error('Error running analysis:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/learning/status - Get learning engine status
router.get('/status', (req, res) => {
  try {
    const status = getLearningStatus();
    res.json(status);
  } catch (err) {
    console.error('Error getting learning status:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/learning/patterns/quick - Get quick pattern summary without AI
router.get('/patterns/quick', (req, res) => {
  try {
    const summary = getQuickPatternSummary();
    res.json(summary);
  } catch (err) {
    console.error('Error getting quick patterns:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/outcomes - Record an outcome
router.post('/outcomes', async (req, res) => {
  try {
    const { entityType, entityId, outcomeType, outcomeDate, outcomeValue, context } = req.body;

    if (!entityType || !entityId || !outcomeType) {
      return res.status(400).json({ error: 'entityType, entityId, and outcomeType are required' });
    }

    if (!['deal', 'prospect', 'outreach', 'call'].includes(entityType)) {
      return res.status(400).json({ error: 'Invalid entity type' });
    }

    const outcomeId = createOutcome({
      entityType,
      entityId,
      outcomeType,
      outcomeDate,
      outcomeValue,
      context
    });

    // Trigger learning engine callback
    await onOutcomeRecorded({ entityType, entityId, outcomeType });

    res.status(201).json({ outcomeId });
  } catch (err) {
    console.error('Error recording outcome:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/outcomes - List outcomes
router.get('/outcomes', (req, res) => {
  try {
    const { entityType, outcomeType, fromDate, toDate } = req.query;

    const outcomes = getOutcomes({
      entityType,
      outcomeType,
      fromDate,
      toDate
    });

    res.json(outcomes);
  } catch (err) {
    console.error('Error fetching outcomes:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/learning/weights - Get current signal weights
router.get('/weights', (req, res) => {
  try {
    const weights = getAllSignalWeights();
    res.json(weights);
  } catch (err) {
    console.error('Error fetching weights:', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/learning/weights/:signalType - Override a weight
router.put('/weights/:signalType', (req, res) => {
  try {
    const { learnedWeight, confidence, sampleSize } = req.body;

    if (learnedWeight === undefined) {
      return res.status(400).json({ error: 'learnedWeight is required' });
    }

    updateSignalWeight(req.params.signalType, {
      learnedWeight,
      confidence: confidence || 1.0, // Manual override = high confidence
      sampleSize: sampleSize || 0
    });

    res.json({ success: true });
  } catch (err) {
    console.error('Error updating weight:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
