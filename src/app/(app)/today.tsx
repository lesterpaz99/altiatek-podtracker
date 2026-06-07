import { useEffect, useState } from 'react';
import {
	ActivityIndicator,
	FlatList,
	StyleSheet,
	TouchableOpacity,
	View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';
import {
	fetchStatusLines,
	fetchTodayHeader,
	type PodMemberStatus,
	type StatusLine,
} from '@/services/servicenow';

function todayLabel() {
	return new Date().toLocaleDateString('en-US', {
		weekday: 'long',
		month: 'long',
		day: 'numeric',
	});
}

function greet(displayName: string): string {
	const hour = new Date().getHours();
	const first = displayName.split(' ')[0];
	const period = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
	return `Good ${period}, ${first}`;
}

type StateKey = 'open' | 'in_progress' | 'completed';

function resolveState(raw: string): StateKey {
	const s = raw.toLowerCase().replace(/[\s-]+/g, '_');
	if (s.includes('progress') || s === 'wip') return 'in_progress';
	if (s.includes('complet') || s === 'done' || s === 'closed') return 'completed';
	return 'open';
}

// ─── Small reusable pieces ──────────────────────────────────────────────────

function StatePill({ state }: { state: string }) {
	const theme = useTheme();
	if (!state) return null;
	const key = resolveState(state);
	const bg =
		key === 'open' ? theme.stateOpenBg : key === 'in_progress' ? theme.stateWipBg : theme.stateDoneBg;
	const color =
		key === 'open' ? theme.stateOpenText : key === 'in_progress' ? theme.stateWipText : theme.stateDoneText;
	return (
		<View style={[styles.pill, { backgroundColor: bg }]}>
			<ThemedText
				type='caption'
				style={{ color, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 }}
			>
				{state}
			</ThemedText>
		</View>
	);
}

function EffortPill({ percent }: { percent: string }) {
	const theme = useTheme();
	return (
		<View style={[styles.effortPill, { backgroundColor: theme.backgroundSelected }]}>
			<ThemedText type='caption' style={{ color: theme.textSecondary, fontWeight: '700' }}>
				{percent}%
			</ThemedText>
		</View>
	);
}

function FlagBadge({ label }: { label: string }) {
	const theme = useTheme();
	return (
		<View style={[styles.flagBadge, { backgroundColor: theme.flagBg }]}>
			<ThemedText type='caption' style={{ color: theme.flagText, fontWeight: '700' }}>
				{label}
			</ThemedText>
		</View>
	);
}

// ─── Header-area widgets ─────────────────────────────────────────────────────

function StatusChip({ hasToday }: { hasToday: boolean }) {
	const theme = useTheme();
	const bg = hasToday ? theme.okBg : theme.warnBg;
	const color = hasToday ? theme.okText : theme.warnText;
	return (
		<View style={[styles.statusChip, { backgroundColor: bg, borderColor: theme.separator }]}>
			<View style={[styles.statusDot, { backgroundColor: color }]} />
			<ThemedText type='caption' style={{ color, fontWeight: '600' }}>
				{hasToday ? 'Status exists for today' : 'No status yet for today'}
			</ThemedText>
		</View>
	);
}

function IndicatorRow({ lines }: { lines: StatusLine[] }) {
	const theme = useTheme();
	const needsCount = lines.filter(
		(l) => l.u_at_risk === 'true' || l.u_needs_help === 'true' || l.u_blocked === 'true',
	).length;
	const util = lines.reduce((sum, l) => sum + (parseInt(l.u_time_percent, 10) || 0), 0);
	const needsOk = needsCount === 0;
	const utilOk = util <= 100;

	return (
		<View style={styles.indicatorRow}>
			<View
				style={[
					styles.indicatorChip,
					{
						backgroundColor: needsOk ? theme.okBg : theme.dangerSubtle,
						borderColor: theme.separator,
					},
				]}
			>
				<ThemedText
					type='caption'
					style={{ color: needsOk ? theme.okText : theme.danger, fontWeight: '800' }}
				>
					{needsCount}
				</ThemedText>
				<ThemedText type='caption' style={{ color: needsOk ? theme.okText : theme.danger }}>
					{needsCount === 1 ? 'line needs attention' : 'lines need attention'}
				</ThemedText>
			</View>
			<View
				style={[
					styles.indicatorChip,
					{
						backgroundColor: utilOk ? theme.backgroundElement : theme.dangerSubtle,
						borderColor: theme.separator,
					},
				]}
			>
				<ThemedText type='caption' themeColor='textSecondary'>
					Utilization
				</ThemedText>
				<ThemedText
					type='caption'
					style={{ color: utilOk ? theme.textSecondary : theme.danger, fontWeight: '800' }}
				>
					{util}%
				</ThemedText>
			</View>
		</View>
	);
}

function SectionHeader({ count }: { count: number }) {
	const theme = useTheme();
	return (
		<View style={styles.sectionHeader}>
			<ThemedText
				type='caption'
				themeColor='textSecondary'
				style={styles.sectionTitle}
			>
				TODAY'S LINES
			</ThemedText>
			{count > 0 && (
				<View style={[styles.countBadge, { backgroundColor: theme.backgroundSelected }]}>
					<ThemedText
						type='caption'
						style={{ color: theme.textSecondary, fontWeight: '700', fontSize: 11 }}
					>
						{count}
					</ThemedText>
				</View>
			)}
		</View>
	);
}

// ─── Status line card ────────────────────────────────────────────────────────

function StatusLineCard({ item }: { item: StatusLine }) {
	const theme = useTheme();
	const scheme = useColorScheme();
	const isDark = scheme === 'dark';
	const isAtRisk = item.u_at_risk === 'true';
	const needsHelp = item.u_needs_help === 'true';
	const isBlocked = item.u_blocked === 'true';
	const hasFlag = isAtRisk || needsHelp || isBlocked;
	const accentColor = hasFlag ? theme.accentBarDanger : theme.accentBar;

	return (
		// Outer view carries the shadow (no overflow:hidden so shadow isn't clipped on iOS)
		<View
			style={[
				styles.cardOuter,
				{ backgroundColor: theme.backgroundElement },
				isDark
					? { borderWidth: StyleSheet.hairlineWidth, borderColor: theme.separator }
					: styles.cardShadow,
			]}
		>
			{/* Inner view clips the accent bar to the border radius */}
			<View style={[styles.cardInner, { backgroundColor: theme.backgroundElement }]}>
				<View style={[styles.lineHeader, { borderBottomColor: theme.separator }]}>
					<View style={styles.lineTitle}>
						{item.u_state ? <StatePill state={item.u_state} /> : null}
						<ThemedText type='label' style={styles.itemName} numberOfLines={2}>
							{item.u_item_name || item.u_assignment_name || 'Untitled'}
						</ThemedText>
					</View>
					<EffortPill percent={item.u_time_percent} />
				</View>

				<View style={styles.lineBody}>
					{item.u_current_focus ? (
						<View style={styles.kv}>
							<ThemedText type='smallBold'>Focus</ThemedText>
							<ThemedText type='small' themeColor='textSecondary' style={styles.kvText}>
								{item.u_current_focus}
							</ThemedText>
						</View>
					) : null}

					{item.u_notes ? (
						<View style={styles.kv}>
							<ThemedText type='smallBold'>Notes / Next Steps</ThemedText>
							<ThemedText type='small' themeColor='textSecondary' style={styles.kvText}>
								{item.u_notes}
							</ThemedText>
						</View>
					) : null}

					{hasFlag && (
						<View style={styles.flags}>
							{isBlocked && <FlagBadge label='Blocked' />}
							{isAtRisk && <FlagBadge label='At Risk' />}
							{needsHelp && <FlagBadge label='Needs Help' />}
						</View>
					)}
				</View>

				{/* Bottom accent bar — clipped by cardInner's overflow:hidden */}
				<View style={[styles.accentBar, { backgroundColor: accentColor }]} />
			</View>
		</View>
	);
}

// ─── Sign out ────────────────────────────────────────────────────────────────

function SignOutButton() {
	const { signOut } = useAuth();
	const theme = useTheme();
	return (
		<TouchableOpacity
			onPress={signOut}
			hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
			style={[styles.signOutBtn, { borderColor: theme.separator }]}
		>
			<ThemedText type='caption' style={{ color: theme.textSecondary, fontWeight: '600' }}>
				Sign out
			</ThemedText>
		</TouchableOpacity>
	);
}

// ─── Empty lines state ───────────────────────────────────────────────────────

function EmptyLinesCard() {
	const theme = useTheme();
	return (
		<View style={[styles.emptyCard, { borderColor: theme.separator }]}>
			<ThemedText type='small' themeColor='textSecondary' style={styles.emptyText}>
				No status lines yet.
			</ThemedText>
		</View>
	);
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function TodayScreen() {
	const { session, podMember } = useAuth();
	const [header, setHeader] = useState<PodMemberStatus | null>(null);
	const [lines, setLines] = useState<StatusLine[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

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
			.catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)))
			.finally(() => setLoading(false));
	}, [session, podMember]);

	return (
		<ThemedView style={styles.container}>
			<SafeAreaView style={styles.safe}>
				{/* Hero header */}
				<View style={styles.heroRow}>
					<View style={styles.heroLeft}>
						<ThemedText type='title' style={styles.greeting}>
							{podMember ? greet(podMember.displayName) : 'Pod Tracker'}
						</ThemedText>
						<ThemedText type='small' themeColor='textSecondary' style={styles.dateText}>
							{todayLabel()}
						</ThemedText>
						{header && (
							<ThemedText type='caption' themeColor='textSecondary' style={styles.podLine}>
								{header.u_pod.display_value}{'  ·  '}{header.u_number}
							</ThemedText>
						)}
					</View>
					<SignOutButton />
				</View>

				{!loading && <StatusChip hasToday={!!header} />}
				{!loading && header && lines.length > 0 && <IndicatorRow lines={lines} />}

				{loading && <ActivityIndicator style={styles.spinner} />}

				{error !== null && (
					<ThemedText type='small' style={styles.error}>
						{error}
					</ThemedText>
				)}

				{header && (
					<>
						<SectionHeader count={lines.length} />
						<FlatList
							data={lines}
							keyExtractor={(item) => item.sys_id}
							contentContainerStyle={styles.list}
							renderItem={({ item }) => <StatusLineCard item={item} />}
							ListEmptyComponent={loading ? null : <EmptyLinesCard />}
						/>
					</>
				)}
			</SafeAreaView>
		</ThemedView>
	);
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const CARD_RADIUS = 20;

