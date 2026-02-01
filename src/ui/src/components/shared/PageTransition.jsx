import { motion, AnimatePresence } from 'framer-motion';

/**
 * PageTransition - Wrapper for smooth page transitions
 */
export default function PageTransition({ children, className = '' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * StaggerContainer - Container for staggered child animations
 */
export function StaggerContainer({ children, className = '', staggerDelay = 0.05 }) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: {
          transition: { staggerChildren: staggerDelay }
        }
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * StaggerItem - Item for staggered animations
 */
export function StaggerItem({ children, className = '' }) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0 }
      }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * FadeIn - Simple fade in animation
 */
export function FadeIn({ children, className = '', delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * SlideIn - Slide in from a direction
 */
export function SlideIn({
  children,
  className = '',
  direction = 'up',
  delay = 0
}) {
  const directionMap = {
    up: { y: 20 },
    down: { y: -20 },
    left: { x: 20 },
    right: { x: -20 }
  };

  return (
    <motion.div
      initial={{ opacity: 0, ...directionMap[direction] }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ duration: 0.3, delay, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * ScaleIn - Scale in animation
 */
export function ScaleIn({ children, className = '', delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        duration: 0.2,
        delay,
        ease: 'easeOut',
        scale: { type: 'spring', stiffness: 300, damping: 25 }
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * AnimatedList - Animated list with staggered items
 */
export function AnimatedList({
  items,
  renderItem,
  keyExtractor,
  className = '',
  itemClassName = '',
  staggerDelay = 0.05
}) {
  return (
    <StaggerContainer className={className} staggerDelay={staggerDelay}>
      {items.map((item, index) => (
        <StaggerItem key={keyExtractor ? keyExtractor(item) : index} className={itemClassName}>
          {renderItem(item, index)}
        </StaggerItem>
      ))}
    </StaggerContainer>
  );
}
