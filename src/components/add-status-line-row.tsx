import { StyleSheet, TouchableOpacity } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { CardRadius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function AddStatusLineRow({ onPress }: { onPress: () => void }) {
	const theme = useTheme();
	return (
		<TouchableOpacity
			style={[styles.row, { borderColor: theme.fieldBorder }]}
			onPress={onPress}
			activeOpacity={0.7}
		>
			<ThemedText style={[styles.label, { color: theme.textSecondary }]}>
				＋ Add status line
			</ThemedText>
		</TouchableOpacity>
	);
}

const styles = StyleSheet.create({
	row: {
		borderRadius: CardRadius,
		borderWidth: 1.5,
		borderStyle: 'dashed',
		minHeight: 64,
		alignItems: 'center',
		justifyContent: 'center',
	},
	label: {
		fontSize: 15,
		fontWeight: '500',
	},
});
