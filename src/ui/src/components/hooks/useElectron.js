import { useState, useEffect } from 'react';

/**
 * Hook to detect and interact with Electron environment
 */
export function useElectron() {
  const [isElectron, setIsElectron] = useState(false);
  const [platform, setPlatform] = useState(null);
  const [version, setVersion] = useState(null);
  const [appPath, setAppPath] = useState(null);

  useEffect(() => {
    // Check if running in Electron
    if (typeof window !== 'undefined' && window.electronAPI?.isElectron) {
      setIsElectron(true);

      // Load Electron-specific info
      Promise.all([
        window.electronAPI.getPlatform?.(),
        window.electronAPI.getVersion?.(),
        window.electronAPI.getAppPath?.()
      ]).then(([p, v, a]) => {
        if (p) setPlatform(p);
        if (v) setVersion(v);
        if (a) setAppPath(a);
      }).catch(console.error);
    }
  }, []);

  // Helper functions
  const selectFolder = async () => {
    if (!isElectron || !window.electronAPI?.selectFolder) {
      return null;
    }
    return window.electronAPI.selectFolder();
  };

  const getConfig = async () => {
    if (!isElectron || !window.electronAPI?.getConfig) {
      return null;
    }
    return window.electronAPI.getConfig();
  };

  const saveConfig = async (config) => {
    if (!isElectron || !window.electronAPI?.saveConfig) {
      return null;
    }
    return window.electronAPI.saveConfig(config);
  };

  return {
    isElectron,
    platform,
    version,
    appPath,
    selectFolder,
    getConfig,
    saveConfig
  };
}

export default useElectron;
