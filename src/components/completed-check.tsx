import { SymbolView } from 'expo-symbols';
import { Platform, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';

export function CompletedCheck() {
	const theme = useTheme();
	return (
		<View style={[styles.circle, { backgroundColor: theme.accent }]}>
			{Platform.OS === 'ios' ? (
				<SymbolView
					name='checkmark'
					style={{ width: 9, height: 9 }}
					tintColor={theme.accentForeground}
					resizeMode='scaleAspectFit'
				/>
			) : (
				<ThemedText
					style={{ color: theme.accentForeground, fontSize: 8, fontWeight: '800' }}
				>
					✓
				</ThemedText>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	circle: {
		width: 16,
		height: 16,
		borderRadius: 999,
		alignItems: 'center',
		justifyContent: 'center',
	},
});
