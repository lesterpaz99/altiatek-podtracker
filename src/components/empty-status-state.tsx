import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function EmptyStatusState() {
	const theme = useTheme();
	return (
		<View style={styles.container}>
			<ThemedText style={[styles.icon, { color: theme.textTertiary }]}>
				⬡
			</ThemedText>
			<ThemedText style={[styles.title, { color: theme.text }]}>
				No status lines yet
			</ThemedText>
			<ThemedText type='small' style={[styles.subtitle, { color: theme.textSecondary }]}>
				Add your first line to start tracking today's work.
			</ThemedText>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: Spacing.six,
		gap: Spacing.one,
	},
	icon: {
		fontSize: 36,
		marginBottom: Spacing.two,
	},
	title: {
		fontSize: 17,
		fontWeight: '600',
		letterSpacing: -0.2,
	},
	subtitle: {
		textAlign: 'center',
		marginTop: Spacing.one,
		paddingHorizontal: Spacing.five,
	},
});
