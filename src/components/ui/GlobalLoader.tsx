"use client";

import { useEffect, useState } from 'react';
import PraxisLoader from './PraxisLoader';

export default function GlobalLoader() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Forzar permanencia del loader durante 4 segundos
    const timer = setTimeout(() => {
      setLoading(false);
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

  if (!loading) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#0D111D] transition-opacity duration-500 ease-out">
      <PraxisLoader size={90} />
    </div>
  );
}