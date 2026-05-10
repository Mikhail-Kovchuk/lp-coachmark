# Getting started

## Introduction

`lp-coachmark` is a guided tour system for React Native / Expo Router.  
It highlights any `View` on screen with a spotlight cutout, shows a tooltip with a title and description, and walks the user through a sequence of steps.

```tsx
import { CoachmarkProvider, useCoachmarkStep, useTabCoachmark } from 'lp-coachmark';
```

---

## Installation

```bash
npm install lp-coachmark
# or
yarn add lp-coachmark
```

### Peer dependencies

The package requires the following packages to already be installed in your project:

| Package | Minimum version |
|---|---|
| `react` | 18.0.0 |
| `react-native` | 0.73.0 |
| `expo-router` | 3.0.0 |

---

## Step 1 — Add the Provider

Wrap your root layout with `CoachmarkProvider`. This must be an ancestor of every screen that uses coachmarks.

```tsx
// app/_layout.tsx
import { Stack } from 'expo-router';
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
      <Stack />
    </CoachmarkProvider>
  );
}
```

> **Note:** `tabBarHeight` should be the total height of your tab bar including the safe-area bottom inset. This prevents the user from tapping the tab bar while the overlay is active.

---

## Step 2 — Register steps

Inside any screen component call `useCoachmarkStep()` for each UI element you want to highlight. The hook returns a `ref` — attach it to the `View` you want spotlighted.

```tsx
// app/(tabs)/home.tsx
import { View, Text, TouchableOpacity } from 'react-native';
import { useCoachmarkStep, useTabCoachmark } from 'lp-coachmark';

export default function HomeScreen() {
  useTabCoachmark('home'); // auto-starts the tour when this tab is focused

  const addButtonRef = useCoachmarkStep({
    key: 'home-add-btn',     // unique key — also determines step order
    tabKey: 'home',          // must match the key passed to useTabCoachmark
    title: 'Create an item',
    description: 'Tap this button to add your first item to the list.',
  });

  const filterRef = useCoachmarkStep({
    key: 'home-filter',
    tabKey: 'home',
    title: 'Filter results',
    description: 'Use the filter to narrow down what you see.',
    shape: 'circle',         // circular spotlight
    padding: 12,
  });

  return (
    <View>
      <TouchableOpacity ref={addButtonRef}>
        <Text>+ New</Text>
      </TouchableOpacity>

      <TouchableOpacity ref={filterRef}>
        <Text>Filter</Text>
      </TouchableOpacity>
    </View>
  );
}
```

Steps are shown in the order the `key` values were registered (i.e., the order the hooks ran in the component).

---

## Step 3 — Auto-start with `useTabCoachmark`

Call `useTabCoachmark(tabKey)` once per screen. It listens for the tab to gain focus and automatically starts the tour the first time the user visits, then marks it as done in storage so it never shows again.

```tsx
useTabCoachmark('home');
```

During development, pass `alwaysShow` to the provider to bypass the "already shown" check:

```tsx
<CoachmarkProvider alwaysShow={true} ...>
```

---

## Step 4 — Manual trigger (optional)

You can also start the tour from a button, menu item, or any other event:

```tsx
import { useCoachmark } from 'lp-coachmark';

function HelpButton() {
  const { start } = useCoachmark();

  return (
    <TouchableOpacity onPress={() => start('home', 0)}>
      <Text>Show tour</Text>
    </TouchableOpacity>
  );
}
```

---

## Storage adapters

The `storage` prop accepts any object with `get` and `set` methods. This makes the library compatible with any persistence layer.

### AsyncStorage

```tsx
import AsyncStorage from '@react-native-async-storage/async-storage';

<CoachmarkProvider
  storage={{
    get: AsyncStorage.getItem,
    set: AsyncStorage.setItem,
  }}
>
```

### expo-sqlite (custom functions)

```tsx
<CoachmarkProvider
  storage={{
    get: (key) => getSetting(db, key),
    set: (key, value) => saveSetting(db, key, value),
  }}
>
```

If `storage` is not provided, the library will not persist tour completion — the tour will run on every app start.
