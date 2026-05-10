import {
  useEffect,
  useRef,
  useState,
  useCallback,
} from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type { CoachmarkMeasure, CoachmarkStep } from './types';

const SCREEN = Dimensions.get('window');
const OVERLAY_COLOR = 'rgba(0,0,0,0.92)';
const TOOLTIP_MARGIN = 16;
const TOOLTIP_ARROW_SIZE = 10;
const SPOTLIGHT_BORDER_RADIUS = 14;
const SPOTLIGHT_PADDING_DEFAULT = 8;

// ── Animation durations — edit here ─────────────────────────────────────────
const TOOLTIP_IN_DURATION       = 1200; // ms — tooltip appear on step transitions
const TOOLTIP_IN_DURATION_FIRST = 100;  // ms — first tooltip appear (fast, no delay)
const TOOLTIP_OUT_DURATION      = 600;  // ms — tooltip fade out
const OVERLAY_IN_DURATION       = 800;  // ms — overlay appear on transitions
const OVERLAY_IN_DURATION_FIRST = 300;  // ms — overlay appear on first show
const OVERLAY_OUT_DURATION      = 600;  // ms — overlay + border fade out on transition

interface Props {
  step: CoachmarkStep;
  currentIndex: number;
  totalSteps: number;
  tabBarHeight: number;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function measureTarget(step: CoachmarkStep): Promise<CoachmarkMeasure> {
  return new Promise((resolve) => {
    const ref = step.targetRef?.current;
    if (!ref) {
      resolve({ x: 0, y: 0, width: 0, height: 0 });
      return;
    }
    (ref as any).measureInWindow(
      (x: number, y: number, width: number, height: number) => {
        resolve({ x, y, width, height });
      }
    );
  });
}

// ─── SpotlightMask ────────────────────────────────────────────────────────────

interface SpotlightMaskProps {
  measure: CoachmarkMeasure;
  padding: number;
  shape: 'rect' | 'circle';
  clampToScreen?: boolean;
}

/**
 * Dark overlay with a "cutout" rectangle.
 * Implementation: 4 dark pieces around the highlighted block + glow border.
 * Root has NO backgroundColor — it is transparent so the "hole" is visible.
 */
const SCREEN_CLAMP_MARGIN = 8; // minimum margin from screen edge when clampToScreen is true

function spotlightGeometry(
  measure: CoachmarkMeasure,
  padding: number,
  shape: 'rect' | 'circle',
  clampToScreen = false,
) {
  const { x, y, width, height } = measure;
  let hx = Math.max(0, x - padding);
  const hy = Math.max(0, y - padding);
  let hw = width + padding * 2;
  const hh = height + padding * 2;

  if (clampToScreen) {
    const maxRight = SCREEN.width - SCREEN_CLAMP_MARGIN;
    if (hx < SCREEN_CLAMP_MARGIN) hx = SCREEN_CLAMP_MARGIN;
    if (hx + hw > maxRight) hw = maxRight - hx;
  }

  const borderRadius = shape === 'circle' ? Math.max(hw, hh) / 2 : SPOTLIGHT_BORDER_RADIUS;
  return { hx, hy, hw, hh, borderRadius };
}

function SpotlightMask({ measure, padding, shape, clampToScreen }: SpotlightMaskProps) {
  const { hx, hy, hw, hh } = spotlightGeometry(measure, padding, shape, clampToScreen);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={[styles.maskPiece, { top: 0, left: 0, right: 0, height: hy }]} />
      <View style={[styles.maskPiece, { top: hy + hh, left: 0, right: 0, bottom: 0 }]} />
      <View style={[styles.maskPiece, { top: hy, left: 0, width: hx, height: hh }]} />
      <View style={[styles.maskPiece, { top: hy, left: hx + hw, right: 0, height: hh }]} />
    </View>
  );
}

interface SpotlightTapZoneProps {
  measure: CoachmarkMeasure;
  padding: number;
  shape: 'rect' | 'circle';
  clampToScreen?: boolean;
  onPress: () => void;
}

function SpotlightTapZone({ measure, padding, shape, clampToScreen, onPress }: SpotlightTapZoneProps) {
  const { hx, hy, hw, hh, borderRadius } = spotlightGeometry(measure, padding, shape, clampToScreen);
  return (
    <Pressable
      style={{ position: 'absolute', top: hy, left: hx, width: hw, height: hh, borderRadius }}
      onPress={onPress}
    />
  );
}

