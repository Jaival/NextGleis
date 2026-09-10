import { useState, type ReactNode } from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { css, useReducedMotion } from 'react-native-reanimated';
import { tap, type HapticKind } from '@/lib/haptics';
import { PRESS_SCALE, curve, duration } from '@/lib/motion';

// The app's single press affordance. Touch has no hover, so the only moment to
// confirm a tap registered is press-in — and it has to be immediate, which is
// why this is a CSS transition (UI thread, no shared value, no re-render per
// frame) rather than a gesture.
//
// `setState` is fine here: it runs twice per press, not once per frame.
export const press = css.create({
  base: {
    transform: [{ scale: 1 }],
    transitionProperty: 'transform',
    transitionDuration: duration.press,
    transitionTimingFunction: curve.out,
  },
  down: { transform: [{ scale: PRESS_SCALE }] },
});

type Props = Omit<PressableProps, 'style' | 'children'> & {
  /** Applied to the scaling view, so padding and background scale with it. */
  style?: StyleProp<ViewStyle>;
  /** Fires on commit, in the same frame as the state change it confirms. */
  haptic?: HapticKind;
  children: ReactNode;
};

export function PressableScale({ style, haptic, children, onPress, ...rest }: Props) {
  const [pressed, setPressed] = useState(false);
  const reduced = useReducedMotion();

  return (
    <Pressable
      onPress={(event) => {
        if (haptic) tap[haptic]();
        onPress?.(event);
      }}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      // A finger that drifts a few pixels still meant to press.
      pressRetentionOffset={16}
      {...rest}
    >
      <Animated.View style={[style, !reduced && press.base, pressed && !reduced && press.down]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}
