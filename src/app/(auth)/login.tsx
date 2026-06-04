import { ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/hooks/use-theme';

export default function LoginScreen() {
	const { startOAuth, isLoading, authError } = useAuth();
	const theme = useTheme();

	return (
		<ThemedView style={styles.container}>
			<SafeAreaView style={styles.safe}>
				<ThemedView style={styles.inner}>
					<ThemedText type="title" style={styles.title}>
						Pod Tracker
					</ThemedText>
					<ThemedText type="subtitle" style={styles.subtitle}>
						AltiaTek
					</ThemedText>

					{isLoading ? (
						<ActivityIndicator />
					) : (
						<TouchableOpacity
							style={[styles.button, { backgroundColor: theme.accent }]}
							onPress={startOAuth}
						>
							<ThemedText type="label" style={{ color: theme.accentForeground }}>
								Sign in with AltiaTek
							</ThemedText>
						</TouchableOpacity>
					)}

					{authError !== null && (
						<ThemedText type="small" style={styles.error}>
							{authError}
						</ThemedText>
					)}
				</ThemedView>
			</SafeAreaView>
		</ThemedView>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1 },
	safe: { flex: 1 },
	inner: {
		flex: 1,
		justifyContent: 'center',
		paddingHorizontal: Spacing.four,
		gap: Spacing.two,
	},
	title: { textAlign: 'center' },
	subtitle: { textAlign: 'center', marginBottom: Spacing.four },
	button: {
		height: 48,
		borderRadius: Spacing.two,
		alignItems: 'center',
		justifyContent: 'center',
	},
	error: { color: '#C0392B', textAlign: 'center' },
});