function SpotlightGlow({ measure, padding, shape, clampToScreen }: SpotlightMaskProps) {
  const { hx, hy, hw, hh, borderRadius } = spotlightGeometry(measure, padding, shape, clampToScreen);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View
        style={{
          position: 'absolute',
          top: hy - 2,
          left: hx - 2,
          width: hw + 4,
          height: hh + 4,
          borderRadius: borderRadius + 2,
          borderWidth: 1.5,
          borderColor: 'rgba(255,255,255,0.85)',
        }}
      />
    </View>
  );
}

// ─── Tooltip ──────────────────────────────────────────────────────────────────

// ─── TapHand — pulsing hand over the spotlight ──────────────────────────────

interface TapHandProps {
  measure: CoachmarkMeasure;
  padding: number;
}

function TapHand({ measure, padding }: TapHandProps) {
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim   = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1, duration: 300, useNativeDriver: true,
    }).start();

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: -14, duration: 420,
          easing: Easing.out(Easing.quad), useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0, duration: 420,
          easing: Easing.in(Easing.quad), useNativeDriver: true,
        }),
        Animated.delay(150),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [bounceAnim, fadeAnim]);

  const SIZE_W = 56;
  const SIZE_H = 84;
  const centerX = measure.x + measure.width / 2 - SIZE_W / 2 + 32;
  const topY    = measure.y + measure.height + padding - 10;

  return (
    <Animated.View
      style={[
        styles.tapHandContainer,
        { opacity: fadeAnim, left: centerX, top: topY, transform: [{ translateY: bounceAnim }] },
      ]}
      pointerEvents="none"
    >
      <Image
        source={require('./handle-tap.png')}
        style={{ width: SIZE_W, height: SIZE_H }}
        resizeMode="contain"
      />
    </Animated.View>
  );
}

// ─── Tooltip ──────────────────────────────────────────────────────────────────

interface TooltipProps {
  step: CoachmarkStep;
  measure: CoachmarkMeasure;
  currentIndex: number;
  totalSteps: number;
  fadeAnim: Animated.Value;
  slideAnim: Animated.Value;
  scaleAnim: Animated.Value;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
}

