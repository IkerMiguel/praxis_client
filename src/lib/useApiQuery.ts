"use client";

import { useCallback, useEffect, useRef, useState } from 'react';
import { apiErrorMessage, apiStatus } from './apiError';

interface QueryState<T> {
  data: T | undefined;
  error: string;
  status: number | null;
  loading: boolean;
  /** true solo en la primera carga; las recargas conservan los datos anteriores. */
  initialLoading: boolean;
  reload: () => Promise<void>;
  setData: (updater: T | ((current: T | undefined) => T)) => void;
}

/**
 * Carga datos de la API y vuelve a pedirlos cuando cambia la clave.
 * Ignora respuestas que llegan tarde si la clave cambió mientras tanto.
 */
export function useApiQuery<T>(key: string | null, fetcher: () => Promise<T>): QueryState<T> {
  const [data, setDataState] = useState<T | undefined>(undefined);
  const [error, setError] = useState('');
  const [status, setStatus] = useState<number | null>(null);
  const [loading, setLoading] = useState(key !== null);
  const fetcherRef = useRef(fetcher);
  const latestKey = useRef(key);

  useEffect(() => {
    fetcherRef.current = fetcher;
  });

  const run = useCallback(async (requestKey: string | null) => {
    if (requestKey === null) return;
    latestKey.current = requestKey;
    setLoading(true);
    setError('');
    try {
      const result = await fetcherRef.current();
      if (latestKey.current === requestKey) {
        setDataState(result);
        setStatus(null);
      }
    } catch (err) {
      if (latestKey.current === requestKey) {
        setError(apiErrorMessage(err, 'No se pudo cargar la información.'));
        setStatus(apiStatus(err));
      }
    } finally {
      if (latestKey.current === requestKey) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => void run(key), 0);
    return () => clearTimeout(timer);
  }, [key, run]);

  const reload = useCallback(() => run(latestKey.current), [run]);

  const setData = useCallback((updater: T | ((current: T | undefined) => T)) => {
    setDataState((current) => (typeof updater === 'function' ? (updater as (c: T | undefined) => T)(current) : updater));
  }, []);

  return { data, error, status, loading, initialLoading: loading && data === undefined, reload, setData };
}
