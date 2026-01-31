/**
 * Prospect API Routes
 * Phase 2: Full prospect management endpoints
 */

import express from 'express';
import {
  createProspect,
  getProspect,
  getProspectWithDetails,
  getAllProspects,
  updateProspect,
  deleteProspect,
  convertProspectToDeal,
  addProspectSignal,
  deleteProspectSignal,
  addProspectContact,
  updateProspectContact,
  deleteProspectContact
} from '../db/queries.js';
import { calculateProspectScore, recalculateAllProspectScores, getProspectScoreBreakdown } from '../processing/prospectScorer.js';

const router = express.Router();

// GET /api/prospects - List all prospects
router.get('/', (req, res) => {
  try {
    const { tier, status, sort, limit, offset } = req.query;

    const prospects = getAllProspects({
      tier: tier !== 'all' ? tier : undefined,
      status: status !== 'all' ? status : undefined,
      sort,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined
    });

    res.json(prospects);
  } catch (err) {
    console.error('Error fetching prospects:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/prospects/:id - Get prospect with full details
router.get('/:id', (req, res) => {
  try {
    const prospect = getProspectWithDetails(req.params.id);

    if (!prospect) {
      return res.status(404).json({ error: 'Prospect not found' });
    }

    res.json(prospect);
  } catch (err) {
    console.error('Error fetching prospect:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/prospects - Create prospect
router.post('/', async (req, res) => {
  try {
    const {
      companyName,
      website,
      industry,
      employeeCount,
      employeeRange,
      estimatedRevenue,
      location,
      techStack,
      tier,
      status,
      notes,
      source,
      signals // Optional initial signals
    } = req.body;

    if (!companyName) {
      return res.status(400).json({ error: 'Company name is required' });
    }

    const prospectId = createProspect({
      companyName,
      website,
      industry,
      employeeCount,
      employeeRange,
      estimatedRevenue,
      location,
      techStack,
      tier,
      status,
      notes,
      source
    });

    // Add initial signals if provided
    if (signals && Array.isArray(signals)) {
      for (const signal of signals) {
        addProspectSignal(prospectId, {
          signalType: signal.signalType,
          signalValue: signal.signalValue,
          weight: signal.weight,
          source: signal.source
        });
      }
    }

    // Calculate initial score
    await calculateProspectScore(prospectId);

    const prospect = getProspectWithDetails(prospectId);
    res.status(201).json(prospect);
  } catch (err) {
    console.error('Error creating prospect:', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/prospects/:id - Update prospect
router.put('/:id', (req, res) => {
  try {
    const prospect = getProspect(req.params.id);
    if (!prospect) {
      return res.status(404).json({ error: 'Prospect not found' });
    }

    updateProspect(req.params.id, req.body);

    const updated = getProspectWithDetails(req.params.id);
    res.json(updated);
  } catch (err) {
    console.error('Error updating prospect:', err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/prospects/:id - Delete prospect
router.delete('/:id', (req, res) => {
  try {
    const prospect = getProspect(req.params.id);
    if (!prospect) {
      return res.status(404).json({ error: 'Prospect not found' });
    }

    deleteProspect(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting prospect:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/prospects/:id/signals - Add signal
router.post('/:id/signals', async (req, res) => {
  try {
    const prospect = getProspect(req.params.id);
    if (!prospect) {
      return res.status(404).json({ error: 'Prospect not found' });
    }

    const { signalType, signalValue, weight, detectedAt, source, notes } = req.body;

    if (!signalType) {
      return res.status(400).json({ error: 'Signal type is required' });
    }

    const signalId = addProspectSignal(req.params.id, {
      signalType,
      signalValue,
      weight,
      detectedAt,
      source,
      notes
    });

    // Recalculate score
    const scoreResult = await calculateProspectScore(req.params.id);

    res.status(201).json({
      signalId,
      newScore: scoreResult.score,
      newTier: scoreResult.tier
    });
  } catch (err) {
    console.error('Error adding signal:', err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/prospects/:id/signals/:signalId - Remove signal
router.delete('/:id/signals/:signalId', async (req, res) => {
  try {
    deleteProspectSignal(req.params.signalId);

    // Recalculate score
    const scoreResult = await calculateProspectScore(req.params.id);

    res.json({
      success: true,
      newScore: scoreResult.score,
      newTier: scoreResult.tier
    });
  } catch (err) {
    console.error('Error removing signal:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/prospects/:id/contacts - Add contact
router.post('/:id/contacts', (req, res) => {
  try {
    const prospect = getProspect(req.params.id);
    if (!prospect) {
      return res.status(404).json({ error: 'Prospect not found' });
    }

    const { name, title, email, linkedinUrl, phone, persona, isPrimary, notes } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Contact name is required' });
    }

    const contactId = addProspectContact(req.params.id, {
      name,
      title,
      email,
      linkedinUrl,
      phone,
      persona,
      isPrimary,
      notes
    });

    res.status(201).json({ contactId });
  } catch (err) {
    console.error('Error adding contact:', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/prospects/:id/contacts/:contactId - Update contact
router.put('/:id/contacts/:contactId', (req, res) => {
  try {
    updateProspectContact(req.params.contactId, req.body);
    res.json({ success: true });
  } catch (err) {
    console.error('Error updating contact:', err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/prospects/:id/contacts/:contactId - Remove contact
router.delete('/:id/contacts/:contactId', (req, res) => {
  try {
    deleteProspectContact(req.params.contactId);
    res.json({ success: true });
  } catch (err) {
    console.error('Error removing contact:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/prospects/:id/recalculate - Recalculate tier/score
router.post('/:id/recalculate', async (req, res) => {
  try {
    const prospect = getProspect(req.params.id);
    if (!prospect) {
      return res.status(404).json({ error: 'Prospect not found' });
    }

    const result = await calculateProspectScore(req.params.id);
    res.json(result);
  } catch (err) {
    console.error('Error recalculating score:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/prospects/:id/score-breakdown - Get detailed score breakdown
router.get('/:id/score-breakdown', (req, res) => {
  try {
    const breakdown = getProspectScoreBreakdown(req.params.id);
    res.json(breakdown);
  } catch (err) {
    console.error('Error getting score breakdown:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/prospects/:id/convert - Convert to deal
router.post('/:id/convert', (req, res) => {
  try {
    const { dealValue, expectedCloseDate, notes } = req.body;

    const dealId = convertProspectToDeal(req.params.id, {
      dealValue,
      expectedCloseDate,
      notes
    });

    res.json({ dealId, success: true });
  } catch (err) {
    console.error('Error converting prospect:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/prospects/recalculate-all - Recalculate all prospect scores
router.post('/recalculate-all', async (req, res) => {
  try {
    const results = await recalculateAllProspectScores();
    res.json(results);
  } catch (err) {
    console.error('Error recalculating all scores:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