function Tooltip({
  step,
  measure,
  currentIndex,
  totalSteps,
  fadeAnim,
  slideAnim,
  scaleAnim,
  onNext,
  onPrev,
  onSkip,
}: TooltipProps) {
  const padding = step.padding ?? SPOTLIGHT_PADDING_DEFAULT;
  const spotlightBottom = measure.y + measure.height + padding;
  const spotlightTop = measure.y - padding;

  const tooltipHeight = 180;
  const spaceBelow = SCREEN.height - spotlightBottom - TOOLTIP_MARGIN;
  const showBelow = spaceBelow >= tooltipHeight || spotlightTop < tooltipHeight + TOOLTIP_MARGIN;

  const tooltipTop = showBelow
    ? spotlightBottom + TOOLTIP_MARGIN
    : spotlightTop - tooltipHeight - TOOLTIP_MARGIN;

  const isLast = currentIndex === totalSteps - 1;

  return (
    <Animated.View
      style={[
        styles.tooltip,
        {
          top: tooltipTop,
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
        },
      ]}
    >
      {showBelow ? (
        <View style={styles.arrowUp} />
      ) : (
        <View style={styles.arrowDown} />
      )}

      <View style={styles.tooltipHeader}>
        <Text style={styles.tooltipTitle}>{step.title}</Text>
        <TouchableOpacity onPress={onSkip} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.tooltipDescription}>{step.description}</Text>

      <View style={styles.tooltipFooter}>
        <View style={styles.dotsRow}>
          {totalSteps > 1 && Array.from({ length: totalSteps }).map((_, i) => (
            <View key={i} style={[styles.dot, i === currentIndex && styles.dotActive]} />
          ))}
        </View>
        <View style={styles.navBtns}>
          {currentIndex > 0 && !step.hidePrev && (
            <TouchableOpacity style={styles.prevBtn} onPress={onPrev} activeOpacity={0.8}>
              <Text style={styles.prevBtnText}>Back</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.nextBtn} onPress={onNext} activeOpacity={0.8}>
            <Text style={styles.nextBtnText}>{isLast ? 'Done' : 'Next'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
}

// ─── CoachmarkOverlay ─────────────────────────────────────────────────────────

export default function CoachmarkOverlay({
  step,
  currentIndex,
  totalSteps,
  tabBarHeight,
  onNext,
  onPrev,
  onSkip,
}: Props) {
  const [prevIndex, setPrevIndex] = useState(currentIndex);
  const [displayed, setDisplayed] = useState<{ step: CoachmarkStep; measure: CoachmarkMeasure | null }>({
    step,
    measure: null,
  });
  const displayedStep = displayed.step;
  const measure = displayed.measure;

  const overlayFade = useRef(new Animated.Value(0)).current;
  const tooltipFade = useRef(new Animated.Value(0)).current;
  const tooltipSlide = useRef(new Animated.Value(10)).current;
  const tooltipScale = useRef(new Animated.Value(0.88)).current;
  const spotlightScale = useRef(new Animated.Value(1.06)).current;

  const animateIn = useCallback((isFirst = false) => {
    const tooltipDur = isFirst ? TOOLTIP_IN_DURATION_FIRST : TOOLTIP_IN_DURATION;
    const overlayDur = isFirst ? OVERLAY_IN_DURATION_FIRST : OVERLAY_IN_DURATION;

    tooltipFade.setValue(0);
    tooltipSlide.setValue(16);
    tooltipScale.setValue(0.86);
    spotlightScale.setValue(1.06);
    overlayFade.setValue(0);

    requestAnimationFrame(() => {
      Animated.parallel([
        Animated.timing(overlayFade, {
          toValue: 1,
          duration: overlayDur,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(tooltipFade, {
          toValue: 1,
          duration: tooltipDur,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(tooltipSlide, {
          toValue: 0,
          duration: tooltipDur,
          easing: Easing.out(Easing.back(1.4)),
          useNativeDriver: true,
        }),
        Animated.timing(tooltipScale, {
          toValue: 1,
          duration: tooltipDur,
          easing: Easing.out(Easing.back(1.4)),
          useNativeDriver: true,
        }),
        Animated.timing(spotlightScale, {
          toValue: 1,
          duration: tooltipDur,
          easing: Easing.out(Easing.back(1.2)),
          useNativeDriver: true,
        }),
      ]).start();
    });
  }, [overlayFade, tooltipFade, tooltipSlide, tooltipScale, spotlightScale]);

  const animateOut = useCallback((cb: () => void) => {
    Animated.parallel([
      Animated.timing(overlayFade, {
        toValue: 0,
        duration: OVERLAY_OUT_DURATION,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(tooltipFade, {
        toValue: 0,
        duration: TOOLTIP_OUT_DURATION,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(tooltipSlide, {
        toValue: -8,
        duration: TOOLTIP_OUT_DURATION,
        useNativeDriver: true,
      }),
      Animated.timing(tooltipScale, {
        toValue: 0.92,
        duration: TOOLTIP_OUT_DURATION,
        useNativeDriver: true,
      }),
    ]).start(cb);
  }, [overlayFade, tooltipFade, tooltipSlide, tooltipScale]);

  // Load coordinates + auto-scroll
  useEffect(() => {
    let cancelled = false;

    async function load() {
      const isTransition = currentIndex !== prevIndex;
      // First step: minimal delay; step transition: wait for render
      await new Promise<void>((r) => setTimeout(r, isTransition ? 80 : 16));
      if (cancelled) return;

      // 1. Hide current content if this is a step transition
      if (isTransition) {
        // Instantly clear content (hand/tooltip/spotlight) — dark overlay fades separately
        setDisplayed(prev => ({ ...prev, measure: null }));
        await new Promise<void>((r) => animateOut(r));
        if (cancelled) return;
        setDisplayed({ step, measure: null });
      }

      // 2. Scroll to the new element
      const screenH = SCREEN.height;
      const visibleBottom = screenH - tabBarHeight;
      const m = await measureTarget(step);
      if (cancelled) return;

      if (step.scrollRef?.current) {
        const offset = step.scrollOffset ?? 0;
        const targetScrollY = Math.max(0, m.y - visibleBottom / 2 + m.height / 2 + offset);
        step.scrollRef.current.scrollTo({ y: targetScrollY, animated: true });

        await new Promise<void>((r) => setTimeout(r, 400));
        if (cancelled) return;
      }

      // 3. Final measure after scroll → show
      const finalM = await measureTarget(step);
      if (cancelled) return;

      setDisplayed({ step, measure: finalM });
      setPrevIndex(currentIndex);
      animateIn(!isTransition);
    }

    void load();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, currentIndex]);

  const handleSkip = useCallback(() => {
    Animated.timing(overlayFade, {
      toValue: 0,
      duration: 220,
      useNativeDriver: true,
    }).start(onSkip);
  }, [overlayFade, onSkip]);

  const padding = displayedStep.padding ?? SPOTLIGHT_PADDING_DEFAULT;
  const shape = displayedStep.shape ?? 'rect';
  const clampToScreen = displayedStep.clampToScreen ?? false;

  return (
    <Modal
      visible
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleSkip}
    >
      {/* Dark overlay — transparent background, mask draws dark pieces */}
      <Animated.View
        style={[styles.root, { opacity: overlayFade }]}
        pointerEvents="box-none"
      >
        {/* Blocks all taps — not rendered in tapHint mode so SpotlightTapZone receives events */}
        {!displayedStep.tapHint && <Pressable style={StyleSheet.absoluteFill} onPress={() => {}} />}
        {/* Blocks taps on tab bar (Modal does not cover it on some platforms) */}
        <View
          style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: tabBarHeight }}
          pointerEvents="box-only"
        />

        {measure && (
          <>
            <Animated.View
              style={[StyleSheet.absoluteFill, { transform: [{ scale: spotlightScale }] }]}
              pointerEvents="none"
            >
              <SpotlightMask measure={measure} padding={displayedStep.padding ?? SPOTLIGHT_PADDING_DEFAULT} shape={displayedStep.shape ?? 'rect'} clampToScreen={displayedStep.clampToScreen ?? false} />
            </Animated.View>
            <Animated.View
              style={[StyleSheet.absoluteFill, { transform: [{ scale: spotlightScale }] }]}
              pointerEvents="none"
            >
              <SpotlightGlow measure={measure} padding={displayedStep.padding ?? SPOTLIGHT_PADDING_DEFAULT} shape={displayedStep.shape ?? 'rect'} clampToScreen={displayedStep.clampToScreen ?? false} />
            </Animated.View>
          </>
        )}

        {/* tapHint: transparent Pressable on spotlight + pulsing hand */}
        {measure && displayedStep.tapHint && (
          <>
            <SpotlightTapZone
              measure={measure}
              padding={displayedStep.padding ?? SPOTLIGHT_PADDING_DEFAULT}
              shape={displayedStep.shape ?? 'rect'}
              clampToScreen={displayedStep.clampToScreen ?? false}
              onPress={() => displayedStep.onTap?.()}
            />
            <TapHand measure={measure} padding={displayedStep.padding ?? SPOTLIGHT_PADDING_DEFAULT} />
          </>
        )}

        {/* Regular step — tooltip */}
        {measure && !displayedStep.tapHint && (
          <Tooltip
            step={displayedStep}
            measure={measure}
            currentIndex={currentIndex}
            totalSteps={totalSteps}
            fadeAnim={tooltipFade}
            slideAnim={tooltipSlide}
            scaleAnim={tooltipScale}
            onNext={onNext}
            onPrev={onPrev}
            onSkip={handleSkip}
          />
        )}
      </Animated.View>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    // No backgroundColor — so the spotlight "hole" is visible through the transparent background
    zIndex: 9999,
  },
  maskPiece: {
    position: 'absolute',
    backgroundColor: OVERLAY_COLOR,
  },
  tooltip: {
    position: 'absolute',
    left: TOOLTIP_MARGIN,
    right: TOOLTIP_MARGIN,
    backgroundColor: '#1C1C2E',
    borderRadius: 20,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.45,
        shadowRadius: 20,
      },
      android: { elevation: 16 },
    }),
  },
  arrowUp: {
    position: 'absolute',
    top: -TOOLTIP_ARROW_SIZE,
    alignSelf: 'center',
    width: 0,
    height: 0,
    borderLeftWidth: TOOLTIP_ARROW_SIZE,
    borderRightWidth: TOOLTIP_ARROW_SIZE,
    borderBottomWidth: TOOLTIP_ARROW_SIZE,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#1C1C2E',
  },
  arrowDown: {
    position: 'absolute',
    bottom: -TOOLTIP_ARROW_SIZE,
    alignSelf: 'center',
    width: 0,
    height: 0,
    borderLeftWidth: TOOLTIP_ARROW_SIZE,
    borderRightWidth: TOOLTIP_ARROW_SIZE,
    borderTopWidth: TOOLTIP_ARROW_SIZE,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#1C1C2E',
  },
  tooltipHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  tooltipTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
    marginRight: 12,
    lineHeight: 23,
  },
  skipText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.45)',
    fontWeight: '500',
    paddingTop: 2,
  },
  tooltipDescription: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.72)',
    lineHeight: 21,
    marginBottom: 20,
  },
  tooltipFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  dotActive: {
    width: 20,
    backgroundColor: '#A78BFA',
  },
  navBtns: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  prevBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  prevBtnText: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 14,
    fontWeight: '600',
  },
  nextBtn: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 50,
  },
  tapHandContainer: {
    position: 'absolute',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 8,
  },
  nextBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
