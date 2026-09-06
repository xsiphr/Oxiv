'use client';

import { useState, useEffect, useCallback } from 'react';
import { Platform, RecentExtraction } from '@/types';
import { decodeHtmlEntities } from '@/lib/utils';

const STORAGE_KEY = 'oxiv_recents_v1';
const MAX_RECENTS = 50;

export function useRecentSearches() {
  const [recents, setRecents] = useState<RecentExtraction[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Hydrate from localStorage once mounted
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setRecents(parsed.slice(0, MAX_RECENTS));
        }
      }
    } catch (e) {
      console.warn('Failed to read recents from localStorage:', e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  const saveToStorage = (items: RecentExtraction[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.warn('Failed to write recents to localStorage:', e);
    }
  };

  const addRecent = useCallback((payload: { url: string; title: string; platform: Platform }) => {
    const cleanUrl = payload.url.trim();
    if (!cleanUrl) return;

    const decodedTitle = decodeHtmlEntities(payload.title?.trim() || '') || 'Untitled Media';
    const id = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const newItem: RecentExtraction = {
      id,
      url: cleanUrl,
      title: decodedTitle,
      platform: payload.platform,
      timestamp: Date.now(),
    };

    setRecents((prev) => {
      // Deduplicate by URL: remove previous duplicate instance
      const filtered = prev.filter((item) => item.url.toLowerCase() !== cleanUrl.toLowerCase());
      const updated = [newItem, ...filtered].slice(0, MAX_RECENTS);
      saveToStorage(updated);
      return updated;
    });
  }, []);

  const removeRecent = useCallback((id: string) => {
    setRecents((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      saveToStorage(updated);
      return updated;
    });
  }, []);

  const clearRecents = useCallback(() => {
    setRecents([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.warn('Failed to clear recents from localStorage:', e);
    }
  }, []);

  return {
    recents,
    isLoaded,
    addRecent,
    removeRecent,
    clearRecents,
  };
}