const styles = StyleSheet.create({
	container: { flex: 1 },
	safe: { flex: 1, paddingHorizontal: Spacing.four, paddingTop: Spacing.two },

	// Hero
	heroRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'flex-start',
		paddingTop: Spacing.two,
		marginBottom: Spacing.three,
	},
	heroLeft: { flex: 1, gap: 3 },
	greeting: { letterSpacing: -0.5 },
	dateText: {},
	podLine: { marginTop: 2 },

	// Sign out pill
	signOutBtn: {
		borderWidth: 1,
		borderRadius: 999,
		paddingVertical: 5,
		paddingHorizontal: 11,
		marginTop: 6,
	},

	// Status chip
	statusChip: {
		alignSelf: 'flex-start',
		flexDirection: 'row',
		alignItems: 'center',
		gap: 6,
		borderRadius: 999,
		borderWidth: 1,
		paddingVertical: 5,
		paddingHorizontal: 11,
		marginBottom: Spacing.two,
	},
	statusDot: {
		width: 7,
		height: 7,
		borderRadius: 999,
	},

	// Indicator chips
	indicatorRow: {
		flexDirection: 'row',
		gap: 8,
		alignItems: 'center',
		marginBottom: Spacing.two,
		flexWrap: 'wrap',
	},
	indicatorChip: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 5,
		paddingVertical: 5,
		paddingHorizontal: 11,
		borderRadius: 999,
		borderWidth: 1,
	},

	// Section header (iOS grouped list style)
	sectionHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 7,
		marginBottom: Spacing.two,
		marginTop: Spacing.one,
	},
	sectionTitle: {
		textTransform: 'uppercase',
		letterSpacing: 0.7,
		fontWeight: '700',
	},
	countBadge: {
		borderRadius: 999,
		paddingVertical: 1,
		paddingHorizontal: 7,
		minWidth: 20,
		alignItems: 'center',
	},

	spinner: { marginTop: Spacing.five },
	error: { color: '#FF3B30', marginTop: Spacing.three },
	list: { gap: Spacing.two, paddingBottom: Spacing.four },

	// Card — outer carries shadow, inner clips accent bar
	cardOuter: {
		borderRadius: CARD_RADIUS,
	},
	cardShadow: {
		shadowColor: '#101828',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.07,
		shadowRadius: 12,
		elevation: 3,
	},
	cardInner: {
		borderRadius: CARD_RADIUS,
		overflow: 'hidden',
	},
	lineHeader: {
		paddingHorizontal: Spacing.three,
		paddingTop: Spacing.three,
		paddingBottom: Spacing.two,
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'flex-start',
		gap: Spacing.two,
		borderBottomWidth: StyleSheet.hairlineWidth,
	},
	lineTitle: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		gap: Spacing.two,
		flexWrap: 'wrap',
	},
	itemName: { flex: 1 },
	lineBody: {
		paddingHorizontal: Spacing.three,
		paddingTop: Spacing.two,
		paddingBottom: Spacing.three,
		gap: Spacing.two,
	},
	kv: { gap: 2 },
	kvText: { lineHeight: 20 },
	flags: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: Spacing.one,
		marginTop: 2,
	},

	// Pills
	pill: {
		borderRadius: 999,
		paddingVertical: 2,
		paddingHorizontal: 8,
	},
	effortPill: {
		borderRadius: 999,
		paddingVertical: 3,
		paddingHorizontal: 8,
		flexShrink: 0,
	},
	flagBadge: {
		borderRadius: 999,
		paddingVertical: 2,
		paddingHorizontal: 8,
	},

	// Accent bar (clipped by cardInner overflow:hidden)
	accentBar: {
		height: 6,
		position: 'absolute',
		bottom: 0,
		left: 0,
		right: 0,
	},

	// Empty
	emptyCard: {
		borderRadius: 16,
		borderWidth: StyleSheet.hairlineWidth,
		borderStyle: 'dashed',
		padding: 28,
		alignItems: 'center',
	},
	emptyText: { textAlign: 'center' },
});
