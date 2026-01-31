import React from 'react';

export default function Timeline({ items }) {
  if (!items || items.length === 0) {
    return <p className="text-zinc-500 text-sm">No activity yet</p>;
  }

  return (
    <div className="space-y-4">
      {items.map((item, index) => (
        <div key={item.id || index} className="relative flex gap-4">
          {/* Timeline line */}
          {index < items.length - 1 && (
            <div className="absolute left-[11px] top-6 bottom-0 w-0.5 bg-zinc-800" />
          )}

          {/* Dot */}
          <div className={`
            w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center
            ${item.type === 'success' ? 'bg-green-500/20' :
              item.type === 'warning' ? 'bg-amber-500/20' :
              item.type === 'error' ? 'bg-red-500/20' :
              'bg-zinc-800'}
          `}>
            <div className={`
              w-2 h-2 rounded-full
              ${item.type === 'success' ? 'bg-green-500' :
                item.type === 'warning' ? 'bg-amber-500' :
                item.type === 'error' ? 'bg-red-500' :
                'bg-zinc-500'}
            `} />
          </div>

          {/* Content */}
          <div className="flex-1 pb-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm text-zinc-200">{item.title}</p>
              {item.date && (
                <span className="text-xs text-zinc-500">{item.date}</span>
              )}
            </div>
            {item.description && (
              <p className="text-xs text-zinc-500 mt-1">{item.description}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
