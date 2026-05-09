import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';
import { View, ScrollView } from 'react-native';
import { useCoachmark } from './CoachmarkContext';
import type { CoachmarkStep } from './types';

interface Options {
  /** унікальний ключ, визначає порядок реєстрації */
  key: string;
  /** вкладка до якої належить крок — має збігатись з tabKey у useTabCoachmark */
  tabKey: string;
  title: string;
  description: string;
  shape?: CoachmarkStep['shape'];
  padding?: number;
  /** ref до ScrollView що містить цей елемент — для автоскролу */
  scrollRef?: RefObject<ScrollView | null>;
  /** зміщення скролу (default: центр екрана) */
  scrollOffset?: number;
  /** обрізати spotlight до меж екрану по осі X */
  clampToScreen?: boolean;
  /** overlay показує маску + руку; тап на spotlight викликає onTap; перехід через resumeAfterTap() */
  tapHint?: boolean;
  /** викликається при тапі на spotlight-зону */
  onTap?: () => void;
  /** сховати кнопку "Назад" на цьому кроці */
  hidePrev?: boolean;
  /** крок реєструється тільки якщо true (default: true) */
  enabled?: boolean;
}

export function useCoachmarkStep(options: Options) {
  const ref = useRef<View>(null);
  const onTapRef = useRef<(() => void) | undefined>(options.onTap);
  onTapRef.current = options.onTap;

  const { registerStep, unregisterStep } = useCoachmark();

  useEffect(() => {
    if (options.enabled === false) return;
    registerStep(options.key, {
      targetRef: ref,
      title: options.title,
      description: options.description,
      tabKey: options.tabKey,
      shape: options.shape,
      padding: options.padding,
      scrollRef: options.scrollRef,
      scrollOffset: options.scrollOffset,
      clampToScreen: options.clampToScreen,
      tapHint: options.tapHint,
      onTap: () => onTapRef.current?.(),
      hidePrev: options.hidePrev,
    });
    return () => unregisterStep(options.key);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options.enabled]);

  return ref;
}
