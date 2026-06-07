import { useEffect, useState } from 'react';
import {
	ActivityIndicator,
	FlatList,
	StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AddStatusLineRow } from '@/components/add-status-line-row';
import { EmptyStatusState } from '@/components/empty-status-state';
import { SectionHeader } from '@/components/section-header';
import { StatusLineCard } from '@/components/status-line-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { TodayHeader } from '@/components/today-header';
import { UtilizationCard } from '@/components/utilization-card';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import {
	fetchStatusLines,
	fetchTodayHeader,
	type PodMemberStatus,
	type StatusLine,
} from '@/services/servicenow';

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

				{!loading && header && lines.length > 0 && (
					<UtilizationCard lines={lines} />
				)}

				{header && (
					<>
						<SectionHeader count={lines.length} />
						<AddStatusLineRow
							onPress={() => { /* navigate to add-status-line */ }}
						/>
						<FlatList
							data={lines}
							keyExtractor={(item) => item.sys_id}
							contentContainerStyle={styles.list}
							renderItem={({ item }) => (
								<StatusLineCard
									item={item}
									podName={header.u_pod.display_value}
								/>
							)}
							ListEmptyComponent={loading ? null : <EmptyStatusState />}
						/>
					</>
				)}
			</SafeAreaView>
		</ThemedView>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1 },
	safe: { flex: 1, paddingHorizontal: Spacing.four, paddingTop: Spacing.two },
	spinner: { marginTop: Spacing.five },
	error: { color: '#FF3B30', marginTop: Spacing.three },
	list: { gap: Spacing.two, paddingBottom: Spacing.four, paddingTop: Spacing.two },
});
