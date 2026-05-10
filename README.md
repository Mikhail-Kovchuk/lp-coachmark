<div align="center">
  <img src="https://raw.githubusercontent.com/Mikhail-Kovchuk/lp-coachmark/main/assets/logo-300x300.png" alt="lp-coachmark" width="120" />
  <h1>lp-coachmark</h1>
  <p>Portable guided tour (coachmark) system for React Native / Expo Router apps.</p>
  <p>
    <a href="https://www.npmjs.com/package/lp-coachmark"><img src="https://img.shields.io/npm/v/lp-coachmark?color=7c3aed&style=flat-square" alt="npm version" /></a>
    <a href="https://www.npmjs.com/package/lp-coachmark"><img src="https://img.shields.io/npm/dm/lp-coachmark?color=7c3aed&style=flat-square" alt="npm downloads" /></a>
    <img src="https://img.shields.io/badge/React%20Native-%E2%89%A50.73-blue?style=flat-square" alt="React Native" />
    <a href="./LICENSE"><img src="https://img.shields.io/badge/license-MIT-green?style=flat-square" alt="License" /></a>
  </p>
  <p>📖 <a href="https://mikhail-kovchuk.github.io/lp-coachmark/"><strong>Full documentation →</strong></a></p>
</div>

---

Highlights a UI element with a spotlight cutout, shows a tooltip with title and description, and guides the user step-by-step through any screen tab.

## Preview

<div align="center">
  <table>
    <tr>
      <td align="center"><img src="https://raw.githubusercontent.com/Mikhail-Kovchuk/lp-coachmark/main/assets/ex1.png" width="220" alt="Theme step" /></td>
      <td align="center"><img src="https://raw.githubusercontent.com/Mikhail-Kovchuk/lp-coachmark/main/assets/ex2.png" width="220" alt="Calendar legend step" /></td>
      <td align="center"><img src="https://raw.githubusercontent.com/Mikhail-Kovchuk/lp-coachmark/main/assets/ex3.png" width="220" alt="Circle spotlight" /></td>
    </tr>
    <tr>
      <td align="center"><sub>Tooltip on any UI element</sub></td>
      <td align="center"><sub>Multi-step tour with progress</sub></td>
      <td align="center"><sub>Circle spotlight + tapHint mode</sub></td>
    </tr>
  </table>
</div>

---

## Features

- Spotlight cutout — `rect` or `circle` shape with configurable padding
- Auto-scroll to the target element inside a `ScrollView`
- `tapHint` mode — overlay shows a pulsing hand icon instead of a tooltip; the next step is triggered by `resumeAfterTap()`
- Per-tab tours with automatic "already shown" persistence via a pluggable storage adapter
- `alwaysShow` flag for development
- Animated transitions between steps (fade / scale)
- Zero native modules — pure React Native

---

## Installation

```bash
# npm
npm install lp-coachmark

# yarn
yarn add lp-coachmark
```

### Peer dependencies

| Package | Version |
|---|---|
| `react` | ≥ 18.0.0 |
| `react-native` | ≥ 0.73.0 |
| `expo-router` | ≥ 3.0.0 |

---

## Quick start

### 1. Wrap your app with `CoachmarkProvider`

```tsx
// app/_layout.tsx
import { CoachmarkProvider } from 'lp-coachmark';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function RootLayout() {
  return (
    <CoachmarkProvider
      tabBarHeight={84}
      storage={{
        get: AsyncStorage.getItem,
        set: AsyncStorage.setItem,
      }}
    >
      {/* ... */}
    </CoachmarkProvider>
  );
}
```

### 2. Register steps inside a screen

```tsx
// app/(tabs)/home.tsx
import { useRef } from 'react';
import { View, Text } from 'react-native';
import { useCoachmarkStep, useTabCoachmark } from 'lp-coachmark';

export default function HomeScreen() {
  // Start the tour automatically when the tab gains focus
  useTabCoachmark('home');

  const buttonRef = useCoachmarkStep({
    key: 'home-button',
    tabKey: 'home',
    title: 'Create something new',
    description: 'Tap this button to create your first item.',
  });

  return (
    <View>
      <View ref={buttonRef}>
        <Text>+ New</Text>
      </View>
    </View>
  );
}
```

### 3. Trigger the tour manually (optional)

```tsx
import { useCoachmark } from 'lp-coachmark';

const { start } = useCoachmark();

// start tour for "home" tab from step 0
start('home', 0, () => console.log('tour finished'));
```

---

## How it works

1. Each component that should be highlighted calls `useCoachmarkStep()`, which returns a `ref` to attach to a `View`. The hook registers the step in the global context.
2. `useTabCoachmark(tabKey)` listens to `useFocusEffect` — when the tab is focused it checks storage, and if the tour was not yet shown, calls `start(tabKey)` after a short delay.
3. `CoachmarkOverlay` renders a `Modal` on top of everything. It measures the target `View` with `measureInWindow`, draws the spotlight mask around it, and shows a tooltip.
4. The user taps **Next / Back / Skip** to navigate or dismiss. On the last step "Done" calls `onFinish`, which saves the "done" flag to storage.

---

## API overview

| Export | Type | Description |
|---|---|---|
| `CoachmarkProvider` | Component | Root context provider |
| `useCoachmark` | Hook | Access context (start, resumeAfterTap, etc.) |
| `useCoachmarkStep` | Hook | Register a single step and get a `ref` |
| `useTabCoachmark` | Hook | Auto-start tour on tab focus |

See the **[full documentation](https://mikhail-kovchuk.github.io/lp-coachmark/)** for the complete prop / option reference and real-world usage patterns.

---

## License

[MIT](./LICENSE)
