/**
 * Shimmer - Loading skeleton components
 */

/**
 * ShimmerBlock - Basic shimmer block
 */
export function ShimmerBlock({ className = '', width = 'w-full', height = 'h-4' }) {
  return (
    <div className={`shimmer rounded ${width} ${height} ${className}`} />
  );
}

/**
 * ShimmerText - Shimmer for text lines
 */
export function ShimmerText({ lines = 3, className = '' }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <ShimmerBlock
          key={i}
          width={i === lines - 1 ? 'w-2/3' : 'w-full'}
          height="h-4"
        />
      ))}
    </div>
  );
}

/**
 * ShimmerCard - Full card skeleton
 */
export function ShimmerCard({ className = '' }) {
  return (
    <div className={`glass-card-static p-5 ${className}`}>
      <div className="flex items-start gap-4">
        <ShimmerBlock width="w-10" height="h-10" className="rounded-xl flex-shrink-0" />
        <div className="flex-1 space-y-3">
          <ShimmerBlock width="w-1/2" height="h-5" />
          <ShimmerBlock width="w-3/4" height="h-4" />
          <ShimmerBlock width="w-1/4" height="h-3" />
        </div>
      </div>
    </div>
  );
}

/**
 * ShimmerCardList - Multiple card skeletons
 */
export function ShimmerCardList({ count = 3, className = '' }) {
  return (
    <div className={`space-y-4 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <ShimmerCard key={i} />
      ))}
    </div>
  );
}

/**
 * ShimmerStatCard - Stat card skeleton
 */
export function ShimmerStatCard({ className = '' }) {
  return (
    <div className={`glass-card-static p-5 ${className}`}>
      <div className="flex items-center gap-4">
        <ShimmerBlock width="w-10" height="h-10" className="rounded-xl" />
        <div className="flex-1">
          <ShimmerBlock width="w-20" height="h-8" className="mb-2" />
          <ShimmerBlock width="w-24" height="h-3" />
        </div>
      </div>
    </div>
  );
}

/**
 * ShimmerStatGrid - Grid of stat card skeletons
 */
export function ShimmerStatGrid({ count = 4, className = '' }) {
  return (
    <div className={`grid grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <ShimmerStatCard key={i} />
      ))}
    </div>
  );
}

/**
 * ShimmerDetail - Detail page skeleton
 */
export function ShimmerDetail({ className = '' }) {
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-4">
        <ShimmerBlock width="w-16" height="h-16" className="rounded-xl" />
        <div className="flex-1">
          <ShimmerBlock width="w-1/3" height="h-7" className="mb-2" />
          <ShimmerBlock width="w-1/4" height="h-4" />
        </div>
      </div>

      {/* Stats */}
      <ShimmerStatGrid count={4} />

      {/* Content */}
      <div className="glass-card-static p-5">
        <ShimmerBlock width="w-1/4" height="h-5" className="mb-4" />
        <ShimmerText lines={4} />
      </div>

      {/* More content */}
      <div className="glass-card-static p-5">
        <ShimmerBlock width="w-1/3" height="h-5" className="mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <ShimmerBlock width="w-8" height="h-8" className="rounded-lg" />
              <ShimmerBlock width="w-2/3" height="h-4" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * ShimmerMeddpicc - MEDDPICC scorecard skeleton
 */
export function ShimmerMeddpicc({ className = '' }) {
  return (
    <div className={`flex gap-2 ${className}`}>
      {Array.from({ length: 8 }).map((_, i) => (
        <ShimmerBlock key={i} width="w-11" height="h-11" className="rounded-lg" />
      ))}
    </div>
  );
}

/**
 * ShimmerMessage - Chat message skeleton
 */
export function ShimmerMessage({ isUser = false, className = '' }) {
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} ${className}`}>
      <div className={`glass-card-static p-4 max-w-[80%] ${isUser ? 'ml-auto' : 'mr-auto'}`}>
        <ShimmerText lines={isUser ? 1 : 3} />
      </div>
    </div>
  );
}

/**
 * ShimmerConversation - Conversation skeleton
 */
export function ShimmerConversation({ count = 3, className = '' }) {
  return (
    <div className={`space-y-4 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <ShimmerMessage key={i} isUser={i % 2 === 0} />
      ))}
    </div>
  );
}

export default {
  ShimmerBlock,
  ShimmerText,
  ShimmerCard,
  ShimmerCardList,
  ShimmerStatCard,
  ShimmerStatGrid,
  ShimmerDetail,
  ShimmerMeddpicc,
  ShimmerMessage,
  ShimmerConversation
};
