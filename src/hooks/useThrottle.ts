import { useRef, useCallback } from 'react';

/**
 * Hook personnalisé pour implémenter le throttling
 * Limite la fréquence d'exécution d'une fonction à une fois par intervalle donné
 * 
 * @param callback - Fonction à throttler
 * @param delay - Délai minimum entre les exécutions (en ms)
 * @returns Fonction throttlée
 */
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const lastCallTimeRef = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const throttledCallback = useCallback((...args: Parameters<T>) => {
    const now = Date.now();
    const timeSinceLastCall = now - lastCallTimeRef.current;

    // Si assez de temps s'est écoulé depuis le dernier appel
    if (timeSinceLastCall >= delay) {
      lastCallTimeRef.current = now;
      callback(...args);
    } else {
      // Sinon, programmer un appel différé pour compléter l'intervalle
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      const remainingTime = delay - timeSinceLastCall;
      timeoutRef.current = setTimeout(() => {
        lastCallTimeRef.current = Date.now();
        callback(...args);
        timeoutRef.current = null;
      }, remainingTime);
    }
  }, [callback, delay]) as T;

  // Cleanup function pour nettoyer les timeouts
  const cleanup = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // Exposer la fonction de cleanup via une propriété
  (throttledCallback as any).cleanup = cleanup;

  return throttledCallback;
}
