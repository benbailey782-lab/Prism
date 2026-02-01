import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  X,
  Upload,
  FileText,
  ClipboardPaste,
  FileUp,
  Loader2,
  Check,
  AlertCircle
} from 'lucide-react';

/**
 * CaptureModal - Floating action button with multi-input capture modal
 * Phase 3: Track D
 */
export default function CaptureModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('upload');
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [error, setError] = useState(null);

  // Upload file state
  const [dragOver, setDragOver] = useState(false);

  // Quick note state
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteContext, setNoteContext] = useState('Sales Call Notes');

  // Paste transcript state
  const [pasteContent, setPasteContent] = useState('');
  const [pasteFilename, setPasteFilename] = useState('');

  const resetState = () => {
    setUploading(false);
    setUploadResult(null);
    setError(null);
    setDragOver(false);
    setNoteTitle('');
    setNoteContent('');
    setNoteContext('Sales Call Notes');
    setPasteContent('');
    setPasteFilename('');
  };

  const handleClose = () => {
    setIsOpen(false);
    setTimeout(resetState, 300);
  };

  // File upload handler
  const handleFileUpload = useCallback(async (file) => {
    if (!file) return;

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      setUploadResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }, []);

  // Drag and drop handlers
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileUpload(file);
    }
  }, [handleFileUpload]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  // Quick note submit
  const handleNoteSubmit = async () => {
    if (!noteContent.trim()) return;

    setUploading(true);
    setError(null);

    try {
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: noteTitle,
          content: noteContent,
          context: noteContext
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save note');
      }

      setUploadResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  // Paste transcript submit
  const handlePasteSubmit = async () => {
    if (!pasteContent.trim()) return;

    setUploading(true);
    setError(null);

    try {
      const response = await fetch('/api/paste', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: pasteContent,
          filename: pasteFilename || undefined
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save transcript');
      }

      setUploadResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const tabs = [
    { id: 'upload', label: 'Upload File', icon: Upload },
    { id: 'note', label: 'Quick Note', icon: FileText },
    { id: 'paste', label: 'Paste Transcript', icon: ClipboardPaste }
  ];

  return (
    <>
      {/* FAB Button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full animated-gradient text-white shadow-lg flex items-center justify-center"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      >
        <Plus className="w-6 h-6" />
      </motion.button>

      {/* Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={handleClose}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="glass-card-elevated w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-white/5">
                <div>
                  <h2 className="text-xl font-semibold text-white">Add Content</h2>
                  <p className="text-sm text-zinc-400 mt-1">Upload files, notes, or paste transcripts</p>
                </div>
                <button
                  onClick={handleClose}
                  className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Success State */}
              {uploadResult && (
                <div className="p-6">
                  <div className="text-center py-8">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                      className="w-16 h-16 rounded-full bg-green-500/10 glow-green mx-auto mb-4 flex items-center justify-center"
                    >
                      <Check className="w-8 h-8 text-green-400" />
                    </motion.div>
                    <h3 className="text-lg font-medium text-white mb-2">
                      {uploadResult.message || 'Content Added'}
                    </h3>
                    <p className="text-sm text-zinc-400">
                      {uploadResult.filename && `File: ${uploadResult.filename}`}
                    </p>
                    {uploadResult.processingStatus === 'processing' && (
                      <p className="text-sm text-green-400 mt-2">
                        Processing started...
                      </p>
                    )}
                    <button
                      onClick={handleClose}
                      className="mt-6 px-6 py-2 rounded-xl bg-brain-500 hover:bg-brain-600 text-white transition-colors"
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}

              {/* Error State */}
              {error && !uploadResult && (
                <div className="p-6">
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-red-400">{error}</p>
                      <button
                        onClick={() => setError(null)}
                        className="text-xs text-zinc-400 hover:text-white mt-2"
                      >
                        Try again
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Content */}
              {!uploadResult && !error && (
                <>
                  {/* Tabs */}
                  <div className="flex border-b border-white/5 px-6">
                    {tabs.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`
                          flex items-center gap-2 px-4 py-3 text-sm font-medium
                          border-b-2 transition-colors
                          ${activeTab === tab.id
                            ? 'border-green-500 text-green-400'
                            : 'border-transparent text-zinc-400 hover:text-zinc-200'}
                        `}
                      >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Tab Content */}
                  <div className="flex-1 overflow-y-auto p-6">
                    {/* Upload Tab */}
                    {activeTab === 'upload' && (
                      <div
                        className={`
                          drop-zone rounded-xl p-8 text-center
                          ${dragOver ? 'drag-over' : ''}
                        `}
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                      >
                        {uploading ? (
                          <div className="py-8">
                            <Loader2 className="w-12 h-12 text-green-400 mx-auto mb-4 animate-spin" />
                            <p className="text-zinc-400">Processing file...</p>
                          </div>
                        ) : (
                          <>
                            <FileUp className="w-12 h-12 text-zinc-500 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-white mb-2">
                              Drop files here or click to upload
                            </h3>
                            <p className="text-sm text-zinc-500 mb-4">
                              Supports PDF, DOCX, TXT, MD files up to 10MB
                            </p>
                            <input
                              type="file"
                              accept=".pdf,.docx,.txt,.md,.json,.csv"
                              onChange={(e) => handleFileUpload(e.target.files[0])}
                              className="hidden"
                              id="file-upload"
                            />
                            <label
                              htmlFor="file-upload"
                              className="inline-block px-6 py-2 rounded-xl bg-brain-500 hover:bg-brain-600 text-white cursor-pointer transition-colors"
                            >
                              Choose File
                            </label>
                          </>
                        )}
                      </div>
                    )}

                    {/* Quick Note Tab */}
                    {activeTab === 'note' && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm text-zinc-400 mb-2">Title (optional)</label>
                          <input
                            type="text"
                            value={noteTitle}
                            onChange={(e) => setNoteTitle(e.target.value)}
                            placeholder="Meeting notes, call summary..."
                            className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-zinc-500 focus:border-green-500 focus:outline-none transition-colors"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-zinc-400 mb-2">Context</label>
                          <select
                            value={noteContext}
                            onChange={(e) => setNoteContext(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:border-green-500 focus:outline-none transition-colors"
                          >
                            <option value="Sales Call Notes">Sales Call Notes</option>
                            <option value="Meeting Notes">Meeting Notes</option>
                            <option value="Research">Research</option>
                            <option value="Personal Reminder">Personal Reminder</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm text-zinc-400 mb-2">Content</label>
                          <textarea
                            value={noteContent}
                            onChange={(e) => setNoteContent(e.target.value)}
                            placeholder="Write your notes here..."
                            rows={8}
                            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-zinc-500 focus:border-green-500 focus:outline-none transition-colors resize-none"
                          />
                        </div>
                        <button
                          onClick={handleNoteSubmit}
                          disabled={!noteContent.trim() || uploading}
                          className="w-full px-6 py-3 rounded-xl bg-brain-500 hover:bg-brain-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium transition-colors flex items-center justify-center gap-2"
                        >
                          {uploading ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            'Save Note'
                          )}
                        </button>
                      </div>
                    )}

                    {/* Paste Transcript Tab */}
                    {activeTab === 'paste' && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm text-zinc-400 mb-2">Filename (optional)</label>
                          <input
                            type="text"
                            value={pasteFilename}
                            onChange={(e) => setPasteFilename(e.target.value)}
                            placeholder="call-notes-jan-15.txt"
                            className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-zinc-500 focus:border-green-500 focus:outline-none transition-colors"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-zinc-400 mb-2">Transcript Content</label>
                          <textarea
                            value={pasteContent}
                            onChange={(e) => setPasteContent(e.target.value)}
                            placeholder="Paste your transcript here..."
                            rows={12}
                            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-zinc-500 focus:border-green-500 focus:outline-none transition-colors resize-none font-mono text-sm"
                          />
                        </div>
                        <button
                          onClick={handlePasteSubmit}
                          disabled={!pasteContent.trim() || uploading}
                          className="w-full px-6 py-3 rounded-xl bg-brain-500 hover:bg-brain-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium transition-colors flex items-center justify-center gap-2"
                        >
                          {uploading ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            'Save Transcript'
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
