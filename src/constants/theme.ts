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
		// State pills (matches web widget state-open / state-wip / state-done)
		stateOpenBg: '#e0f2fe',
		stateOpenText: '#0369a1',
		stateWipBg: '#fef9c3',
		stateWipText: '#854d0e',
		stateDoneBg: '#dcfce7',
		stateDoneText: '#15803d',
		// Flag badges (at-risk, blocked, needs-help — amber)
		flagBg: '#ffd699',
		flagText: '#9a3412',
		// Card accent bar
		accentBar: '#22c55e',
		accentBarDanger: '#ef4444',
		// Status ok / warn chips
		okBg: '#ecfdf5',
		okText: '#047857',
		warnBg: '#fff7ed',
		warnText: '#9a3412',
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
		// State pills
		stateOpenBg: '#0c2a3a',
		stateOpenText: '#7dd3fc',
		stateWipBg: '#2d2300',
		stateWipText: '#fde68a',
		stateDoneBg: '#0d2e1a',
		stateDoneText: '#4ade80',
		// Flag badges
		flagBg: '#4a2800',
		flagText: '#fb923c',
		// Card accent bar
		accentBar: '#16a34a',
		accentBarDanger: '#b91c1c',
		// Status ok / warn chips
		okBg: '#0d2e1a',
		okText: '#4ade80',
		warnBg: '#3a2508',
		warnText: '#fb923c',
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
