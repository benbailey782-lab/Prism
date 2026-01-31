import chokidar from 'chokidar';
import path from 'path';
import fs from 'fs';
import { parseTranscript, parseFilenameMetadata } from './parser.js';
import { createTranscript, transcriptExists } from '../db/queries.js';
import { processTranscript } from '../processing/processor.js';

const SUPPORTED_EXTENSIONS = ['.txt', '.md', '.json'];

/**
 * Start watching a folder for new transcript files
 */
export function startWatcher(watchFolder, options = {}) {
  const { onNewFile, onError, processImmediately = true } = options;
  
  // Ensure watch folder exists
  if (!fs.existsSync(watchFolder)) {
    fs.mkdirSync(watchFolder, { recursive: true });
    console.log(`Created watch folder: ${watchFolder}`);
  }
  
  console.log(`Watching for transcripts in: ${watchFolder}`);
  
  const watcher = chokidar.watch(watchFolder, {
    ignored: /(^|[\/\\])\../, // ignore dotfiles
    persistent: true,
    ignoreInitial: false, // Process existing files on startup
    awaitWriteFinish: {
      stabilityThreshold: 2000,
      pollInterval: 100
    }
  });
  
  watcher.on('add', async (filepath) => {
    const ext = path.extname(filepath).toLowerCase();
    
    if (!SUPPORTED_EXTENSIONS.includes(ext)) {
      console.log(`Skipping unsupported file: ${filepath}`);
      return;
    }
    
    // Check if already processed
    if (transcriptExists(filepath)) {
      console.log(`Already processed: ${filepath}`);
      return;
    }
    
    console.log(`New transcript detected: ${filepath}`);
    
    try {
      // Parse the file
      const parsed = parseTranscript(filepath);
      const filenameMeta = parseFilenameMetadata(parsed.filename);
      
      // Create transcript record
      const transcriptId = createTranscript({
        filename: parsed.filename,
        filepath: filepath,
        rawContent: parsed.rawContent,
        durationMinutes: parsed.durationMinutes,
        callDate: filenameMeta.date || parsed.callDate,
        context: filenameMeta.callType || parsed.context
      });
      
      console.log(`Transcript saved: ${transcriptId}`);
      
      // Trigger processing if enabled
      if (processImmediately) {
        console.log(`Queuing for processing: ${transcriptId}`);
        // Processing happens async - will be implemented with Claude API
        processTranscript(transcriptId).catch(err => {
          console.error(`Processing failed for ${transcriptId}:`, err.message);
        });
      }
      
      if (onNewFile) {
        onNewFile({ transcriptId, filepath, parsed });
      }
      
    } catch (err) {
      console.error(`Error processing file ${filepath}:`, err);
      if (onError) {
        onError(err, filepath);
      }
    }
  });
  
  watcher.on('error', (error) => {
    console.error('Watcher error:', error);
    if (onError) {
      onError(error);
    }
  });
  
  watcher.on('ready', () => {
    console.log('Initial scan complete. Watching for changes...');
  });
  
  return watcher;
}

/**
 * Process all existing files in a folder (one-time import)
 */
export async function importFolder(folderPath) {
  const files = fs.readdirSync(folderPath);
  const results = [];
  
  for (const file of files) {
    const filepath = path.join(folderPath, file);
    const ext = path.extname(file).toLowerCase();
    
    if (!SUPPORTED_EXTENSIONS.includes(ext)) continue;
    if (transcriptExists(filepath)) continue;
    
    try {
      const parsed = parseTranscript(filepath);
      const filenameMeta = parseFilenameMetadata(parsed.filename);
      
      const transcriptId = createTranscript({
        filename: parsed.filename,
        filepath: filepath,
        rawContent: parsed.rawContent,
        durationMinutes: parsed.durationMinutes,
        callDate: filenameMeta.date || parsed.callDate,
        context: filenameMeta.callType || parsed.context
      });
      
      results.push({ transcriptId, filepath, success: true });
      console.log(`Imported: ${file}`);
      
    } catch (err) {
      results.push({ filepath, success: false, error: err.message });
      console.error(`Failed to import ${file}:`, err.message);
    }
  }
  
  return results;
}

export default {
  startWatcher,
  importFolder
};
