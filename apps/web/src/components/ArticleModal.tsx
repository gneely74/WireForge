import React from "react";
import { X, ExternalLink, Clock, ShieldCheck, Share2 } from "lucide-react";
import { useWireForgeStore } from "../store/wireforge-store.js";

export const ArticleModal: React.FC = () => {
  const { selectedArticle, setSelectedArticle, setSelectedTicker } = useWireForgeStore();

  if (!selectedArticle) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 select-none"
      onClick={() => setSelectedArticle(null)}
    >
      <div
        className="flex flex-col w-full max-w-2xl rounded-xl border border-[#273248] bg-[#121622] shadow-2xl overflow-hidden max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#20293b] bg-[#161c2b]">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-blue-400 uppercase font-bold">
              {selectedArticle.source}
            </span>
            <span className="text-gray-600">•</span>
            <span className="text-xs text-gray-400 font-mono">
              {new Date(selectedArticle.timestamp).toLocaleString()}
            </span>
          </div>

          <button
            onClick={() => setSelectedArticle(null)}
            className="p-1 text-gray-400 hover:text-white rounded"
          >
            <X size={18} />
          </button>
        </div>

        {/* Article Body */}
        <div className="p-6 flex flex-col gap-4 overflow-y-auto text-sm">
          {/* Ticker Badges */}
          <div className="flex items-center gap-2">
            {selectedArticle.tickers.map((t) => (
              <button
                key={t}
                onClick={() => setSelectedTicker(t)}
                className="px-2 py-1 rounded bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white font-mono font-bold text-xs transition-colors border border-blue-500/30"
              >
                ${t} Chart
              </button>
            ))}

            <span className="text-xs px-2 py-0.5 rounded bg-[#1f283b] text-gray-300 font-mono uppercase font-semibold">
              {selectedArticle.category}
            </span>
          </div>

          {/* Title */}
          <h2 className="font-bold text-lg text-white leading-snug">
            {selectedArticle.title}
          </h2>

          {/* Summary Callout */}
          <div className="p-3 rounded-lg bg-[#182030] border-l-4 border-blue-500 text-gray-300 text-xs leading-relaxed font-medium">
            {selectedArticle.summary}
          </div>

          {/* Main Full Text Content */}
          <div className="text-gray-300 text-xs leading-relaxed space-y-3 font-sans">
            {selectedArticle.content ? (
              <p>{selectedArticle.content}</p>
            ) : (
              <p>{selectedArticle.summary}</p>
            )}
          </div>

          {/* Footer link */}
          {selectedArticle.url && (
            <div className="pt-4 border-t border-[#1f283b] flex items-center justify-between">
              <a
                href={selectedArticle.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 text-blue-400 hover:text-blue-300 text-xs font-mono font-medium"
              >
                <span>View Full Source Filing / Release</span>
                <ExternalLink size={13} />
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
