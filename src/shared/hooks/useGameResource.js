// src/hooks/useGameResource.js
import { useEffect, useState } from 'react';
import { getGameResourceUrl } from '../api/sigResourceStorage';

export function useGameResource(category, filename, options = {}) {
  const { fallbackUrl = null } = options;

  const [url, setUrl] = useState(fallbackUrl);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        const resourceUrl = await getGameResourceUrl(category, filename);
        if (!cancelled) {
          setUrl(resourceUrl);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) {
          console.error('useGameResource error:', e);
          setError(e);
          // fallbackUrl이 있으면 그대로 유지 / 없으면 null
          setUrl(fallbackUrl);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [category, filename, fallbackUrl]);

  return { url, loading, error };
}