import type { RefObject } from 'react';
import type { ScrollView, View } from 'react-native';

export interface CoachmarkStep {
  /** ref до View який треба підсвітити */
  targetRef: RefObject<View | null>;
  title: string;
  description: string;
  /** до якої вкладки належить крок — використовується для фільтрації при start() */
  tabKey: string;
  /** 'rect' (default) | 'circle' */
  shape?: 'rect' | 'circle';
  /** відступ навколо виділеного елементу, default 8 */
  padding?: number;
  /** ref до ScrollView який містить targetRef — для автоскролу */
  scrollRef?: RefObject<ScrollView | null>;
  /** зміщення скролу відносно елементу (default: центр екрана) */
  scrollOffset?: number;
  /** обрізати spotlight до меж екрану по осі X (для елементів що ширші за екран) */
  clampToScreen?: boolean;
  /**
   * Режим "зроби сам": overlay показує маску + мигаючу руку замість tooltip.
   * Прозорий Pressable на spotlight-зоні перехоплює тап і викликає onTap.
   * Перехід до наступного кроку — через resumeAfterTap() з контексту.
   */
  tapHint?: boolean;
  /** Викликається коли юзер натискає на spotlight-зону в режимі tapHint */
  onTap?: () => void;
  /** Сховати кнопку "Назад" на цьому кроці */
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
  /** запустити тур для конкретної вкладки; onFinish — після "Готово" або "Пропустити" */
  start: (tabKey: string, fromIndex?: number, onFinish?: () => void) => void;
  /**
   * Викликати після того як юзер виконав дію на кроці з tapHint:true —
   * overlay повертається і показує наступний крок.
   * Безпечно викликати завжди — ігнорує якщо тур неактивний або крок не tapHint.
   */
  resumeAfterTap: () => void;
  /**
   * Зареєструвати one-shot callback який викликається одразу після завершення туру.
   * Використовується щоб відкрити модал/виконати дію після того як overlay зник.
   */
  afterFinish: (cb: () => void) => void;
  isActive: boolean;
  /** Налаштування з Provider — для useTabCoachmark */
  _config: {
    enabled: boolean;
    alwaysShow: boolean;
    storage: CoachmarkStorage | null;
  };
}
