import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withRepeat,
	withSequence,
	withTiming,
} from 'react-native-reanimated';
import { AccessibilityInfo } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

export function PulseDot() {
	const theme = useTheme();
	const scale = useSharedValue(1);
	const haloOpacity = useSharedValue(0.55);
	const reducedMotion = useRef(false);

	useEffect(() => {
		AccessibilityInfo.isReduceMotionEnabled().then((v) => {
			reducedMotion.current = v;
			if (!v) startPulse();
		});
	}, []);

	function startPulse() {
		scale.value = withRepeat(
			withSequence(
				withTiming(1, { duration: 0 }),
				withTiming(2.8, { duration: 2100 })
			),
			-1,
			false
		);
		haloOpacity.value = withRepeat(
			withSequence(
				withTiming(0.55, { duration: 0 }),
				withTiming(0, { duration: 2100 })
			),
			-1,
			false
		);
	}

	const haloStyle = useAnimatedStyle(() => ({
		transform: [{ scale: scale.value }],
		opacity: haloOpacity.value,
	}));

	return (
		<View style={styles.wrap}>
			<Animated.View
				style={[styles.halo, { backgroundColor: theme.accent }, haloStyle]}
			/>
			<View style={[styles.core, { backgroundColor: theme.accent }]} />
		</View>
	);
}

const styles = StyleSheet.create({
	wrap: {
		width: 11,
		height: 11,
		alignItems: 'center',
		justifyContent: 'center',
	},
	halo: {
		position: 'absolute',
		width: 11,
		height: 11,
		borderRadius: 999,
	},
	core: {
		width: 8,
		height: 8,
		borderRadius: 999,
	},
});
