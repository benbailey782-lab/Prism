import React, { useState, useEffect } from 'react';
import { FileText, Clock, Calendar, ChevronRight, Loader2, FolderOpen } from 'lucide-react';

function TranscriptList({ onSelect }) {
  const [transcripts, setTranscripts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTranscripts();
    
    // Poll for new transcripts every 5 seconds
    const interval = setInterval(fetchTranscripts, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchTranscripts = async () => {
    try {
      const res = await fetch('/api/transcripts');
      const data = await res.json();
      setTranscripts(Array.isArray(data) ? data : []);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-zinc-500 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20 text-red-400">
        Error loading transcripts: {error}
      </div>
    );
  }

  if (transcripts.length === 0) {
    return (
      <div className="text-center py-20">
        <FolderOpen className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-zinc-400 mb-2">No transcripts yet</h3>
        <p className="text-sm text-zinc-600 max-w-md mx-auto">
          Drop transcript files (.txt, .md, .json) into the watch folder to get started.
          They'll appear here automatically.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-white">Transcripts</h2>
        <span className="text-sm text-zinc-500">{transcripts.length} files</span>
      </div>

      <div className="space-y-2">
        {transcripts.map(transcript => (
          <TranscriptCard 
            key={transcript.id} 
            transcript={transcript} 
            onClick={() => onSelect(transcript)}
          />
        ))}
      </div>
    </div>
  );
}

function TranscriptCard({ transcript, onClick }) {
  const isProcessed = !!transcript.processed_at;
  
  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 
                 hover:bg-zinc-800/50 hover:border-zinc-700 transition-all group"
    >
      <div className="flex items-start gap-4">
        <div className={`
          w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0
          ${isProcessed ? 'bg-prism-blue/10 text-prism-blue' : 'bg-zinc-800 text-zinc-500'}
        `}>
          <FileText className="w-5 h-5" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-medium text-white truncate">{transcript.filename}</h3>
            {!isProcessed && (
              <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded">
                Pending
              </span>
            )}
          </div>

          {transcript.summary && (
            <p className="text-sm text-zinc-400 line-clamp-2 mb-2">
              {transcript.summary}
            </p>
          )}

          <div className="flex items-center gap-4 text-xs text-zinc-500">
            {transcript.duration_minutes && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {transcript.duration_minutes} min
              </span>
            )}
            {transcript.call_date && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {new Date(transcript.call_date).toLocaleDateString()}
              </span>
            )}
            {transcript.context && (
              <span className="bg-zinc-800 px-2 py-0.5 rounded">
                {transcript.context}
              </span>
            )}
          </div>
        </div>

        <ChevronRight className="w-5 h-5 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
      </div>
    </button>
  );
}

export default TranscriptList;
