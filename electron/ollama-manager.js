/**
 * Ollama Manager - Handles Ollama detection, startup, and health monitoring
 */

import { spawn, exec } from 'child_process';
import path from 'path';
import fs from 'fs';

const OLLAMA_DEFAULT_PORT = 11434;
const OLLAMA_MODEL = 'llama3.1:8b';

/**
 * Check if Ollama is running
 */
export async function isOllamaRunning() {
  try {
    const response = await fetch(`http://localhost:${OLLAMA_DEFAULT_PORT}/api/tags`);
    return response.ok;
  } catch (err) {
    return false;
  }
}

/**
 * Check if Ollama is installed
 */
export async function isOllamaInstalled() {
  return new Promise((resolve) => {
    const command = process.platform === 'win32' ? 'where ollama' : 'which ollama';
    exec(command, (error, stdout) => {
      if (error || !stdout.trim()) {
        // Check common installation paths
        const commonPaths = process.platform === 'win32'
          ? [
              path.join(process.env.LOCALAPPDATA || '', 'Programs', 'Ollama', 'ollama.exe'),
              path.join(process.env.PROGRAMFILES || '', 'Ollama', 'ollama.exe')
            ]
          : [
              '/usr/local/bin/ollama',
              '/usr/bin/ollama',
              path.join(process.env.HOME || '', '.local', 'bin', 'ollama')
            ];

        for (const p of commonPaths) {
          if (fs.existsSync(p)) {
            resolve({ installed: true, path: p });
            return;
          }
        }
        resolve({ installed: false, path: null });
      } else {
        resolve({ installed: true, path: stdout.trim().split('\n')[0] });
      }
    });
  });
}

/**
 * Check if the required model is available
 */
export async function isModelAvailable(modelName = OLLAMA_MODEL) {
  try {
    const response = await fetch(`http://localhost:${OLLAMA_DEFAULT_PORT}/api/tags`);
    if (!response.ok) return false;

    const data = await response.json();
    const models = data.models || [];
    return models.some(m => m.name.includes(modelName.split(':')[0]));
  } catch (err) {
    return false;
  }
}

/**
 * Start Ollama server
 */
export async function startOllama(ollamaPath) {
  return new Promise((resolve, reject) => {
    const execPath = ollamaPath || 'ollama';

    // Spawn ollama serve as detached process
    const child = spawn(execPath, ['serve'], {
      detached: true,
      stdio: 'ignore',
      shell: process.platform === 'win32'
    });

    child.unref();

    // Wait for Ollama to start
    let attempts = 0;
    const maxAttempts = 15;

    const checkHealth = async () => {
      if (attempts >= maxAttempts) {
        reject(new Error('Ollama failed to start within 15 seconds'));
        return;
      }

      attempts++;

      if (await isOllamaRunning()) {
        resolve(true);
      } else {
        setTimeout(checkHealth, 1000);
      }
    };

    // Start checking after a brief delay
    setTimeout(checkHealth, 1000);
  });
}

/**
 * Get Ollama status
 */
export async function getOllamaStatus() {
  const status = {
    running: false,
    installed: false,
    installedPath: null,
    modelAvailable: false,
    modelName: OLLAMA_MODEL,
    error: null
  };

  try {
    // Check if running
    status.running = await isOllamaRunning();

    if (status.running) {
      // Check for model
      status.modelAvailable = await isModelAvailable(OLLAMA_MODEL);
    } else {
      // Check if installed
      const installCheck = await isOllamaInstalled();
      status.installed = installCheck.installed;
      status.installedPath = installCheck.path;
    }
  } catch (err) {
    status.error = err.message;
  }

  return status;
}

/**
 * Initialize Ollama - attempt to start if not running
 */
export async function initializeOllama() {
  const status = await getOllamaStatus();

  if (status.running) {
    console.log('Ollama is already running');
    if (!status.modelAvailable) {
      console.log(`Model ${OLLAMA_MODEL} not found. Please run: ollama pull ${OLLAMA_MODEL}`);
    }
    return status;
  }

  if (status.installed && status.installedPath) {
    console.log('Attempting to start Ollama...');
    try {
      await startOllama(status.installedPath);
      status.running = true;
      status.modelAvailable = await isModelAvailable(OLLAMA_MODEL);
      console.log('Ollama started successfully');
    } catch (err) {
      console.error('Failed to start Ollama:', err.message);
      status.error = err.message;
    }
  } else {
    console.log('Ollama is not installed');
  }

  return status;
}

/**
 * Periodic health check
 */
export function startHealthMonitor(onStatusChange, intervalMs = 60000) {
  let lastStatus = null;

  const check = async () => {
    const status = await getOllamaStatus();

    if (JSON.stringify(status) !== JSON.stringify(lastStatus)) {
      lastStatus = status;
      if (onStatusChange) {
        onStatusChange(status);
      }
    }
  };

  // Initial check
  check();

  // Start interval
  const intervalId = setInterval(check, intervalMs);

  return () => clearInterval(intervalId);
}

export default {
  isOllamaRunning,
  isOllamaInstalled,
  isModelAvailable,
  startOllama,
  getOllamaStatus,
  initializeOllama,
  startHealthMonitor,
  OLLAMA_MODEL
};
