import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { APP_VERSION, CHANGELOG, VERSION_NOTICE_DURATION_MS } from '../constants/appVersion';

const AppVersionContext = createContext(null);

const getFallbackRelease = () => {
  const current = Array.isArray(CHANGELOG)
    ? CHANGELOG.find((item) => item.version === APP_VERSION) || CHANGELOG[0]
    : null;

  return {
    version: APP_VERSION,
    title: current?.title || 'Actualización disponible',
    date: current?.date || '',
    changes: Array.isArray(current?.changes) ? current.changes : [],
    publishedAt: null,
    publishedBy: null,
    source: 'local'
  };
};

const normalizeRelease = (data) => {
  if (!data || typeof data !== 'object') return null;

  const version = String(data.version || '').trim();
  if (!version) return null;

  const rawChanges = Array.isArray(data.changes) ? data.changes : [];
  const changes = rawChanges
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const text = String(item.text || '').trim();
      if (!text) return null;
      const icon = String(item.icon || '✨').trim() || '✨';
      return { icon, text };
    })
    .filter(Boolean);

  return {
    version,
    title: String(data.title || '').trim() || 'Actualización disponible',
    date: String(data.date || '').trim(),
    changes,
    publishedAt: data.publishedAt || null,
    publishedBy: data.publishedBy || null,
    source: 'remote'
  };
};

export const AppVersionProvider = ({ children }) => {
  const fallbackRelease = useMemo(() => getFallbackRelease(), []);
  const [remoteRelease, setRemoteRelease] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let unsubscribe;

    try {
      const ref = doc(db, 'appSettings', 'version');
      unsubscribe = onSnapshot(
        ref,
        (snapshot) => {
          const normalized = snapshot.exists() ? normalizeRelease(snapshot.data()) : null;
          setRemoteRelease(normalized);
          setIsLoaded(true);
          setError(null);
        },
        (err) => {
          console.warn('No se pudo leer la configuración remota de versión:', err);
          setRemoteRelease(null);
          setIsLoaded(true);
          setError(err);
        }
      );
    } catch (err) {
      console.warn('No se pudo suscribir a la configuración de versión:', err);
      setRemoteRelease(null);
      setIsLoaded(true);
      setError(err);
    }

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  const currentRelease = remoteRelease || fallbackRelease;
  const currentVersion = currentRelease.version || APP_VERSION;

  const publishAppRelease = async (release, publisher) => {
    const version = String(release?.version || '').trim();
    const title = String(release?.title || '').trim();
    const date = String(release?.date || '').trim();
    const rawChanges = Array.isArray(release?.changes) ? release.changes : [];
    const changes = rawChanges
      .map((item) => ({
        icon: String(item?.icon || '✨').trim() || '✨',
        text: String(item?.text || '').trim()
      }))
      .filter((item) => item.text);

    if (!version) throw new Error('La versión es obligatoria.');
    if (!title) throw new Error('El título de la actualización es obligatorio.');
    if (changes.length === 0) throw new Error('Debes agregar al menos una nota de parche.');

    const payload = {
      version,
      title,
      date,
      changes,
      publishedAt: new Date().toISOString(),
      publishedBy: publisher?.uid || publisher?.email || publisher?.name || 'admin'
    };

    await setDoc(doc(db, 'appSettings', 'version'), payload, { merge: true });
    return payload;
  };

  const value = useMemo(
    () => ({
      currentVersion,
      currentRelease,
      isLoaded,
      error,
      noticeDurationMs: VERSION_NOTICE_DURATION_MS,
      publishAppRelease,
      source: currentRelease.source || (remoteRelease ? 'remote' : 'local')
    }),
    [currentVersion, currentRelease, isLoaded, error, remoteRelease]
  );

  return <AppVersionContext.Provider value={value}>{children}</AppVersionContext.Provider>;
};

export const useAppVersion = () => {
  const context = useContext(AppVersionContext);
  if (!context) {
    const fallback = getFallbackRelease();
    return {
      currentVersion: fallback.version,
      currentRelease: fallback,
      isLoaded: true,
      error: null,
      noticeDurationMs: VERSION_NOTICE_DURATION_MS,
      publishAppRelease: async () => {
        throw new Error('AppVersionProvider no está disponible.');
      },
      source: 'local'
    };
  }
  return context;
};

export default AppVersionContext;
