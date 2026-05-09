import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { CoachmarkContextValue, CoachmarkStep, CoachmarkStorage } from './types';
import CoachmarkOverlay from './CoachmarkOverlay';

const CoachmarkContext = createContext<CoachmarkContextValue | null>(null);

interface Props {
  children: ReactNode;
  /**
   * Висота tab bar (включаючи safe area insets.bottom).
   * Використовується для блокування тапів по tab bar під час туру.
   * Default: 0
   */
  tabBarHeight?: number;
  /**
   * Вимкнути всі тури. Default: true
   */
  enabled?: boolean;
  /**
   * Завжди показувати тур, ігноруючи збережений стан. Default: false
   * Використовується для розробки.
   */
  alwaysShow?: boolean;
  /**
   * Адаптер для збереження стану "тур показано".
   * Якщо не передано — стан не зберігається (тур буде показуватись щоразу).
   *
   * @example
   * // AsyncStorage
   * storage={{ get: AsyncStorage.getItem, set: AsyncStorage.setItem }}
   *
   * @example
   * // expo-sqlite через власні функції
   * storage={{ get: (key) => getSetting(db, key), set: (key, val) => saveSetting(db, key, val) }}
   */
  storage?: CoachmarkStorage;
}

export function CoachmarkProvider({
  children,
  tabBarHeight = 0,
  enabled = true,
  alwaysShow = false,
  storage = undefined,
}: Props) {
  const stepsMapRef = useRef<Map<string, CoachmarkStep>>(new Map());
  const orderedKeysRef = useRef<string[]>([]);
  const onFinishRef = useRef<(() => void) | undefined>(undefined);
  const afterFinishRef = useRef<(() => void) | undefined>(undefined);

  const [isActive, setIsActive] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [orderedSteps, setOrderedSteps] = useState<CoachmarkStep[]>([]);

  const isActiveRef = useRef(false);
  const currentIndexRef = useRef(0);
  const orderedStepsRef = useRef<CoachmarkStep[]>([]);

  const registerStep = useCallback((key: string, step: CoachmarkStep) => {
    stepsMapRef.current.set(key, step);
    if (!orderedKeysRef.current.includes(key)) {
      orderedKeysRef.current.push(key);
    }
  }, []);

  const unregisterStep = useCallback((key: string) => {
    stepsMapRef.current.delete(key);
    orderedKeysRef.current = orderedKeysRef.current.filter((k) => k !== key);
  }, []);

  const start = useCallback((tabKey: string, fromIndex = 0, onFinish?: () => void) => {
    const steps = orderedKeysRef.current
      .map((k) => stepsMapRef.current.get(k))
      .filter((s): s is CoachmarkStep => s?.tabKey === tabKey);

    if (isActiveRef.current) return;
    if (steps.length === 0) return;
    onFinishRef.current = onFinish;
    orderedStepsRef.current = steps;
    currentIndexRef.current = fromIndex;
    isActiveRef.current = true;
    setOrderedSteps(steps);
    setCurrentIndex(fromIndex);
    setIsActive(true);
  }, []);

  const afterFinish = useCallback((cb: () => void) => {
    afterFinishRef.current = cb;
  }, []);

  const finish = useCallback(() => {
    isActiveRef.current = false;
    setIsActive(false);
    setOrderedSteps([]);
    onFinishRef.current?.();
    onFinishRef.current = undefined;
    afterFinishRef.current?.();
    afterFinishRef.current = undefined;
  }, []);

  const handleNext = useCallback(() => {
    const next = currentIndexRef.current + 1;
    if (next >= orderedStepsRef.current.length) {
      finish();
      return;
    }
    currentIndexRef.current = next;
    setCurrentIndex(next);
  }, [finish]);

  const handlePrev = useCallback(() => {
    const newIdx = Math.max(0, currentIndexRef.current - 1);
    currentIndexRef.current = newIdx;
    setCurrentIndex(newIdx);
  }, []);

  const handleSkip = useCallback(() => {
    finish();
  }, [finish]);

  const resumeAfterTap = useCallback(() => {
    if (!isActiveRef.current) return;
    const next = currentIndexRef.current + 1;
    if (next >= orderedStepsRef.current.length) {
      finish();
      return;
    }
    currentIndexRef.current = next;
    setCurrentIndex(next);
  }, [finish]);

  const _config = { enabled, alwaysShow, storage: storage ?? null };

  return (
    <CoachmarkContext.Provider value={{ registerStep, unregisterStep, start, resumeAfterTap, afterFinish, isActive, _config }}>
      {children}
      {isActive && orderedSteps.length > 0 && (
        <CoachmarkOverlay
          step={orderedSteps[currentIndex]}
          currentIndex={currentIndex}
          totalSteps={orderedSteps.length}
          tabBarHeight={tabBarHeight}
          onNext={handleNext}
          onPrev={handlePrev}
          onSkip={handleSkip}
        />
      )}
    </CoachmarkContext.Provider>
  );
}

export function useCoachmark(): CoachmarkContextValue {
  const ctx = useContext(CoachmarkContext);
  if (!ctx) throw new Error('useCoachmark must be used inside CoachmarkProvider');
  return ctx;
}
