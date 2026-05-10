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
          // ignore
        }
      }

      async function check() {
        // Start the timer immediately — do not wait for storage
        timeoutRef.current = setTimeout(() => {
          timeoutRef.current = null;
          start(tabKey, 0, markDone);
        }, delay);

        // Concurrently check if the tour has already been completed
        try {
          if (!_config.alwaysShow && _config.storage) {
            const done = await _config.storage.get(dbKey);
            if (done && timeoutRef.current !== null) {
              // Tour already completed — cancel the timer
              clearTimeout(timeoutRef.current);
              timeoutRef.current = null;
              visitCount.current -= 1;
            }
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
