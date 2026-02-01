/**
 * Analysis Job Scheduler
 * Phase 2: Manages scheduled and triggered analysis jobs
 */

import { analyzeICP } from './icpAnalyzer.js';
import { detectPatterns } from './patternDetector.js';
import { getRecentOutcomes, getRecentTranscripts } from '../db/queries.js';

// Track analysis state
let lastAnalysis = {
  daily: null,
  weekly: null,
  icp: null,
  patterns: null,
  signals: null
};

let analysisInProgress = false;
let aiCallFunction = null;

/**
 * Initialize the analysis job system
 * @param {function} callAI - AI calling function from processor
 */
export function initAnalysisJobs(callAI) {
  aiCallFunction = callAI;
  console.log('Analysis jobs initialized');
}

/**
 * Run daily analysis (lightweight)
 * @returns {object} Analysis results
 */
export async function runDailyAnalysis() {
  if (!aiCallFunction) {
    return { error: 'AI not initialized' };
  }

  if (analysisInProgress) {
    return { error: 'Analysis already in progress' };
  }

  analysisInProgress = true;

  try {
    console.log('Running daily analysis...');

    // Lightweight daily checks
    const patternResults = await detectPatterns({ scope: 'recent', days: 7 }, aiCallFunction);
    const changes = await checkForSignificantChanges();

    lastAnalysis.daily = new Date();

    return {
      success: true,
      patterns: patternResults,
      significantChanges: changes,
      timestamp: lastAnalysis.daily
    };
  } catch (err) {
    console.error('Daily analysis failed:', err);
    return { error: err.message };
  } finally {
    analysisInProgress = false;
  }
}

/**
 * Run weekly deep analysis
 * @returns {object} Analysis results
 */
export async function runWeeklyAnalysis() {
  if (!aiCallFunction) {
    return { error: 'AI not initialized' };
  }

  if (analysisInProgress) {
    return { error: 'Analysis already in progress' };
  }

  analysisInProgress = true;

  try {
    console.log('Running weekly deep analysis...');

    // Full analysis
    const icpResults = await analyzeICP(aiCallFunction);
    const patternResults = await detectPatterns({ scope: 'full' }, aiCallFunction);
    const signalResults = await calibrateSignalWeights();

    lastAnalysis.weekly = new Date();
    lastAnalysis.icp = new Date();
    lastAnalysis.patterns = new Date();
    lastAnalysis.signals = new Date();

    return {
      success: true,
      icp: icpResults,
      patterns: patternResults,
      signals: signalResults,
      timestamp: lastAnalysis.weekly
    };
  } catch (err) {
    console.error('Weekly analysis failed:', err);
    return { error: err.message };
  } finally {
    analysisInProgress = false;
  }
}

/**
 * Trigger specific analysis
 * @param {string} type - 'icp' | 'patterns' | 'signals' | 'all'
 * @returns {object} Analysis results
 */
export async function triggerAnalysis(type) {
  if (!aiCallFunction) {
    return { error: 'AI not initialized' };
  }

  if (analysisInProgress) {
    return { error: 'Analysis already in progress' };
  }

  analysisInProgress = true;

  try {
    let results = {};

    switch (type) {
      case 'icp':
        results = await analyzeICP(aiCallFunction);
        lastAnalysis.icp = new Date();
        break;

      case 'patterns':
        results = await detectPatterns({ scope: 'full' }, aiCallFunction);
        lastAnalysis.patterns = new Date();
        break;

      case 'signals':
        results = await calibrateSignalWeights();
        lastAnalysis.signals = new Date();
        break;

      case 'all':
        const icp = await analyzeICP(aiCallFunction);
        const patterns = await detectPatterns({ scope: 'full' }, aiCallFunction);
        const signals = await calibrateSignalWeights();

        results = { icp, patterns, signals };
        lastAnalysis.icp = new Date();
        lastAnalysis.patterns = new Date();
        lastAnalysis.signals = new Date();
        break;

      default:
        return { error: `Unknown analysis type: ${type}` };
    }

    return {
      success: true,
      type,
      results,
      timestamp: new Date()
    };
  } catch (err) {
    console.error(`Analysis (${type}) failed:`, err);
    return { error: err.message };
  } finally {
    analysisInProgress = false;
  }
}

/**
 * Check for significant changes that might trigger analysis
 */
async function checkForSignificantChanges() {
  const changes = [];

  // Check for new outcomes
  const recentOutcomes = getRecentOutcomes(7);
  if (recentOutcomes.length >= 2) {
    changes.push({
      type: 'new_outcomes',
      count: recentOutcomes.length,
      recommendation: 'Consider running ICP analysis'
    });
  }

  // Check for new transcripts
  const recentTranscripts = getRecentTranscripts(7);
  if (recentTranscripts.length >= 5) {
    changes.push({
      type: 'new_transcripts',
      count: recentTranscripts.length,
      recommendation: 'Consider running pattern analysis'
    });
  }

  return changes;
}

