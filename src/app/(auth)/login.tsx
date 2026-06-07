import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';

export default function LoginScreen() {
	const { startOAuth, isLoading, authError } = useAuth();
	const theme = useTheme();
	const scheme = useColorScheme();
	const isDark = scheme === 'dark';

	return (
		<ThemedView style={styles.container}>
			<SafeAreaView style={styles.safe}>
				{/* Branding block — vertically centered in the upper 60% */}
				<View style={styles.brandingArea}>
					{/* Logo mark — a simple geometric identity block */}
					<View style={[styles.logoMark, { backgroundColor: theme.accent }]}>
						<ThemedText style={[styles.logoGlyph, { color: theme.accentForeground }]}>
							P
						</ThemedText>
					</View>

					<View style={styles.brandText}>
						<ThemedText
							type='caption'
							style={[styles.eyebrow, { color: theme.accent }]}
						>
							ALTIATEK
						</ThemedText>
						<ThemedText type='title' style={styles.appTitle}>
							Pod Tracker
						</ThemedText>
						<ThemedText
							type='small'
							themeColor='textSecondary'
							style={styles.tagline}
						>
							Daily status for your pod, on the go.
						</ThemedText>
					</View>
				</View>

				{/* Sign-in area — pinned toward the bottom */}
				<View style={styles.authArea}>
					{isLoading ? (
						<ActivityIndicator color={theme.accent} />
					) : (
						<TouchableOpacity
							style={[
								styles.signInButton,
								{ backgroundColor: theme.accent },
								!isDark && styles.signInButtonShadow,
							]}
							onPress={startOAuth}
							activeOpacity={0.85}
						>
							<ThemedText
								type='label'
								style={{ color: theme.accentForeground, letterSpacing: -0.2 }}
							>
								Sign in with AltiaTek
							</ThemedText>
						</TouchableOpacity>
					)}

					{authError !== null && (
						<ThemedText type='small' style={styles.error}>
							{authError}
						</ThemedText>
					)}

					<ThemedText
						type='caption'
						themeColor='textSecondary'
						style={styles.footer}
					>
						ServiceNow OAuth 2.0 · Secured by PKCE
					</ThemedText>
				</View>
			</SafeAreaView>
		</ThemedView>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1 },
	safe: { flex: 1, paddingHorizontal: Spacing.four },

	// Branding
	brandingArea: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		paddingBottom: Spacing.four,
		gap: Spacing.four,
	},
	logoMark: {
		width: 72,
		height: 72,
		borderRadius: 22,
		alignItems: 'center',
		justifyContent: 'center',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.18,
		shadowRadius: 12,
		elevation: 6,
	},
	logoGlyph: {
		fontSize: 36,
		fontWeight: '800',
		letterSpacing: -1,
	},
	brandText: {
		alignItems: 'center',
		gap: 4,
	},
	eyebrow: {
		fontWeight: '800',
		letterSpacing: 2.5,
		marginBottom: 2,
	},
	appTitle: {
		letterSpacing: -0.5,
		textAlign: 'center',
	},
	tagline: {
		textAlign: 'center',
		marginTop: 4,
		opacity: 0.8,
	},

	// Auth
	authArea: {
		paddingBottom: Spacing.four,
		gap: Spacing.three,
		alignItems: 'stretch',
	},
	signInButton: {
		height: 52,
		borderRadius: 14,
		alignItems: 'center',
		justifyContent: 'center',
	},
	signInButtonShadow: {
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 3 },
		shadowOpacity: 0.15,
		shadowRadius: 8,
		elevation: 4,
	},
	error: {
		color: '#FF3B30',
		textAlign: 'center',
	},
	footer: {
		textAlign: 'center',
		opacity: 0.6,
	},
});
