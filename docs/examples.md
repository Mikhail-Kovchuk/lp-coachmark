# Examples

## Basic step on a screen

The simplest possible coachmark: one highlighted button, auto-started when the tab gains focus.

```tsx
// app/(tabs)/home.tsx
import { View, TouchableOpacity, Text } from 'react-native';
import { useCoachmarkStep, useTabCoachmark } from 'lp-coachmark';

export default function HomeScreen() {
  useTabCoachmark('home');

  const addRef = useCoachmarkStep({
    key: 'home-add',
    tabKey: 'home',
    title: 'Create your first item',
    description: 'Tap the button below to get started.',
  });

  return (
    <View style={{ flex: 1 }}>
      <TouchableOpacity ref={addRef} style={styles.button}>
        <Text>+ Add</Text>
      </TouchableOpacity>
    </View>
  );
}
```

---

## Multiple steps in order

Steps are displayed in the order the hooks run in the component — top to bottom.

```tsx
export default function DashboardScreen() {
  useTabCoachmark('dashboard');

  const searchRef = useCoachmarkStep({
    key: 'dashboard-search',  // step 1
    tabKey: 'dashboard',
    title: 'Search',
    description: 'Find anything quickly using the search bar.',
  });

  const chartRef = useCoachmarkStep({
    key: 'dashboard-chart',   // step 2
    tabKey: 'dashboard',
    title: 'Your statistics',
    description: 'Here you can see your progress over time.',
    shape: 'rect',
    padding: 12,
  });

  const profileRef = useCoachmarkStep({
    key: 'dashboard-profile', // step 3
    tabKey: 'dashboard',
    title: 'Profile settings',
    description: 'Tap your avatar to open account settings.',
    shape: 'circle',
  });

  return (
    <View>
      <View ref={searchRef}><SearchBar /></View>
      <View ref={chartRef}><Chart /></View>
      <View ref={profileRef}><Avatar /></View>
    </View>
  );
}
```

---

## Circular spotlight

Use `shape: 'circle'` for round buttons, icons, or avatar-like elements.

```tsx
const micRef = useCoachmarkStep({
  key: 'record-mic',
  tabKey: 'record',
  title: 'Record audio',
  description: 'Hold this button to start recording.',
  shape: 'circle',
  padding: 16,
});

return <TouchableOpacity ref={micRef}><MicIcon /></TouchableOpacity>;
```

---

## Auto-scroll to a step

If your target element is inside a `ScrollView` and might be off-screen, pass `scrollRef` so the overlay scrolls to it automatically.

```tsx
export default function ListScreen() {
  useTabCoachmark('list');
  const scrollRef = useRef<ScrollView>(null);

  const lastItemRef = useCoachmarkStep({
    key: 'list-last-item',
    tabKey: 'list',
    title: 'Swipe to delete',
    description: 'Swipe any row to the left to reveal delete.',
    scrollRef,          // overlay will scroll this ScrollView
    scrollOffset: 40,   // extra offset in px (optional)
  });

  return (
    <ScrollView ref={scrollRef}>
      {items.map((item) => <Row key={item.id} />)}
      <View ref={lastItemRef}>
        <LastRow />
      </View>
    </ScrollView>
  );
}
```

---

## `tapHint` — "do it yourself" step

In `tapHint` mode the tooltip is hidden and a pulsing hand icon appears over the spotlight. The user must physically tap the highlighted element. You call `resumeAfterTap()` inside `onTap` to advance the tour.

```tsx
import { useCoachmark, useCoachmarkStep, useTabCoachmark } from 'lp-coachmark';

export default function OnboardingScreen() {
  useTabCoachmark('onboarding');
  const { resumeAfterTap } = useCoachmark();

  const swipeCardRef = useCoachmarkStep({
    key: 'onboarding-swipe',
    tabKey: 'onboarding',
    title: '',          // title and description are not shown in tapHint mode
    description: '',
    tapHint: true,
    onTap: () => {
      performSwipeAnimation(); // do the actual action
      resumeAfterTap();        // advance the tour to the next step
    },
  });

  const nextStepRef = useCoachmarkStep({
    key: 'onboarding-done',
    tabKey: 'onboarding',
    title: 'Great!',
    description: 'You just learned how to swipe a card.',
    hidePrev: true,    // hide "Back" — user can't undo the swipe
  });

  return (
    <View>
      <View ref={swipeCardRef}><Card /></View>
      <View ref={nextStepRef}><ResultView /></View>
    </View>
  );
}
```

---

## Conditional step

Use the `enabled` option to conditionally include a step based on feature flags, user role, or permissions.

```tsx
const { isPremium } = useUser();

const premiumRef = useCoachmarkStep({
  key: 'home-premium-badge',
  tabKey: 'home',
  title: 'Upgrade to Premium',
  description: 'Unlock all features with a Premium subscription.',
  enabled: !isPremium, // only show the step to free-tier users
});
```

---

## Manual trigger

Start the tour from any interaction — a help button, a menu item, a settings toggle.

```tsx
import { useCoachmark } from 'lp-coachmark';

function HelpMenu() {
  const { start } = useCoachmark();

  return (
    <TouchableOpacity onPress={() => start('home', 0)}>
      <Text>Replay tour</Text>
    </TouchableOpacity>
  );
}
```

---

## Action after the tour ends

Use `afterFinish` to open a modal, navigate, or run any side-effect right after the overlay disappears.

```tsx
import { useCoachmark } from 'lp-coachmark';

function HomeScreen() {
  const { afterFinish } = useCoachmark();

  useEffect(() => {
    afterFinish(() => {
      router.push('/create'); // open the create screen once the tour is done
    });
  }, []);

  // ...
}
```

> `afterFinish` registers a **one-shot** callback — it fires once and is then cleared automatically.

---

## Wide element with `clampToScreen`

If a target element extends beyond the screen edge (e.g., a horizontally scrollable card), use `clampToScreen` to keep the spotlight inside the visible area.

```tsx
const bannerRef = useCoachmarkStep({
  key: 'home-banner',
  tabKey: 'home',
  title: 'Scroll to explore',
  description: 'Swipe this banner left and right to see all offers.',
  clampToScreen: true,
});
```

---

## Complete screen example

```tsx
// app/(tabs)/profile.tsx
import { useRef } from 'react';
import { ScrollView, View, TouchableOpacity, Text } from 'react-native';
import { useCoachmarkStep, useTabCoachmark } from 'lp-coachmark';

export default function ProfileScreen() {
  useTabCoachmark('profile');

  const scrollRef = useRef<ScrollView>(null);

  const avatarRef = useCoachmarkStep({
    key: 'profile-avatar',
    tabKey: 'profile',
    title: 'Your avatar',
    description: 'Tap to change your profile photo.',
    shape: 'circle',
    padding: 10,
  });

  const editRef = useCoachmarkStep({
    key: 'profile-edit',
    tabKey: 'profile',
    title: 'Edit profile',
    description: 'Update your name, bio, and contact info here.',
  });

  const logoutRef = useCoachmarkStep({
    key: 'profile-logout',
    tabKey: 'profile',
    title: 'Sign out',
    description: 'Tap here when you want to log out of your account.',
    scrollRef,
    hidePrev: false,
  });

  return (
    <ScrollView ref={scrollRef}>
      <TouchableOpacity ref={avatarRef}>
        <Avatar />
      </TouchableOpacity>

      <TouchableOpacity ref={editRef}>
        <Text>Edit profile</Text>
      </TouchableOpacity>

      <TouchableOpacity ref={logoutRef}>
        <Text>Sign out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
```
