import { motion } from 'framer-motion';
import React from 'react';

interface PageTransitionProps {
  children: React.ReactNode;
}

/**
 * Wraps every page. Fades + slides up slightly on mount.
 * Because framer-motion's AnimatePresence needs a key change
 * to detect route switches, this is keyed in App.tsx using useLocation.
 */
export const PageTransition: React.FC<PageTransitionProps> = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -6 }}
    transition={{ duration: 0.22, ease: 'easeOut' }}
    style={{ width: '100%' }}
  >
    {children}
  </motion.div>
);
