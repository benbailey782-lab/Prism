import React, { useState, useRef, useEffect } from 'react';
import {
  Send, Brain, User, Loader2, Sparkles, MessageSquare,
  FileText, Target, Users, Lightbulb, AlertCircle
} from 'lucide-react';

const SUGGESTED_QUESTIONS = [
  { icon: Target, text: "What's the status of my active deals?" },
  { icon: Users, text: "Who are my key contacts at each account?" },
  { icon: Lightbulb, text: "What patterns have you noticed in my won deals?" },
  { icon: FileText, text: "Summarize my last conversation with..." },
];

export default function AskPanel() {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim() || loading) return;

    const userMessage = query.trim();
    setQuery('');
    setError(null);
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: userMessage })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to get response');
      }

      const data = await res.json();
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.answer,
        sources: data.sources
      }]);
    } catch (err) {
      setError(err.message);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your request.',
        error: true
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setQuery(suggestion);
    inputRef.current?.focus();
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-white">Ask Sales Brain</h1>
        <p className="text-zinc-400 text-sm mt-1">
          Ask questions about your deals, contacts, and sales insights
        </p>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto mb-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center mb-4">
              <Brain className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-medium text-white mb-2">
              How can I help you today?
            </h2>
            <p className="text-zinc-400 text-sm max-w-md mb-8">
              I can answer questions about your sales data, provide insights, and help you prepare for calls.
            </p>

            {/* Suggested questions */}
            <div className="grid grid-cols-2 gap-3 w-full max-w-xl">
              {SUGGESTED_QUESTIONS.map((q, idx) => {
                const Icon = q.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => handleSuggestionClick(q.text)}
                    className="flex items-center gap-3 p-3 bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700/50 hover:border-zinc-600 rounded-xl text-left transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-zinc-700 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4 text-zinc-400" />
                    </div>
                    <span className="text-sm text-zinc-300">{q.text}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, idx) => (
              <MessageBubble key={idx} message={msg} />
            ))}
            {loading && (
              <div className="flex items-center gap-3 p-4">
                <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <Loader2 className="w-4 h-4 text-green-400 animate-spin" />
                </div>
                <span className="text-sm text-zinc-400">Thinking...</span>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Error display */}
      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <span className="text-sm text-red-400">{error}</span>
        </div>
      )}

      {/* Input area */}
      <form onSubmit={handleSubmit} className="relative">
        <div className="flex items-center gap-2 bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-2 focus-within:border-green-500/50">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask a question about your sales data..."
            className="flex-1 bg-transparent px-3 py-2 text-zinc-200 placeholder-zinc-500 focus:outline-none"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={!query.trim() || loading}
            className="p-2 bg-green-600 hover:bg-green-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white rounded-lg transition-colors"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
        <p className="text-xs text-zinc-600 mt-2 text-center">
          Powered by AI. Responses are based on your sales data.
        </p>
      </form>
    </div>
  );
}

function MessageBubble({ message }) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-4 h-4 text-green-400" />
        </div>
      )}

      <div className={`max-w-[80%] ${isUser ? 'order-first' : ''}`}>
        <div className={`rounded-xl p-4 ${
          isUser
            ? 'bg-green-600/20 border border-green-500/30'
            : message.error
              ? 'bg-red-500/10 border border-red-500/30'
              : 'bg-zinc-800/50 border border-zinc-700/50'
        }`}>
          <p className={`text-sm ${isUser ? 'text-green-100' : message.error ? 'text-red-300' : 'text-zinc-200'}`}>
            {message.content}
          </p>
        </div>

        {/* Sources */}
        {message.sources && message.sources.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {message.sources.map((source, idx) => (
              <span
                key={idx}
                className="text-xs px-2 py-1 bg-zinc-700/50 text-zinc-400 rounded-full"
              >
                {source.type}: {source.name || source.id}
              </span>
            ))}
          </div>
        )}
      </div>

      {isUser && (
        <div className="w-8 h-8 rounded-lg bg-zinc-700 flex items-center justify-center flex-shrink-0">
          <User className="w-4 h-4 text-zinc-400" />
        </div>
      )}
    </div>
  );
}
