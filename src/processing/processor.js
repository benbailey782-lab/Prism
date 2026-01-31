import { getTranscript, createSegment, addSegmentTag, updateTranscript, saveTranscriptMetrics } from '../db/queries.js';

// AI Provider configuration
let aiProvider = null;
let aiConfig = {};

/**
 * Initialize the AI provider
 * Supports: 'ollama' (free, local) or 'anthropic' (paid API)
 */
export async function initAI(config = {}) {
  const provider = config.provider || process.env.AI_PROVIDER || 'ollama';
  
  if (provider === 'anthropic') {
    const apiKey = config.apiKey || process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.warn('Anthropic provider selected but no API key found');
      return false;
    }
    
    try {
      const { default: Anthropic } = await import('@anthropic-ai/sdk');
      aiProvider = 'anthropic';
      aiConfig = { 
        client: new Anthropic({ apiKey }),
        model: config.model || 'claude-sonnet-4-20250514'
      };
      console.log('✓ Anthropic client initialized');
      return true;
    } catch (err) {
      console.warn('Could not initialize Anthropic client:', err.message);
      return false;
    }
  } 
  
  if (provider === 'ollama') {
    const baseUrl = config.baseUrl || process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
    const model = config.model || process.env.OLLAMA_MODEL || 'llama3.1:8b';
    
    // Test connection to Ollama
    try {
      const response = await fetch(`${baseUrl}/api/tags`);
      if (!response.ok) throw new Error('Ollama not responding');
      
      const data = await response.json();
      const models = data.models?.map(m => m.name) || [];
      
      aiProvider = 'ollama';
      aiConfig = { baseUrl, model, availableModels: models };
      
      if (!models.some(m => m.startsWith(model.split(':')[0]))) {
        console.warn(`⚠ Model "${model}" not found. Available: ${models.join(', ')}`);
        console.warn(`  Run: ollama pull ${model}`);
      }
      
      console.log(`✓ Ollama initialized (${baseUrl})`);
      console.log(`  Model: ${model}`);
      return true;
    } catch (err) {
      console.warn('Could not connect to Ollama:', err.message);
      console.warn('  Is Ollama running? Start with: ollama serve');
      return false;
    }
  }
  
  console.warn(`Unknown AI provider: ${provider}`);
  return false;
}

/**
 * Get current AI provider status
 */
export function getAIStatus() {
  return {
    provider: aiProvider,
    enabled: !!aiProvider,
    model: aiConfig.model || null,
    availableModels: aiConfig.availableModels || []
  };
}

/**
 * Call the configured AI provider
 */
async function callAI(prompt, options = {}) {
  if (!aiProvider) {
    throw new Error('AI not initialized');
  }
  
  if (aiProvider === 'anthropic') {
    const response = await aiConfig.client.messages.create({
      model: aiConfig.model,
      max_tokens: options.maxTokens || 4096,
      messages: [{ role: 'user', content: prompt }]
    });
    return response.content[0].text;
  }
  
  if (aiProvider === 'ollama') {
    const response = await fetch(`${aiConfig.baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: aiConfig.model,
        prompt: prompt,
        stream: false,
        options: {
          num_predict: options.maxTokens || 4096,
          temperature: options.temperature || 0.3
        }
      })
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Ollama error: ${error}`);
    }
    
    const data = await response.json();
    return data.response;
  }
  
  throw new Error(`Unknown provider: ${aiProvider}`);
}

/**
 * Process a transcript - segment it, tag segments, extract entities
 * This is the main AI processing pipeline
 */
export async function processTranscript(transcriptId) {
  const transcript = getTranscript(transcriptId);
  if (!transcript) {
    throw new Error(`Transcript not found: ${transcriptId}`);
  }
  
  console.log(`Processing transcript: ${transcript.filename}`);
  
  // If no AI provider, use stub processing
  if (!aiProvider) {
    console.log('No AI provider - using stub processing');
    return stubProcessTranscript(transcript);
  }
  
  try {
    // Step 1: Segment the transcript
    const segments = await segmentTranscript(transcript);
    
    // Step 2: Save segments and tags
    for (const segment of segments) {
      const segmentId = createSegment({
        transcriptId: transcript.id,
        content: segment.content,
        startTime: segment.startTime,
        endTime: segment.endTime,
        speaker: segment.speaker,
        knowledgeType: segment.knowledgeType,
        summary: segment.summary
      });
      
      // Add tags
      for (const tag of segment.tags || []) {
        addSegmentTag(segmentId, tag);
      }
    }
    
    // Step 3: Generate transcript-level summary and metrics
    const metrics = await analyzeTranscript(transcript);
    saveTranscriptMetrics(transcript.id, metrics);
    
    // Step 4: Update transcript with summary
    updateTranscript(transcript.id, {
      summary: metrics.summary,
      processed_at: new Date().toISOString()
    });
    
    console.log(`Processed transcript: ${transcript.filename} - ${segments.length} segments`);
    
    return { segments, metrics };
    
  } catch (err) {
    console.error(`AI processing failed for ${transcript.filename}:`, err);
    // Fall back to stub processing
    return stubProcessTranscript(transcript);
  }
}

/**
 * Use AI to segment a transcript into logical chunks
 */
