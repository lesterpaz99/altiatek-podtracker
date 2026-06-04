import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
	light: {
		text: '#000000',
		textSecondary: '#6C6C70',
		background: '#F2F2F7',
		backgroundElement: '#FFFFFF',
		backgroundSelected: '#E5E5EA',
		accent: '#4A8729',
		accentForeground: '#FFFFFF',
		separator: '#C6C6C8',
		danger: '#FF3B30',
		dangerSubtle: '#FFF0EE',
		warning: '#FF9500',
		warningSubtle: '#FFF8EC',
		success: '#34C759',
		successSubtle: '#EDFBF1',
	},
	dark: {
		text: '#FFFFFF',
		textSecondary: '#8E8E93',
		background: '#000000',
		backgroundElement: '#1C1C1E',
		backgroundSelected: '#2C2C2E',
		accent: '#7DC840',
		accentForeground: '#000000',
		separator: '#38383A',
		danger: '#FF453A',
		dangerSubtle: '#3A1A19',
		warning: '#FF9F0A',
		warningSubtle: '#3A2A10',
		success: '#30D158',
		successSubtle: '#0D2E1A',
	},
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
	ios: {
		sans: 'system-ui',
		serif: 'ui-serif',
		rounded: 'ui-rounded',
		mono: 'ui-monospace',
	},
	default: {
		sans: 'normal',
		serif: 'serif',
		rounded: 'normal',
		mono: 'monospace',
	},
	web: {
		sans: 'var(--font-display)',
		serif: 'var(--font-serif)',
		rounded: 'var(--font-rounded)',
		mono: 'var(--font-mono)',
	},
});

export const Spacing = {
	half: 2,
	one: 4,
	two: 8,
	three: 16,
	four: 24,
	five: 32,
	six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
