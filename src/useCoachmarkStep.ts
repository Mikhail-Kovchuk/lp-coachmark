import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';
import { View, ScrollView } from 'react-native';
import { useCoachmark } from './CoachmarkContext';
import type { CoachmarkStep } from './types';

interface Options {
  /** unique key, determines registration order */
  key: string;
  /** tab this step belongs to — must match tabKey in useTabCoachmark */
  tabKey: string;
  title: string;
  description: string;
  shape?: CoachmarkStep['shape'];
  padding?: number;
  /** ref to the ScrollView containing this element — for auto-scroll */
  scrollRef?: RefObject<ScrollView | null>;
  /** scroll offset (default: center of screen) */
  scrollOffset?: number;
  /** clip spotlight to screen bounds on the X axis */
  clampToScreen?: boolean;
  /** overlay shows mask + hand; tap on spotlight calls onTap; transition via resumeAfterTap() */
  tapHint?: boolean;
  /** called when the spotlight zone is tapped */
  onTap?: () => void;
  /** hide the "Back" button on this step */
  hidePrev?: boolean;
  /** step is registered only if true (default: true) */
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
