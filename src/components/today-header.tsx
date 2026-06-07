import { SymbolView } from 'expo-symbols';
import { useRef, useState } from 'react';
import {
	Dimensions,
	Modal,
	Platform,
	Pressable,
	StyleSheet,
	TouchableOpacity,
	View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import type { PodMember } from '@/context/auth-context';
import { useAuth } from '@/context/auth-context';
import { getInitials, greet, todayLabel } from '@/helpers/format';
import { useTheme } from '@/hooks/use-theme';

// ─── Brand row ───────────────────────────────────────────────────────────────

function BrandRow() {
	const theme = useTheme();
	const { podMember } = useAuth();
	return (
		<View style={styles.brandRow}>
			<View style={styles.brandLeft}>
				<View style={[styles.brandMark, { backgroundColor: theme.brand }]} />
				<ThemedText style={[styles.brandLabel, { color: theme.textSecondary }]}>
					ALTIATEK PODTRACKER
				</ThemedText>
			</View>
			{podMember && <PressableAvatar displayName={podMember.displayName} />}
		</View>
	);
}

// ─── Avatar menu ─────────────────────────────────────────────────────────────

interface MenuPosition {
	top: number;
	right: number;
}

interface AvatarMenuProps {
	visible: boolean;
	position: MenuPosition;
	onClose: () => void;
	onProfile: () => void;
	onSignOut: () => void;
}

function AvatarMenu({
	visible,
	position,
	onClose,
	onProfile,
	onSignOut,
}: AvatarMenuProps) {
	const theme = useTheme();
	return (
		<Modal
			transparent
			animationType='fade'
			visible={visible}
			onRequestClose={onClose}
			statusBarTranslucent
		>
			<Pressable style={styles.menuBackdrop} onPress={onClose}>
				<Pressable
					style={[
						styles.menuCard,
						{
							top: position.top,
							right: position.right,
							backgroundColor: theme.backgroundElement,
							shadowColor: '#000',
						},
					]}
					onPress={() => {}}
				>
					<TouchableOpacity
						style={styles.menuRow}
						onPress={onProfile}
						activeOpacity={0.7}
					>
						{Platform.OS === 'ios' ? (
							<SymbolView
								name='person'
								style={styles.menuIcon}
								tintColor={theme.text}
								resizeMode='scaleAspectFit'
							/>
						) : (
							<ThemedText style={{ fontSize: 16 }}>👤</ThemedText>
						)}
						<ThemedText style={[styles.menuRowLabel, { color: theme.text }]}>
							See profile
						</ThemedText>
					</TouchableOpacity>

					<View
						style={[styles.menuDivider, { backgroundColor: theme.separator }]}
					/>

					<TouchableOpacity
						style={styles.menuRow}
						onPress={onSignOut}
						activeOpacity={0.7}
					>
						{Platform.OS === 'ios' ? (
							<SymbolView
								name='rectangle.portrait.and.arrow.right'
								style={styles.menuIcon}
								tintColor={theme.danger}
								resizeMode='scaleAspectFit'
							/>
						) : (
							<ThemedText style={{ fontSize: 16, color: theme.danger }}>
								↩
							</ThemedText>
						)}
						<ThemedText style={[styles.menuRowLabel, { color: theme.danger }]}>
							Sign out
						</ThemedText>
					</TouchableOpacity>
				</Pressable>
			</Pressable>
		</Modal>
	);
}

// ─── Pressable avatar ─────────────────────────────────────────────────────────

function PressableAvatar({ displayName }: { displayName: string }) {
	const theme = useTheme();
	const { signOut } = useAuth();
	const ref = useRef<View>(null);
	const [menuVisible, setMenuVisible] = useState(false);
	const [menuPos, setMenuPos] = useState<MenuPosition>({ top: 0, right: 0 });

	function handlePress() {
		ref.current?.measureInWindow((x, y, width, height) => {
			const screenWidth = Dimensions.get('window').width;
			setMenuPos({ top: y + height + 8, right: screenWidth - x - width });
			setMenuVisible(true);
		});
	}

	return (
		<>
			<TouchableOpacity
				onPress={handlePress}
				hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
				activeOpacity={0.8}
			>
				<View
					ref={ref}
					style={[
						styles.avatar,
						{ backgroundColor: theme.accentSoft, borderColor: theme.accent },
					]}
				>
					<ThemedText style={[styles.avatarText, { color: theme.accent }]}>
						{getInitials(displayName)}
					</ThemedText>
				</View>
			</TouchableOpacity>

			<AvatarMenu
				visible={menuVisible}
				position={menuPos}
				onClose={() => setMenuVisible(false)}
				onProfile={() => setMenuVisible(false)}
				onSignOut={async () => {
					setMenuVisible(false);
					await signOut();
				}}
			/>
		</>
	);
}

// ─── Status logged chip ───────────────────────────────────────────────────────

function StatusLoggedChip() {
	const theme = useTheme();
	return (
		<View style={[styles.chip, { backgroundColor: theme.successSubtle }]}>
			{Platform.OS === 'ios' ? (
				<SymbolView
					name='checkmark'
					style={{ width: 11, height: 11 }}
					tintColor={theme.success}
					resizeMode='scaleAspectFit'
				/>
			) : (
				<ThemedText style={{ color: theme.success, fontSize: 11 }}>
					✓
				</ThemedText>
			)}
			<ThemedText
				type='caption'
				style={{ color: theme.success, fontWeight: '600' }}
			>
				Status logged today
			</ThemedText>
		</View>
	);
}

// ─── Needs-attention chip ─────────────────────────────────────────────────────

function NeedsAttentionChip({ count }: { count: number }) {
	const theme = useTheme();
	if (count === 0) return null;
	return (
		<View style={[styles.chip, { backgroundColor: theme.dangerSubtle }]}>
			<ThemedText
				type='caption'
				style={{ color: theme.danger, fontWeight: '800' }}
			>
				{count}
			</ThemedText>
			<ThemedText type='caption' style={{ color: theme.danger }}>
				{count === 1 ? 'line needs attention' : 'lines need attention'}
			</ThemedText>
		</View>
	);
}

// ─── Today header (exported) ──────────────────────────────────────────────────

interface TodayHeaderProps {
	podMember: PodMember | null;
	statusLogged: boolean;
	needsCount: number;
	loading: boolean;
}

export function TodayHeader({
	podMember,
	statusLogged,
	needsCount,
	loading,
}: TodayHeaderProps) {
	return (
		<>
			<BrandRow />

			<View style={styles.greetingRow}>
				<View style={styles.greetingLeft}>
					<ThemedText style={styles.greeting}>
						{podMember ? greet(podMember.displayName) : 'Pod Tracker'}
					</ThemedText>
					<ThemedText type='small' themeColor='textTertiary'>
						{todayLabel()}
					</ThemedText>
				</View>
			</View>

			{!loading && (
				<View style={styles.chipsRow}>
					{statusLogged && <StatusLoggedChip />}
					<NeedsAttentionChip count={needsCount} />
				</View>
			)}
		</>
	);
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
	brandRow: {
		flexDirection: 'row',
		alignItems: 'flex-start',
		justifyContent: 'space-between',
	},
	brandLeft: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 7,
	},
	brandMark: {
		width: 8,
		height: 18,
		borderRadius: 2,
		transform: [{ skewX: '-12deg' }],
	},
	brandLabel: {
		fontSize: 12.5,
		fontWeight: '700',
		letterSpacing: 0.7,
		textTransform: 'uppercase',
	},

	greetingRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'flex-start',
		marginBottom: Spacing.three,
		marginTop: -12,
	},
	greetingLeft: { flex: 1, gap: 2 },
	greeting: {
		fontSize: 28,
		fontWeight: '800',
		letterSpacing: -0.5,
		lineHeight: 34,
	},

	avatar: {
		width: 44,
		height: 44,
		borderRadius: 22,
		borderWidth: 2,
		alignItems: 'center',
		justifyContent: 'center',
	},
	avatarText: {
		fontSize: 15,
		fontWeight: '700',
		letterSpacing: -0.3,
	},

	menuBackdrop: {
		flex: 1,
		// backgroundColor: 'rgba(0,0,0,0.1)',
	},
	menuCard: {
		position: 'absolute',
		borderRadius: 16,
		overflow: 'hidden',
		minWidth: 190,
		shadowOffset: { width: 0, height: 8 },
		shadowOpacity: 0.12,
		shadowRadius: 24,
		elevation: 8,
		marginTop: -Spacing.three,
	},
	menuRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
		paddingVertical: 14,
		paddingHorizontal: 18,
	},
	menuIcon: {
		width: 18,
		height: 18,
	},
	menuRowLabel: {
		fontSize: 16,
		fontWeight: '500',
	},
	menuDivider: {
		height: StyleSheet.hairlineWidth,
		marginHorizontal: 18,
	},

	chipsRow: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: Spacing.two,
		marginBottom: Spacing.two,
	},
	chip: {
		alignSelf: 'flex-start',
		flexDirection: 'row',
		alignItems: 'center',
		gap: 5,
		borderRadius: 999,
		paddingVertical: 6,
		paddingHorizontal: 12,
	},
});
