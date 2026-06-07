import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
	light: {
		text: '#0E1B17',
		textSecondary: '#56655F',
		textTertiary: '#90A09A',
		background: '#F1F4F3',
		backgroundTop: '#F9FBFA',
		backgroundElement: '#FFFFFF',
		backgroundSelected: '#EAEEEC',
		accent: '#0EA56B',
		accentForeground: '#FFFFFF',
		accentSoft: '#E3F5EC',
		brand: '#A9DB1B',
		separator: 'rgba(13,32,26,0.08)',
		fieldBorder: 'rgba(13,32,26,0.16)',
		danger: '#D6453C',
		dangerSubtle: '#FCEBE9',
		warning: '#B8860B',
		warningSubtle: '#FBF1DA',
		success: '#0E9C5F',
		successSubtle: '#E3F5EC',
		flagRiskBg: '#FBF1DA',
		flagRiskText: '#B8860B',
		flagHelpBg: '#E3F5EC',
		flagHelpText: '#0EA56B',
		flagBlockBg: '#FCEBE9',
		flagBlockText: '#D6453C',
		tabBar: 'rgba(249,251,250,0.82)',
		tabIdle: '#9AA9A3',
	},
	dark: {
		text: '#ECF3EF',
		textSecondary: '#97A69F',
		textTertiary: '#69786F',
		background: '#0A130F',
		backgroundTop: '#0E1A15',
		backgroundElement: '#15211B',
		backgroundSelected: 'rgba(255,255,255,0.10)',
		accent: '#1FC57E',
		accentForeground: '#04140C',
		accentSoft: 'rgba(31,197,126,0.13)',
		brand: '#B6E62A',
		separator: 'rgba(255,255,255,0.08)',
		fieldBorder: 'rgba(255,255,255,0.16)',
		danger: '#FF6F64',
		dangerSubtle: 'rgba(255,111,100,0.12)',
		warning: '#E7B14B',
		warningSubtle: 'rgba(231,177,75,0.13)',
		success: '#4BD07E',
		successSubtle: 'rgba(75,208,126,0.13)',
		flagRiskBg: 'rgba(231,177,75,0.13)',
		flagRiskText: '#E7B14B',
		flagHelpBg: 'rgba(31,197,126,0.13)',
		flagHelpText: '#1FC57E',
		flagBlockBg: 'rgba(255,111,100,0.12)',
		flagBlockText: '#FF6F64',
		tabBar: 'rgba(14,26,21,0.82)',
		tabIdle: '#69786F',
	},
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const CardRadius = 20;

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
