import { SymbolView } from 'expo-symbols';
import { useEffect, useRef, useState } from 'react';
import {
	AccessibilityInfo,
	ActivityIndicator,
	FlatList,
	Platform,
	StyleSheet,
	TouchableOpacity,
	View,
} from 'react-native';
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withRepeat,
	withSequence,
	withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { TodayHeader } from '@/components/today-header';
import { ThemedView } from '@/components/themed-view';
import { CardRadius, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';
import {
	fetchStatusLines,
	fetchTodayHeader,
	type PodMemberStatus,
	type StatusLine,
} from '@/services/servicenow';
import { type StateKey, resolveState } from '@/helpers/status';

// ─── Pulse dot ───────────────────────────────────────────────────────────────

function PulseDot() {
	const theme = useTheme();
	const scale = useSharedValue(1);
	const haloOpacity = useSharedValue(0.55);
	const reducedMotion = useRef(false);

	useEffect(() => {
		AccessibilityInfo.isReduceMotionEnabled().then((v) => {
			reducedMotion.current = v;
			if (!v) startPulse();
		});
	}, []);

	function startPulse() {
		scale.value = withRepeat(
			withSequence(
				withTiming(1, { duration: 0 }),
				withTiming(2.8, { duration: 2100 })
			),
			-1,
			false
		);
		haloOpacity.value = withRepeat(
			withSequence(
				withTiming(0.55, { duration: 0 }),
				withTiming(0, { duration: 2100 })
			),
			-1,
			false
		);
	}

	const haloStyle = useAnimatedStyle(() => ({
		transform: [{ scale: scale.value }],
		opacity: haloOpacity.value,
	}));

	return (
		<View style={styles.pulseDotWrap}>
			<Animated.View
				style={[
					styles.pulseDotHalo,
					{ backgroundColor: theme.accent },
					haloStyle,
				]}
			/>
			<View style={[styles.pulseDotCore, { backgroundColor: theme.accent }]} />
		</View>
	);
}

// ─── Completed check ─────────────────────────────────────────────────────────

function CompletedCheck() {
	const theme = useTheme();
	return (
		<View style={[styles.completedCheck, { backgroundColor: theme.accent }]}>
			{Platform.OS === 'ios' ? (
				<SymbolView
					name='checkmark'
					style={{ width: 9, height: 9 }}
					tintColor={theme.accentForeground}
					resizeMode='scaleAspectFit'
				/>
			) : (
				<ThemedText
					style={{
						color: theme.accentForeground,
						fontSize: 8,
						fontWeight: '800',
					}}
				>
					✓
				</ThemedText>
			)}
		</View>
	);
}

// ─── Flag pill ───────────────────────────────────────────────────────────────

type FlagType = 'risk' | 'help' | 'blocked';

function FlagPill({ type }: { type: FlagType }) {
	const theme = useTheme();
	const config = {
		risk: { bg: theme.flagRiskBg, color: theme.flagRiskText, label: 'At risk' },
		help: {
			bg: theme.flagHelpBg,
			color: theme.flagHelpText,
			label: 'Needs help',
		},
		blocked: {
			bg: theme.flagBlockBg,
			color: theme.flagBlockText,
			label: 'Blocked',
		},
	}[type];
	return (
		<View style={[styles.flagPill, { backgroundColor: config.bg }]}>
			<ThemedText
				type='caption'
				style={{ color: config.color, fontWeight: '700' }}
			>
				{config.label}
			</ThemedText>
		</View>
	);
}

// ─── Utilization card ────────────────────────────────────────────────────────

function UtilizationCard({ lines }: { lines: StatusLine[] }) {
	const theme = useTheme();
	const activeLines = lines.filter(
		(l) => resolveState(l.u_state ?? '') !== 'completed'
	);
	const util = activeLines.reduce(
		(sum, l) => sum + (parseInt(l.u_time_percent, 10) || 0),
		0
	);
	const isOver = util > 100;
	const barFill = Math.min(util, 100);

	return (
		<View
			style={[
				styles.utilizationCard,
				{ backgroundColor: theme.backgroundElement },
				{ borderWidth: StyleSheet.hairlineWidth, borderColor: theme.separator },
			]}
		>
			<View style={styles.utilLeft}>
				<View style={styles.utilTopRow}>
					<ThemedText
						style={[
							styles.utilNumber,
							{ color: isOver ? theme.danger : theme.text },
						]}
					>
						{util}%
					</ThemedText>
					{isOver && (
						<View
							style={[
								styles.overAllocPill,
								{ backgroundColor: theme.dangerSubtle },
							]}
						>
							<ThemedText
								type='caption'
								style={{ color: theme.danger, fontWeight: '700' }}
							>
								Over-allocated
							</ThemedText>
						</View>
					)}
				</View>
				<ThemedText
					type='small'
					style={{ color: theme.textSecondary, marginTop: 2 }}
				>
					Utilization across {activeLines.length} active{' '}
					{activeLines.length === 1 ? 'line' : 'lines'}
				</ThemedText>
			</View>

			<View style={styles.utilRight}>
				<View
					style={[
						styles.utilMeterTrack,
						{ backgroundColor: theme.backgroundSelected },
					]}
				>
					<View
						style={[
							styles.utilMeterFill,
							{
								width: `${barFill}%` as unknown as number,
								backgroundColor: isOver ? theme.danger : theme.accent,
							},
						]}
					/>
				</View>
				<ThemedText
					type='caption'
					style={{ color: theme.textTertiary, marginTop: 4 }}
				>
					cap 100%
				</ThemedText>
			</View>
		</View>
	);
}

// ─── Section header ──────────────────────────────────────────────────────────

function SectionHeader({ count }: { count: number }) {
	const theme = useTheme();
	return (
		<View style={styles.sectionHeader}>
			<ThemedText style={[styles.sectionTitle, { color: theme.text }]}>
				Today's status
			</ThemedText>
			<ThemedText type='caption' style={{ color: theme.textTertiary }}>
				{count} {count === 1 ? 'line' : 'lines'}
			</ThemedText>
		</View>
	);
}

// ─── Dashed add row ───────────────────────────────────────────────────────────

function AddStatusLineRow({ onPress }: { onPress: () => void }) {
	const theme = useTheme();
	return (
		<TouchableOpacity
			style={[styles.addRow, { borderColor: theme.fieldBorder }]}
			onPress={onPress}
			activeOpacity={0.7}
		>
			<ThemedText style={[styles.addRowLabel, { color: theme.textSecondary }]}>
				＋ Add status line
			</ThemedText>
		</TouchableOpacity>
	);
}

// ─── Status line card ────────────────────────────────────────────────────────

function StatusLineCard({
	item,
	podName,
}: {
	item: StatusLine;
	podName?: string;
}) {
	const theme = useTheme();
	const scheme = useColorScheme();
	const isDark = scheme === 'dark';
	const stateKey = resolveState(item.u_state ?? '');
	const isCompleted = stateKey === 'completed';
	const isAtRisk = item.u_at_risk === 'true';
	const needsHelp = item.u_needs_help === 'true';
	const isBlocked = item.u_blocked === 'true';
	const hasFlag = isAtRisk || needsHelp || isBlocked;

	const lineCode = item.u_assignment.display_value || '';

	return (
		<View
			style={[
				styles.card,
				{ backgroundColor: theme.backgroundElement },
				isDark
					? {
							borderWidth: StyleSheet.hairlineWidth,
							borderColor: theme.separator,
						}
					: styles.cardShadow,
				isCompleted && {
					borderWidth: StyleSheet.hairlineWidth,
					borderColor: theme.successSubtle,
					opacity: 0.94,
				},
			]}
		>
			{/* Top row: indicator + status text + code + edit pencil */}
			<View style={[styles.cardTopRow, { borderBottomColor: theme.separator }]}>
				<View style={styles.cardTopLeft}>
					{stateKey === 'completed' ? <CompletedCheck /> : <PulseDot />}
					<ThemedText
						type='caption'
						style={{
							color: isCompleted ? theme.success : theme.textSecondary,
							fontWeight: '500',
						}}
					>
						{isCompleted ? 'Completed' : 'In progress'}
					</ThemedText>
					{lineCode ? (
						<>
							<View
								style={[styles.dotSep, { backgroundColor: theme.textTertiary }]}
							/>
							<ThemedText type='caption' style={{ color: theme.textTertiary }}>
								{lineCode}
							</ThemedText>
						</>
					) : null}
				</View>
				{Platform.OS === 'ios' ? (
					<SymbolView
						name='pencil'
						style={styles.editIcon}
						tintColor={theme.textTertiary}
						resizeMode='scaleAspectFit'
					/>
				) : (
					<ThemedText style={{ color: theme.textTertiary, fontSize: 14 }}>
						✎
					</ThemedText>
				)}
			</View>

			{/* Body row: name + effort */}
			<View style={styles.cardBody}>
				<View style={styles.cardBodyLeft}>
					<ThemedText
						style={[styles.itemName, { color: theme.text }]}
						numberOfLines={2}
					>
						{item.u_item_name || item.u_assignment_name || 'Untitled'}
					</ThemedText>
					{item.u_current_focus ? (
						<ThemedText
							type='small'
							style={{ color: theme.textSecondary }}
							numberOfLines={2}
						>
							{item.u_current_focus}
						</ThemedText>
					) : null}
				</View>

				<View style={styles.effortBlock}>
					<ThemedText style={[styles.effortNumber, { color: theme.text }]}>
						{item.u_time_percent}
						<ThemedText
							style={[styles.effortPct, { color: theme.textSecondary }]}
						>
							%
						</ThemedText>
					</ThemedText>
					<ThemedText
						type='caption'
						style={[styles.effortCaption, { color: theme.textTertiary }]}
					>
						EFFORT
					</ThemedText>
				</View>
			</View>

			{/* Flag pills */}
			{hasFlag && (
				<View style={styles.flagRow}>
					{isBlocked && <FlagPill type='blocked' />}
					{isAtRisk && <FlagPill type='risk' />}
					{needsHelp && <FlagPill type='help' />}
				</View>
			)}

			{/* Meta row: target date + pod */}
			<View style={[styles.metaRow, { borderTopColor: theme.separator }]}>
				<ThemedText type='caption' style={{ color: theme.textTertiary }}>
					{isCompleted
						? `✓ Done · ${item.u_target_date || '—'}`
						: item.u_target_date || '—'}
				</ThemedText>
				{podName ? (
					<ThemedText type='caption' style={{ color: theme.textTertiary }}>
						⬡ {podName}
					</ThemedText>
				) : null}
			</View>
		</View>
	);
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function TodayScreen() {
	const { session, podMember } = useAuth();
	const [header, setHeader] = useState<PodMemberStatus | null>(null);
	const [lines, setLines] = useState<StatusLine[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const needsCount = lines.filter(
		(l) =>
			l.u_at_risk === 'true' ||
			l.u_needs_help === 'true' ||
			l.u_blocked === 'true'
	).length;

	useEffect(() => {
		if (!session || !podMember) return;
		fetchTodayHeader(session.accessToken, podMember.sysId)
			.then(async (hdr) => {
				setHeader(hdr);
				if (hdr) {
					const lns = await fetchStatusLines(session.accessToken, hdr.sys_id);
					setLines(lns);
				}
			})
			.catch((e: unknown) =>
				setError(e instanceof Error ? e.message : String(e))
			)
			.finally(() => setLoading(false));
	}, [session, podMember]);

	const listHeader = (
		<>
			<AddStatusLineRow
				onPress={() => {
					/* navigate to add-status-line */
				}}
			/>
		</>
	);

	return (
		<ThemedView style={styles.container}>
			<SafeAreaView style={styles.safe}>
				<TodayHeader
					podMember={podMember}
					statusLogged={!!header}
					needsCount={needsCount}
					loading={loading}
				/>

				{loading && <ActivityIndicator style={styles.spinner} />}

				{error !== null && (
					<ThemedText type='small' style={styles.error}>
						{error}
					</ThemedText>
				)}

				{/* Utilization card — only when lines exist */}
				{!loading && header && lines.length > 0 && (
					<UtilizationCard lines={lines} />
				)}

				{/* Section header + list */}
				{header && (
					<>
						<SectionHeader count={lines.length} />
						<FlatList
							data={lines}
							keyExtractor={(item) => item.sys_id}
							contentContainerStyle={styles.list}
							ListHeaderComponent={listHeader}
							renderItem={({ item }) => (
								<StatusLineCard
									item={item}
									podName={header.u_pod.display_value}
								/>
							)}
							ListEmptyComponent={
								loading ? null : (
									<AddStatusLineRow
										onPress={() => {
											/* navigate */
										}}
									/>
								)
							}
						/>
					</>
				)}
			</SafeAreaView>
		</ThemedView>
	);
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
	container: { flex: 1 },
	safe: { flex: 1, paddingHorizontal: Spacing.four, paddingTop: Spacing.two },

	spinner: { marginTop: Spacing.five },
	error: { color: '#FF3B30', marginTop: Spacing.three },

	// Utilization card
	utilizationCard: {
		borderRadius: CardRadius,
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: Spacing.three,
		paddingVertical: Spacing.three,
		marginBottom: Spacing.three,
		gap: Spacing.three,
	},
	utilLeft: { flex: 1 },
	utilTopRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: Spacing.two,
	},
	utilNumber: {
		fontSize: 30,
		fontWeight: '800',
		letterSpacing: -1,
	},
	overAllocPill: {
		borderRadius: 999,
		paddingVertical: 3,
		paddingHorizontal: 9,
	},
	utilRight: {
		width: 70,
		alignItems: 'flex-end',
	},
	utilMeterTrack: {
		width: 70,
		height: 8,
		borderRadius: 999,
		overflow: 'hidden',
	},
	utilMeterFill: {
		height: 8,
		borderRadius: 999,
	},

	// Section header
	sectionHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: Spacing.two,
		marginTop: Spacing.one,
	},
	sectionTitle: {
		fontSize: 19,
		fontWeight: '700',
		letterSpacing: -0.3,
	},

	list: { gap: Spacing.two, paddingBottom: Spacing.four },

	// Dashed add row
	addRow: {
		borderRadius: CardRadius,
		borderWidth: 1.5,
		borderStyle: 'dashed',
		minHeight: 64,
		alignItems: 'center',
		justifyContent: 'center',
	},
	addRowLabel: {
		fontSize: 15,
		fontWeight: '500',
	},

	// Status line card
	card: {
		borderRadius: CardRadius,
	},
	cardShadow: {
		shadowColor: '#101828',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.07,
		shadowRadius: 12,
		elevation: 3,
	},

	// Card top row
	cardTopRow: {
		paddingHorizontal: Spacing.three,
		paddingVertical: Spacing.two,
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		borderBottomWidth: StyleSheet.hairlineWidth,
	},
	cardTopLeft: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: Spacing.one,
		flex: 1,
	},
	dotSep: {
		width: 3,
		height: 3,
		borderRadius: 999,
		marginHorizontal: 2,
	},
	editIcon: {
		width: 16,
		height: 16,
		marginLeft: Spacing.two,
	},

	// Card body
	cardBody: {
		paddingHorizontal: Spacing.three,
		paddingTop: Spacing.two,
		paddingBottom: Spacing.two,
		flexDirection: 'row',
		gap: Spacing.two,
	},
	cardBodyLeft: {
		flex: 1,
		gap: 4,
	},
	itemName: {
		fontSize: 17,
		fontWeight: '700',
		letterSpacing: -0.3,
		lineHeight: 22,
	},

	// Effort block
	effortBlock: {
		alignItems: 'flex-end',
		justifyContent: 'flex-start',
		flexShrink: 0,
		minWidth: 52,
	},
	effortNumber: {
		fontSize: 22,
		fontWeight: '800',
		lineHeight: 26,
		letterSpacing: -0.5,
	},
	effortPct: {
		fontSize: 14,
		fontWeight: '600',
	},
	effortCaption: {
		textTransform: 'uppercase',
		letterSpacing: 0.5,
		marginTop: 2,
	},

	// Flag row
	flagRow: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: Spacing.one,
		paddingHorizontal: Spacing.three,
		paddingBottom: Spacing.two,
	},
	flagPill: {
		borderRadius: 999,
		paddingVertical: 3,
		paddingHorizontal: 9,
	},

	// Meta row
	metaRow: {
		paddingHorizontal: Spacing.three,
		paddingVertical: Spacing.two,
		flexDirection: 'row',
		justifyContent: 'space-between',
		borderTopWidth: StyleSheet.hairlineWidth,
	},

	// Pulse dot
	pulseDotWrap: {
		width: 11,
		height: 11,
		alignItems: 'center',
		justifyContent: 'center',
	},
	pulseDotHalo: {
		position: 'absolute',
		width: 11,
		height: 11,
		borderRadius: 999,
	},
	pulseDotCore: {
		width: 8,
		height: 8,
		borderRadius: 999,
	},

	// Completed check circle
	completedCheck: {
		width: 16,
		height: 16,
		borderRadius: 999,
		alignItems: 'center',
		justifyContent: 'center',
	},
});
