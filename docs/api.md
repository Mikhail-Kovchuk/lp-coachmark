# API Reference

## `CoachmarkProvider`

Wrap your root layout with this component. It provides the context that all hooks depend on.

```tsx
import { CoachmarkProvider } from 'lp-coachmark';

<CoachmarkProvider
  tabBarHeight={84}
  enabled={true}
  alwaysShow={false}
  storage={{ get, set }}
>
  {children}
</CoachmarkProvider>
```

### Props

| Prop | Type | Required | Default | Description |
|---|---|:---:|---|---|
| `children` | `ReactNode` | ✅ | — | App content |
| `tabBarHeight` | `number` | | `0` | Height of the tab bar including safe-area inset. Used to block taps on the tab bar while the overlay is active. |
| `enabled` | `boolean` | | `true` | Master switch. Set to `false` to disable all tours globally. |
| `alwaysShow` | `boolean` | | `false` | Ignore stored "already shown" state. Useful during development. |
| `storage` | `CoachmarkStorage` | | `undefined` | Adapter for persisting tour completion. If omitted, tours will re-run on every app launch. |

### `CoachmarkStorage` interface

```ts
interface CoachmarkStorage {
  get: (key: string) => Promise<string | null>;
  set: (key: string, value: string) => Promise<void>;
}
```

Both methods follow the same signature as `AsyncStorage.getItem` / `AsyncStorage.setItem` so you can pass the methods directly.

---

## `useCoachmarkStep(options)`

Registers a single coachmark step and returns a `ref` to attach to the target `View`.

```tsx
const ref = useCoachmarkStep({
  key: 'home-button',
  tabKey: 'home',
  title: 'Add item',
  description: 'Tap to create a new item.',
});

return <View ref={ref}>...</View>;
```

### Options

| Option | Type | Required | Default | Description |
|---|---|:---:|---|---|
| `key` | `string` | ✅ | — | Unique identifier for this step. Also determines the display order — steps are shown in registration order. |
| `tabKey` | `string` | ✅ | — | The tab this step belongs to. Must match the value passed to `useTabCoachmark` and `start()`. |
| `title` | `string` | ✅ | — | Heading text shown in the tooltip. |
| `description` | `string` | ✅ | — | Body text shown in the tooltip. |
| `shape` | `'rect' \| 'circle'` | | `'rect'` | Shape of the spotlight cutout. Use `'circle'` for icon buttons or avatar-like elements. |
| `padding` | `number` | | `8` | Extra space (px) around the target element inside the spotlight. |
| `scrollRef` | `RefObject<ScrollView>` | | — | Ref of the `ScrollView` that contains this element. When provided, the overlay will auto-scroll to make the element fully visible before showing the tooltip. |
| `scrollOffset` | `number` | | center of screen | Custom scroll offset relative to the element. By default the element is centered on screen. |
| `clampToScreen` | `boolean` | | `false` | Clamp the spotlight to screen boundaries on the X axis. Use when the target element is wider than the screen. |
| `tapHint` | `boolean` | | `false` | Enables "do it yourself" mode: the overlay shows the spotlight mask and a pulsing hand icon instead of a tooltip. The user must tap the highlighted element to proceed. Call `resumeAfterTap()` from within `onTap` to advance to the next step. |
| `onTap` | `() => void` | | — | Called when the user taps the spotlight zone in `tapHint` mode. Perform the action here and then call `resumeAfterTap()`. |
| `hidePrev` | `boolean` | | `false` | Hide the "Back" button on this step. Useful for the first step or steps that follow a `tapHint` step. |
| `enabled` | `boolean` | | `true` | When `false`, the step is not registered. Use this to conditionally include steps based on feature flags or permissions. |

---

## `useTabCoachmark(tabKey)`

Automatically starts the tour when the screen tab gains focus for the first time. Checks storage to ensure the tour runs only once per user.

```tsx
useTabCoachmark('home');
```

### Parameters

| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `tabKey` | `string` | ✅ | The tab identifier. Must match the `tabKey` used in `useCoachmarkStep` calls on this screen. |

**Timing:**
- First visit — 100 ms delay (screen is already rendered)
- Subsequent visits within the same session — 1 200 ms delay (gives time for navigation animation to complete)

---

## `useCoachmark()`

Returns the full context value. Use this when you need to start a tour manually or call `resumeAfterTap`.

```tsx
const { start, resumeAfterTap, afterFinish, isActive } = useCoachmark();
```

### Returned values

| Value | Type | Description |
|---|---|---|
| `start` | `(tabKey: string, fromIndex?: number, onFinish?: () => void) => void` | Start the tour for the given tab. `fromIndex` defaults to `0`. `onFinish` is called when the user completes or skips the tour — use this to persist the "done" state. |
| `resumeAfterTap` | `() => void` | Call after the user performs the action in a `tapHint` step. The overlay returns and advances to the next step. Safe to call at any time — ignored if no tour is active or the current step is not `tapHint`. |
| `afterFinish` | `(cb: () => void) => void` | Register a one-shot callback that fires immediately after the overlay disappears. Use this to open a modal or trigger an action after the tour ends. |
| `isActive` | `boolean` | `true` while a tour is in progress. |
| `registerStep` | `(key: string, step: CoachmarkStep) => void` | Low-level: register a step manually. Prefer `useCoachmarkStep`. |
| `unregisterStep` | `(key: string) => void` | Low-level: unregister a step. Called automatically by `useCoachmarkStep` on unmount. |

---

## Types

### `CoachmarkStep`

The full shape of a registered step as stored in the context.

```ts
interface CoachmarkStep {
  targetRef: RefObject<View | null>;
  title: string;
  description: string;
  tabKey: string;
  shape?: 'rect' | 'circle';
  padding?: number;
  scrollRef?: RefObject<ScrollView | null>;
  scrollOffset?: number;
  clampToScreen?: boolean;
  tapHint?: boolean;
  onTap?: () => void;
  hidePrev?: boolean;
}
```

### `CoachmarkMeasure`

Position and size of the measured target element, in window-relative coordinates.

```ts
interface CoachmarkMeasure {
  x: number;
  y: number;
  width: number;
  height: number;
}
```
