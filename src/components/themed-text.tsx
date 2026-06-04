import { Platform, StyleSheet, Text, type TextProps } from 'react-native';

import { Fonts, ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ThemedTextProps = TextProps & {
	type?: 'default' | 'title' | 'small' | 'smallBold' | 'subtitle' | 'link' | 'linkPrimary' | 'code' | 'label' | 'caption';
	themeColor?: ThemeColor;
};

export function ThemedText({ style, type = 'default', themeColor, ...rest }: ThemedTextProps) {
	const theme = useTheme();

	return (
		<Text
			style={[
				{ color: theme[themeColor ?? 'text'] },
				type === 'default' && styles.default,
				type === 'title' && styles.title,
				type === 'small' && styles.small,
				type === 'smallBold' && styles.smallBold,
				type === 'subtitle' && styles.subtitle,
				type === 'label' && styles.label,
				type === 'caption' && styles.caption,
				type === 'link' && styles.link,
				type === 'linkPrimary' && styles.linkPrimary,
				type === 'code' && styles.code,
				style,
			]}
			{...rest}
		/>
	);
}

const styles = StyleSheet.create({
	title: {
		fontFamily: Fonts?.rounded,
		fontSize: 34,
		fontWeight: '700',
		lineHeight: 41,
		letterSpacing: 0.37,
	},
	subtitle: {
		fontFamily: Fonts?.rounded,
		fontSize: 22,
		fontWeight: '700',
		lineHeight: 28,
		letterSpacing: 0.35,
	},
	default: {
		fontSize: 17,
		lineHeight: 22,
		fontWeight: '400',
		letterSpacing: -0.41,
	},
	label: {
		fontSize: 15,
		lineHeight: 20,
		fontWeight: '600',
		letterSpacing: -0.24,
	},
	small: {
		fontSize: 13,
		lineHeight: 18,
		fontWeight: '400',
		letterSpacing: -0.08,
	},
	smallBold: {
		fontSize: 13,
		lineHeight: 18,
		fontWeight: '600',
		letterSpacing: -0.08,
	},
	caption: {
		fontSize: 12,
		lineHeight: 16,
		fontWeight: '400',
		letterSpacing: 0,
	},
	link: {
		fontSize: 17,
		lineHeight: 22,
		fontWeight: '400',
	},
	linkPrimary: {
		fontSize: 17,
		lineHeight: 22,
		fontWeight: '400',
		color: '#007AFF',
	},
	code: {
		fontFamily: Fonts?.mono,
		fontWeight: Platform.select({ android: '700' }) ?? '400',
		fontSize: 13,
	},
});
