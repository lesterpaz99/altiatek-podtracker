import { useCallback, useEffect, useState } from 'react';
import {
	ActivityIndicator,
	FlatList,
	StyleSheet,
	TouchableOpacity,
	View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AddStatusLineRow } from '@/components/add-status-line-row';
import { EmptyStatusState } from '@/components/empty-status-state';
import { SectionHeader } from '@/components/section-header';
import { StatusLineCard } from '@/components/status-line-card';
import { StatusLineModal } from '@/components/status-line-modal';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { TodayHeader } from '@/components/today-header';
import { UtilizationCard } from '@/components/utilization-card';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import {
	createTodayHeader,
	fetchStatusLines,
	fetchTodayHeader,
	type PodMemberStatus,
	type StatusLine,
} from '@/services/servicenow';
import { useTheme } from '@/hooks/use-theme';

type ModalState =
	| { open: false }
	| { open: true; mode: 'add' }
	| { open: true; mode: 'edit'; item: StatusLine };

export default function TodayScreen() {
	const { session, podMember } = useAuth();
	const [header, setHeader] = useState<PodMemberStatus | null>(null);
	const [lines, setLines] = useState<StatusLine[]>([]);
	const [loading, setLoading] = useState(true);
	const [starting, setStarting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [modal, setModal] = useState<ModalState>({ open: false });
	const theme = useTheme();

	const needsCount = lines.filter(
		(l) =>
			l.u_at_risk === 'true' ||
			l.u_needs_help === 'true' ||
			l.u_blocked === 'true'
	).length;

	const loadData = useCallback(async () => {
		if (!session || !podMember) return;
		try {
			const hdr = await fetchTodayHeader(session.accessToken, podMember.sysId);
			setHeader(hdr);
			if (hdr) {
				const lns = await fetchStatusLines(session.accessToken, hdr.sys_id);
				setLines(lns);
			}
		} catch (e: unknown) {
			setError(e instanceof Error ? e.message : String(e));
		} finally {
			setLoading(false);
		}
	}, [session, podMember]);

	useEffect(() => {
		loadData();
	}, [loadData]);

	function openAdd() {
		setModal({ open: true, mode: 'add' });
	}

	function openEdit(item: StatusLine) {
		setModal({ open: true, mode: 'edit', item });
	}

	function closeModal() {
		setModal({ open: false });
	}

	function handleModalSuccess() {
		setLoading(true);
		loadData();
	}

	async function handleStartToday() {
		if (!session || !podMember) return;
		setStarting(true);
		setError(null);
		try {
			const hdr = await createTodayHeader(session.accessToken, podMember.sysId);
			setHeader(hdr);
			const lns = await fetchStatusLines(session.accessToken, hdr.sys_id);
			setLines(lns);
		} catch (e: unknown) {
			setError(e instanceof Error ? e.message : String(e));
		} finally {
			setStarting(false);
		}
	}

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

				{!loading && !header && (
					<View style={styles.noHeaderState}>
						<ThemedText style={[styles.noHeaderIcon, { color: theme.textTertiary }]}>
							⬡
						</ThemedText>
						<ThemedText style={[styles.noHeaderTitle, { color: theme.text }]}>
							No status for today yet
						</ThemedText>
						<ThemedText
							type='small'
							style={[styles.noHeaderSubtitle, { color: theme.textSecondary }]}
						>
							Start today's status — yesterday's items will carry over automatically.
						</ThemedText>
						<TouchableOpacity
							style={[
								styles.startBtn,
								{ backgroundColor: theme.accent },
								starting && { opacity: 0.6 },
							]}
							onPress={handleStartToday}
							activeOpacity={0.8}
							disabled={starting}
						>
							{starting ? (
								<ActivityIndicator color={theme.accentForeground} />
							) : (
								<ThemedText
									style={[styles.startBtnLabel, { color: theme.accentForeground }]}
								>
									Start today's status
								</ThemedText>
							)}
						</TouchableOpacity>
					</View>
				)}

				{!loading && header && lines.length > 0 && (
					<UtilizationCard lines={lines} />
				)}

				{header && (
					<>
						<SectionHeader count={lines.length} />
						<AddStatusLineRow onPress={openAdd} />
						<FlatList
							data={lines}
							keyExtractor={(item) => item.sys_id}
							contentContainerStyle={styles.list}
							renderItem={({ item }) => (
								<TouchableOpacity
									onPress={() => openEdit(item)}
									activeOpacity={0.85}
								>
									<StatusLineCard
										item={item}
										podName={header.u_pod.display_value}
									/>
								</TouchableOpacity>
							)}
							ListEmptyComponent={loading ? null : <EmptyStatusState />}
						/>
					</>
				)}
			</SafeAreaView>

			{header && session && (
				<StatusLineModal
					visible={modal.open}
					mode={modal.open ? modal.mode : 'add'}
					item={modal.open && modal.mode === 'edit' ? modal.item : undefined}
					parentSysId={header.sys_id}
					accessToken={session.accessToken}
					onClose={closeModal}
					onSuccess={handleModalSuccess}
				/>
			)}
		</ThemedView>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1 },
	safe: { flex: 1, paddingHorizontal: Spacing.four, paddingTop: Spacing.two },
	spinner: { marginTop: Spacing.five },
	error: { color: '#FF3B30', marginTop: Spacing.three },
	list: { gap: Spacing.two, paddingBottom: Spacing.four, paddingTop: Spacing.two },
	noHeaderState: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		gap: Spacing.one,
		paddingHorizontal: Spacing.five,
	},
	noHeaderIcon: {
		fontSize: 36,
		marginBottom: Spacing.two,
	},
	noHeaderTitle: {
		fontSize: 17,
		fontWeight: '600',
		letterSpacing: -0.2,
	},
	noHeaderSubtitle: {
		textAlign: 'center',
		marginTop: Spacing.one,
	},
	startBtn: {
		marginTop: Spacing.three,
		borderRadius: 999,
		paddingVertical: 14,
		paddingHorizontal: Spacing.five,
		minWidth: 200,
		alignItems: 'center',
	},
	startBtnLabel: {
		fontSize: 16,
		fontWeight: '600',
		letterSpacing: -0.2,
	},
});
