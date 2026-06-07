import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function SectionHeader({ count }: { count: number }) {
	const theme = useTheme();
	return (
		<View style={styles.header}>
			<ThemedText style={[styles.title, { color: theme.text }]}>
				Today's status
			</ThemedText>
			<ThemedText type='caption' style={{ color: theme.textTertiary }}>
				{count} {count === 1 ? 'line' : 'lines'}
			</ThemedText>
		</View>
	);
}

const styles = StyleSheet.create({
	header: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: Spacing.two,
		marginTop: Spacing.one,
	},
	title: {
		fontSize: 19,
		fontWeight: '700',
		letterSpacing: -0.3,
	},
});
