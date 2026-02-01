import React from 'react';
import { Inbox } from 'lucide-react';

export default function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  actionLabel,
  className = ''
}) {
  return (
    <div className={`text-center py-12 ${className}`}>
      <Icon className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
      {title && (
        <h3 className="text-lg font-medium text-zinc-300 mb-2">{title}</h3>
      )}
      {description && (
        <p className="text-zinc-500 mb-6 max-w-md mx-auto">{description}</p>
      )}
      {action && actionLabel && (
        <button
          onClick={action}
          className="px-4 py-2 bg-prism-500 hover:bg-prism-blue text-white rounded-lg font-medium transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
