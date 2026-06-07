import { ActivityIndicator, Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { SymbolView } from 'expo-symbols';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';

// Approximate hexagon outline as a rotated rounded rect
function HexOutline({ size, color, opacity = 1 }: { size: number; color: string; opacity?: number }) {
	const w = Math.round(size * 0.866);
	return (
		<View
			pointerEvents="none"
			style={{
				width: w,
				height: size,
				borderRadius: size * 0.12,
				borderWidth: 1.5,
				borderColor: color,
				opacity,
				transform: [{ rotate: '30deg' }],
			}}
		/>
	);
}

export default function LoginScreen() {
	const { startOAuth, isLoading, authError } = useAuth();
	const theme = useTheme();
	const scheme = useColorScheme();
	const isDark = scheme === 'dark';

	const heroColors: readonly [string, string] = isDark
		? ['#0F7E52', '#063A26']
		: ['#12A86E', '#0A6E48'];

	return (
		<View style={[styles.root, { backgroundColor: theme.background }]}>
			{/* ── Hero ───────────────────────────────────────────────────────── */}
			<LinearGradient
				colors={heroColors}
				start={{ x: 0.15, y: 0 }}
				end={{ x: 0.85, y: 1 }}
				style={styles.hero}
			>
				{/* Decorative hex outlines — absolute positioned */}
				<View style={styles.hexLg} pointerEvents="none">
					<HexOutline size={200} color="rgba(255,255,255,1)" opacity={0.06} />
				</View>
				<View style={styles.hexMd} pointerEvents="none">
					<HexOutline size={110} color="rgba(255,255,255,1)" opacity={0.07} />
				</View>
				<View style={styles.hexSm} pointerEvents="none">
					<HexOutline size={100} color={theme.brand} opacity={0.5} />
				</View>

				<SafeAreaView edges={['top']} style={styles.heroSafe}>
					{/* Brand row */}
					<View style={styles.brandRow}>
						<View style={styles.brandMark} />
						<ThemedText style={styles.brandLabel}>ALTIATEK</ThemedText>
					</View>

					{/* Title + tagline */}
					<View style={styles.heroBody}>
						<ThemedText style={styles.heroTitle}>PodTracker</ThemedText>
						<ThemedText style={styles.heroTagline}>
							Log your day. Track effort across every pod.
						</ThemedText>
					</View>
				</SafeAreaView>
			</LinearGradient>

			{/* ── Form sheet — overlaps hero by 26px ─────────────────────── */}
			<View
				style={[
					styles.formSheet,
					{ backgroundColor: theme.background },
				]}
			>
				<SafeAreaView edges={['bottom']} style={styles.formSafe}>
					{/* Sign in heading */}
					<View style={styles.formTop}>
						<ThemedText style={[styles.signInTitle, { color: theme.text }]}>Sign in</ThemedText>
						<ThemedText type="small" style={{ color: theme.textSecondary, marginTop: 6 }}>
							Use your AltiaTek work account to continue.
						</ThemedText>
					</View>

					{/* SSO button */}
					{isLoading ? (
						<View style={[styles.ssoBtn, { backgroundColor: theme.accent }]}>
							<ActivityIndicator color={theme.accentForeground} />
						</View>
					) : (
						<TouchableOpacity
							style={[styles.ssoBtn, { backgroundColor: theme.accent }]}
							onPress={startOAuth}
							activeOpacity={0.85}
						>
							{Platform.OS === 'ios' && (
								<SymbolView
									name="checkmark.shield.fill"
									style={styles.ssoIcon}
									tintColor={theme.accentForeground}
									resizeMode="scaleAspectFit"
								/>
							)}
							<ThemedText style={[styles.ssoBtnLabel, { color: theme.accentForeground }]}>
								Continue with AltiaTek SSO
							</ThemedText>
						</TouchableOpacity>
					)}

					{authError !== null && (
						<ThemedText
							type="small"
							style={[styles.errorText, { color: theme.danger }]}
						>
							{authError}
						</ThemedText>
					)}

					<ThemedText type="small" style={[styles.troubleText, { color: theme.textSecondary }]}>
						Trouble signing in?{' '}
						<ThemedText type="small" style={{ color: theme.accent }}>Contact IT</ThemedText>
					</ThemedText>

					<View style={styles.footerSpacer} />

					<ThemedText
						type="caption"
						style={[styles.versionFooter, { color: theme.textTertiary }]}
					>
						PodTracker v1.0.0 · AltiaTek Internal
					</ThemedText>
				</SafeAreaView>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	root: { flex: 1 },

	// ── Hero
	hero: {
		height: 358,
		overflow: 'hidden',
	},
	heroSafe: {
		flex: 1,
		paddingHorizontal: Spacing.four,
	},

	// Hex decoration wrappers (absolute positioned)
	hexLg: {
		position: 'absolute',
		top: 20,
		right: -60,
	},
	hexMd: {
		position: 'absolute',
		top: 80,
		right: 30,
	},
	hexSm: {
		position: 'absolute',
		bottom: 60,
		right: 10,
	},

	// Brand row
	brandRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 7,
		marginTop: Spacing.two,
	},
	brandMark: {
		width: 8,
		height: 18,
		borderRadius: 2,
		backgroundColor: '#A9DB1B',
		transform: [{ skewX: '-12deg' }],
	},
	brandLabel: {
		color: 'rgba(255,255,255,0.92)',
		fontSize: 13,
		fontWeight: '700',
		letterSpacing: 0.5,
		textTransform: 'uppercase',
	},

	// Hero content
	heroBody: {
		marginTop: Spacing.five,
		gap: Spacing.two,
	},
	heroTitle: {
		color: '#FFFFFF',
		fontSize: 44,
		fontWeight: '800',
		letterSpacing: -1.4,
		lineHeight: 50,
	},
	heroTagline: {
		color: 'rgba(255,255,255,0.82)',
		fontSize: 16,
		fontWeight: '500',
		lineHeight: 22,
	},

	// ── Form sheet
	formSheet: {
		flex: 1,
		borderTopLeftRadius: 28,
		borderTopRightRadius: 28,
		marginTop: -26,
	},
	formSafe: {
		flex: 1,
		paddingHorizontal: Spacing.four,
		paddingTop: Spacing.four,
	},
	formTop: {
		marginBottom: Spacing.four,
	},
	signInTitle: {
		fontSize: 23,
		fontWeight: '800',
		letterSpacing: -0.4,
	},

	// SSO button
	ssoBtn: {
		height: 54,
		borderRadius: 15,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: Spacing.two,
		marginBottom: Spacing.three,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 3 },
		shadowOpacity: 0.12,
		shadowRadius: 8,
		elevation: 4,
	},
	ssoIcon: {
		width: 20,
		height: 20,
	},
	ssoBtnLabel: {
		fontSize: 16,
		fontWeight: '700',
		letterSpacing: -0.2,
	},

	errorText: {
		textAlign: 'center',
		marginBottom: Spacing.two,
	},
	troubleText: {
		textAlign: 'center',
		marginTop: Spacing.one,
	},

	footerSpacer: { flex: 1 },
	versionFooter: {
		textAlign: 'center',
		marginBottom: Spacing.two,
	},
});
