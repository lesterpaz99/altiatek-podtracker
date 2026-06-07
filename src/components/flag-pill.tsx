import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';

export type FlagType = 'risk' | 'help' | 'blocked';

export function FlagPill({ type }: { type: FlagType }) {
	const theme = useTheme();
	const config = {
		risk: { bg: theme.flagRiskBg, color: theme.flagRiskText, label: 'At risk' },
		help: { bg: theme.flagHelpBg, color: theme.flagHelpText, label: 'Needs help' },
		blocked: { bg: theme.flagBlockBg, color: theme.flagBlockText, label: 'Blocked' },
	}[type];

	return (
		<View style={[styles.pill, { backgroundColor: config.bg }]}>
			<ThemedText type='caption' style={{ color: config.color, fontWeight: '700' }}>
				{config.label}
			</ThemedText>
		</View>
	);
}

const styles = StyleSheet.create({
	pill: {
		borderRadius: 999,
		paddingVertical: 3,
		paddingHorizontal: 9,
	},
});
