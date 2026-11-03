"use client";

import { motion } from 'motion/react';
import PraxisLoader from './PraxisLoader';

/** Loader institucional a pantalla completa para arranque de sesión y cambios de vista. */
export default function FullscreenLoader({ label = 'Cargando' }: { label?: string }) {
  return (
    <motion.div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-[#0D111D]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      <PraxisLoader size={96} label={label} />
    </motion.div>
  );
}
