import { motion } from 'framer-motion';

/**
 * GlassCard - Reusable glass morphism card component
 * Variants: default, elevated, interactive, static
 */
export default function GlassCard({
  children,
  className = '',
  variant = 'default',
  glow = null,
  padding = 'p-5',
  onClick = null,
  as = 'div',
  ...props
}) {
  const baseClasses = {
    default: 'glass-card',
    elevated: 'glass-card-elevated',
    interactive: 'glass-card cursor-pointer',
    static: 'glass-card-static'
  };

  const glowClasses = {
    green: 'glow-prism',
    blue: 'glow-blue',
    purple: 'glow-purple',
    amber: 'glow-amber',
    red: 'glow-red'
  };

  const cardClass = `${baseClasses[variant] || baseClasses.default} ${padding} ${glow ? glowClasses[glow] : ''} ${className}`;

  // Interactive cards get hover/tap animations
  if (variant === 'interactive' || onClick) {
    return (
      <motion.div
        className={cardClass}
        onClick={onClick}
        whileHover={{ y: -2, transition: { duration: 0.2 } }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        {...props}
      >
        {children}
      </motion.div>
    );
  }

  const Component = as;
  return (
    <Component className={cardClass} {...props}>
      {children}
    </Component>
  );
}

/**
 * GlassCardHeader - Header section for cards
 */
export function GlassCardHeader({ children, className = '' }) {
  return (
    <div className={`flex items-center justify-between mb-4 ${className}`}>
      {children}
    </div>
  );
}

/**
 * GlassCardTitle - Title for cards
 */
export function GlassCardTitle({ children, className = '' }) {
  return (
    <h3 className={`text-base font-medium text-white ${className}`}>
      {children}
    </h3>
  );
}

/**
 * GlassCardSubtitle - Subtitle/description for cards
 */
export function GlassCardSubtitle({ children, className = '' }) {
  return (
    <p className={`text-sm text-zinc-400 ${className}`}>
      {children}
    </p>
  );
}

/**
 * GlassCardContent - Content area for cards
 */
export function GlassCardContent({ children, className = '' }) {
  return (
    <div className={`${className}`}>
      {children}
    </div>
  );
}

/**
 * GlassCardFooter - Footer section for cards
 */
export function GlassCardFooter({ children, className = '' }) {
  return (
    <div className={`mt-4 pt-4 border-t border-white/5 ${className}`}>
      {children}
    </div>
  );
}