async function segmentTranscript(transcript) {
  const prompt = `Analyze this transcript and break it into logical segments based on topic shifts.

For each segment, identify:
1. The content (exact text from the transcript)
2. Start and end timestamps if present
3. Speaker(s) involved
4. Knowledge type - one of:
   - product_knowledge: Information about features, capabilities, how things work
   - process_knowledge: Company procedures, how things are done internally
   - people_context: Information about people, roles, relationships
   - sales_insight: Prospect information, objections, deal-related discussion
   - advice_received: Direct guidance or recommendations from others
   - decision_rationale: Explanations for why decisions were made
   - competitive_intel: Information about competitors
   - small_talk: Casual conversation, greetings, off-topic
   - unknown: Cannot be categorized
5. A brief summary of the segment
6. Relevant tags (topics, people mentioned, companies, etc.)

Transcript:
${transcript.raw_content}

Respond ONLY with valid JSON, no other text:
{
  "segments": [
    {
      "content": "...",
      "startTime": "00:00:00",
      "endTime": "00:05:30",
      "speaker": "Name",
      "knowledgeType": "product_knowledge",
      "summary": "Discussion about API rate limiting",
      "tags": ["api", "rate-limiting", "technical"]
    }
  ]
}`;

  const text = await callAI(prompt);
  
  // Extract JSON from response (handle markdown code blocks)
  let jsonStr = text;
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    jsonStr = codeBlockMatch[1];
  } else {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonStr = jsonMatch[0];
    }
  }
  
  try {
    const result = JSON.parse(jsonStr);
    return result.segments || [];
  } catch (err) {
    console.error('Failed to parse segmentation response:', err.message);
    console.error('Raw response:', text.substring(0, 500));
    throw new Error('Could not parse segmentation response');
  }
}

/**
 * Analyze transcript for metrics and summary
 */
async function analyzeTranscript(transcript) {
  const prompt = `Analyze this sales/work transcript and provide:

1. Overall summary (2-3 sentences)
2. Talk ratio estimate (what percentage of talking was done by the main speaker vs others)
3. Strong moments (things done well)
4. Improvement areas (things that could be better)
5. Questions asked by the main speaker (discovery questions, clarifying questions)

Transcript:
${transcript.raw_content}

Respond ONLY with valid JSON, no other text:
{
  "summary": "...",
  "talkRatio": 0.65,
  "strongMoments": ["Good discovery question about timeline", "Handled pricing objection well"],
  "improvementAreas": ["Could have asked more about decision process", "Talked over the prospect at 5:30"],
  "questionsAsked": ["What's your timeline for this project?", "Who else is involved in this decision?"]
}`;

  const text = await callAI(prompt, { maxTokens: 2048 });
  
  // Extract JSON from response
  let jsonStr = text;
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    jsonStr = codeBlockMatch[1];
  } else {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonStr = jsonMatch[0];
    }
  }
  
  try {
    return JSON.parse(jsonStr);
  } catch (err) {
    console.error('Failed to parse analysis response:', err.message);
    return {
      summary: 'Analysis failed - could not parse AI response',
      talkRatio: null,
      strongMoments: [],
      improvementAreas: [],
      questionsAsked: []
    };
  }
}

/**
 * Stub processing when AI is not available
 * Creates basic segments based on speaker changes or paragraph breaks
 */
function stubProcessTranscript(transcript) {
  console.log('Using stub processing (no AI)');
  
  const content = transcript.raw_content;
  const lines = content.split('\n').filter(l => l.trim());
  
  // Simple segmentation: group consecutive lines by speaker or create chunks
  const segments = [];
  let currentChunk = [];
  let chunkCount = 0;
  
  for (const line of lines) {
    currentChunk.push(line);
    
    // Create a new segment every ~500 characters or on apparent speaker change
    const chunkText = currentChunk.join('\n');
    const speakerChange = line.match(/^[A-Za-z\s]+:/);
    
    if (chunkText.length > 500 || speakerChange) {
      if (currentChunk.length > 0) {
        const segmentId = createSegment({
          transcriptId: transcript.id,
          content: chunkText,
          startTime: null,
          endTime: null,
          speaker: null,
          knowledgeType: 'unknown',
          summary: null
        });
        
        segments.push({ id: segmentId, content: chunkText });
        chunkCount++;
        currentChunk = speakerChange ? [line] : [];
      }
    }
  }
  
  // Don't forget the last chunk
  if (currentChunk.length > 0) {
    const chunkText = currentChunk.join('\n');
    const segmentId = createSegment({
      transcriptId: transcript.id,
      content: chunkText,
      startTime: null,
      endTime: null,
      speaker: null,
      knowledgeType: 'unknown',
      summary: null
    });
    segments.push({ id: segmentId, content: chunkText });
  }
  
  // Update transcript as processed
  updateTranscript(transcript.id, {
    processed_at: new Date().toISOString()
  });
  
  console.log(`Stub processed: ${segments.length} segments`);
  
  return {
    segments,
    metrics: {
      summary: 'Transcript imported (AI processing pending)',
      talkRatio: null,
      strongMoments: [],
      improvementAreas: [],
      questionsAsked: []
    }
  };
}

export default {
  initAI,
  getAIStatus,
  processTranscript
};
