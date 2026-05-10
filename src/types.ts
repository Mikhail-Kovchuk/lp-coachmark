import type { RefObject } from 'react';
import type { ScrollView, View } from 'react-native';

export interface CoachmarkStep {
  /** ref to the View to highlight */
  targetRef: RefObject<View | null>;
  title: string;
  description: string;
  /** tab this step belongs to — used for filtering when start() is called */
  tabKey: string;
  /** 'rect' (default) | 'circle' */
  shape?: 'rect' | 'circle';
  /** padding around the highlighted element, default 8 */
  padding?: number;
  /** ref to the ScrollView containing targetRef — for auto-scroll */
  scrollRef?: RefObject<ScrollView | null>;
  /** scroll offset relative to the element (default: center of screen) */
  scrollOffset?: number;
  /** clip spotlight to screen bounds on the X axis (for elements wider than the screen) */
  clampToScreen?: boolean;
  /**
   * "Do it yourself" mode: overlay shows mask + pulsing hand instead of tooltip.
   * Transparent Pressable on the spotlight zone intercepts the tap and calls onTap.
   * Transition to the next step is done via resumeAfterTap() from context.
   */
  tapHint?: boolean;
  /** Called when the user taps the spotlight zone in tapHint mode */
  onTap?: () => void;
  /** Hide the "Back" button on this step */
  hidePrev?: boolean;
}

export interface CoachmarkMeasure {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CoachmarkStorage {
  get: (key: string) => Promise<string | null>;
  set: (key: string, value: string) => Promise<void>;
}

export interface CoachmarkContextValue {
  registerStep: (key: string, step: CoachmarkStep) => void;
  unregisterStep: (key: string) => void;
  /** start the tour for a specific tab; onFinish — after "Done" or "Skip" */
  start: (tabKey: string, fromIndex?: number, onFinish?: () => void) => void;
  /**
   * Call after the user performs the action on a step with tapHint:true —
   * overlay returns and shows the next step.
   * Safe to call at any time — ignored if the tour is inactive or the step is not tapHint.
   */
  resumeAfterTap: () => void;
  /**
   * Register a one-shot callback called immediately after the tour finishes.
   * Used to open a modal or perform an action after the overlay has closed.
   */
  afterFinish: (cb: () => void) => void;
  isActive: boolean;
  /** Settings from Provider — used by useTabCoachmark */
  _config: {
    enabled: boolean;
    alwaysShow: boolean;
    storage: CoachmarkStorage | null;
  };
}
