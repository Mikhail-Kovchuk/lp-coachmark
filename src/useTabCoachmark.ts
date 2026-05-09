import { useRef } from 'react';
import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { useCoachmark } from './CoachmarkContext';

export function useTabCoachmark(tabKey: string) {
  const { start, _config } = useCoachmark();
  const visitCount = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!_config.enabled) return;
      const isFirstVisit = visitCount.current === 0;
      visitCount.current += 1;

      const dbKey = `coachmark_done_${tabKey}`;
      const delay = isFirstVisit ? 100 : 1200;

      async function markDone() {
        if (_config.alwaysShow) return;
        try {
          await _config.storage?.set(dbKey, '1');
        } catch {
          // ігноруємо
        }
      }

      async function check() {
        try {
          let done: string | null = null;
          if (_config.storage) {
            done = await _config.storage.get(dbKey);
          }
          if (_config.alwaysShow || !done) {
            timeoutRef.current = setTimeout(() => {
              timeoutRef.current = null;
              start(tabKey, 0, markDone);
            }, delay);
          }
        } catch (e) {
          console.log('[lp-coachmark] check() error:', e);
        }
      }

      void check();

      return () => {
        if (timeoutRef.current !== null) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
          visitCount.current -= 1;
        }
      };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
  );
}
