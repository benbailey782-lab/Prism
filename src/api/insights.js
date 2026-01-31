/**
 * Insights API Routes
 * Phase 2: Access and manage system-generated insights
 */

import express from 'express';
import {
  getActiveInsights,
  getCurrentICP,
  getPatternInsights,
  getCoachingInsights,
  recordFeedback,
  dismissInsight,
  getInsightWithHistory,
  getInsightsSummary
} from '../learning/insightManager.js';
import { getAllInsights, getInsight } from '../db/queries.js';

const router = express.Router();

// GET /api/insights - List all active insights
router.get('/', (req, res) => {
  try {
    const { type, category, minConfidence } = req.query;

    const insights = getActiveInsights({
      type,
      category,
      minConfidence: minConfidence ? parseFloat(minConfidence) : undefined
    });

    res.json(insights);
  } catch (err) {
    console.error('Error fetching insights:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/insights/summary - Get insights summary
router.get('/summary', (req, res) => {
  try {
    const summary = getInsightsSummary();
    res.json(summary);
  } catch (err) {
    console.error('Error fetching insights summary:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/insights/icp - Get current ICP insight
router.get('/icp', (req, res) => {
  try {
    const icp = getCurrentICP();

    if (!icp) {
      return res.json({
        hasICP: false,
        message: 'No ICP insight yet. Need more data or run analysis.'
      });
    }

    res.json({ hasICP: true, ...icp });
  } catch (err) {
    console.error('Error fetching ICP:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/insights/patterns - Get behavior patterns
router.get('/patterns', (req, res) => {
  try {
    const patterns = getPatternInsights();
    res.json(patterns);
  } catch (err) {
    console.error('Error fetching patterns:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/insights/coaching - Get coaching insights
router.get('/coaching', (req, res) => {
  try {
    const coaching = getCoachingInsights();
    res.json(coaching);
  } catch (err) {
    console.error('Error fetching coaching insights:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/insights/:id - Get insight with history
router.get('/:id', (req, res) => {
  try {
    const insight = getInsightWithHistory(req.params.id);

    if (!insight) {
      return res.status(404).json({ error: 'Insight not found' });
    }

    res.json(insight);
  } catch (err) {
    console.error('Error fetching insight:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/insights/:id/feedback - Submit user feedback
router.post('/:id/feedback', (req, res) => {
  try {
    const { feedback } = req.body;

    if (!['helpful', 'not_helpful', 'incorrect'].includes(feedback)) {
      return res.status(400).json({ error: 'Invalid feedback value' });
    }

    recordFeedback(req.params.id, feedback);
    res.json({ success: true });
  } catch (err) {
    console.error('Error submitting feedback:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/insights/:id/dismiss - Dismiss/hide an insight
router.post('/:id/dismiss', (req, res) => {
  try {
    dismissInsight(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error('Error dismissing insight:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