/**
 * Callback for when an outcome is recorded
 * May trigger automatic analysis
 * @param {object} outcome - The recorded outcome
 */
export async function onOutcomeRecorded(outcome) {
  const recentOutcomes = getRecentOutcomes(30);

  // Count outcomes since last ICP analysis
  const outcomesSinceLastAnalysis = recentOutcomes.filter(o => {
    const outcomeDate = new Date(o.created_at);
    const lastIcp = lastAnalysis.icp || new Date(0);
    return outcomeDate > lastIcp;
  });

  // If we have 3+ new outcomes since last analysis, suggest ICP analysis
  if (outcomesSinceLastAnalysis.length >= 3 && aiCallFunction) {
    console.log('Triggering ICP analysis due to new outcomes');
    // Don't await - run in background
    triggerAnalysis('icp').catch(err =>
      console.error('Background ICP analysis failed:', err)
    );
  }
}

/**
 * Callback for when a transcript is processed
 * May trigger automatic analysis
 * @param {object} transcript - The processed transcript
 */
export async function onTranscriptProcessed(transcript) {
  const recentTranscripts = getRecentTranscripts(7);

  // Run pattern analysis after every 5 new transcripts
  if (recentTranscripts.length % 5 === 0 && aiCallFunction) {
    console.log('Triggering pattern analysis due to new transcripts');
    // Don't await - run in background
    triggerAnalysis('patterns').catch(err =>
      console.error('Background pattern analysis failed:', err)
    );
  }
}

/**
 * Calibrate signal weights based on outcomes
 * Simplified version - in production would use ML
 */
async function calibrateSignalWeights() {
  // This is a placeholder - in a real implementation,
  // you would analyze which signals correlated with successful outcomes
  // and adjust weights accordingly

  return {
    calibrated: false,
    message: 'Signal calibration requires outcome data - collect more outcomes',
    timestamp: new Date()
  };
}

/**
 * Start the analysis scheduler
 * Runs analysis on a 30-minute interval
 * @param {function} callAI - AI calling function (optional, uses stored aiCallFunction if not provided)
 */
export function startScheduler(callAI) {
  const aiFunc = callAI || aiCallFunction;

  // Check every 30 minutes for recommended analysis
  setInterval(async () => {
    if (!aiFunc) return;
    const recommendation = getNextRecommendedAnalysis();
    if (recommendation.type) {
      console.log(`[Scheduler] Auto-analysis: ${recommendation.type} — ${recommendation.reason}`);
      try {
        await triggerAnalysis(recommendation.type);
      } catch (err) {
        console.error(`[Scheduler] Analysis failed:`, err.message);
      }
    }
  }, 30 * 60 * 1000);

  // Run initial check after 60 second delay
  setTimeout(async () => {
    if (!aiFunc) return;
    const recommendation = getNextRecommendedAnalysis();
    if (recommendation.type) {
      console.log(`[Scheduler] Startup analysis: ${recommendation.type}`);
      try {
        await triggerAnalysis(recommendation.type);
      } catch (err) {
        console.error(`[Scheduler] Startup analysis failed:`, err.message);
      }
    }
  }, 60 * 1000);

  console.log('[Scheduler] Analysis scheduler started (30 min interval)');
}

/**
 * Get current learning engine status
 */
export function getLearningStatus() {
  return {
    aiInitialized: !!aiCallFunction,
    analysisInProgress,
    lastAnalysis: { ...lastAnalysis },
    nextRecommendedAnalysis: getNextRecommendedAnalysis()
  };
}

/**
 * Determine what analysis should be run next
 */
function getNextRecommendedAnalysis() {
  const now = new Date();
  const oneDay = 24 * 60 * 60 * 1000;
  const oneWeek = 7 * oneDay;

  // Check if ICP analysis is stale
  if (!lastAnalysis.icp || (now - new Date(lastAnalysis.icp)) > oneWeek) {
    return { type: 'icp', reason: 'ICP analysis is stale or never run' };
  }

  // Check if pattern analysis is stale
  if (!lastAnalysis.patterns || (now - new Date(lastAnalysis.patterns)) > 3 * oneDay) {
    return { type: 'patterns', reason: 'Pattern analysis is stale' };
  }

  return { type: null, reason: 'All analyses are current' };
}

export default {
  initAnalysisJobs,
  startScheduler,
  runDailyAnalysis,
  runWeeklyAnalysis,
  triggerAnalysis,
  onOutcomeRecorded,
  onTranscriptProcessed,
  getLearningStatus
};
