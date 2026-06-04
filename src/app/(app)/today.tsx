import { useEffect, useState } from 'react';
import {
	ActivityIndicator,
	FlatList,
	StyleSheet,
	TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/hooks/use-theme';
import {
	fetchTodayStatuses,
	type PodMemberStatus,
} from '@/services/servicenow';

function todayISO() {
	const d = new Date();
	const yyyy = d.getFullYear();
	const mm = String(d.getMonth() + 1).padStart(2, '0');
	const dd = String(d.getDate()).padStart(2, '0');
	return `${yyyy}-${mm}-${dd}`;
}

function todayLabel() {
	return new Date().toLocaleDateString('en-US', {
		weekday: 'long',
		month: 'long',
		day: 'numeric',
	});
}

function StatusCard({ item }: { item: PodMemberStatus }) {
	const theme = useTheme();
	return (
		<ThemedView
			type='backgroundElement'
			style={[styles.card, { borderColor: theme.separator }]}
		>
			<ThemedView type='backgroundElement' style={styles.cardRow}>
				<ThemedText type='label'>{item.u_number}</ThemedText>
				<ThemedText type='caption' themeColor='textSecondary'>
					{item.u_pod.display_value}
				</ThemedText>
			</ThemedView>
			<ThemedText type='small' themeColor='textSecondary'>
				{item.u_pod_member.display_value}
			</ThemedText>
		</ThemedView>
	);
}

function SignOutButton() {
	const { signOut } = useAuth();
	const theme = useTheme();
	return (
		<TouchableOpacity onPress={signOut} hitSlop={12}>
			<ThemedText type='small' style={{ color: theme.accent }}>
				Sign out
			</ThemedText>
		</TouchableOpacity>
	);
}

export default function TodayScreen() {
	const { session, podMember } = useAuth();
	const [statuses, setStatuses] = useState<PodMemberStatus[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!session || !podMember) return;
		fetchTodayStatuses(session.accessToken, podMember.sysId, todayISO())
			.then(setStatuses)
			.catch((e: unknown) =>
				setError(e instanceof Error ? e.message : String(e))
			)
			.finally(() => setLoading(false));
	}, [session, podMember]);

	return (
		<ThemedView style={styles.container}>
			<SafeAreaView style={styles.safe}>
				<ThemedView style={styles.header}>
					<ThemedText type='title'>Pod Tracker</ThemedText>
					<SignOutButton />
				</ThemedView>

				<ThemedText
					type='default'
					themeColor='textSecondary'
					style={styles.date}
				>
					{todayLabel()}
				</ThemedText>

				{loading && <ActivityIndicator style={styles.spinner} />}

				{error !== null && (
					<ThemedText type='small' style={styles.error}>
						{error}
					</ThemedText>
				)}

				{!loading && !error && statuses.length === 0 && (
					<ThemedText
						type='small'
						themeColor='textSecondary'
						style={styles.empty}
					>
						No status records for today.
					</ThemedText>
				)}

				<FlatList
					data={statuses}
					keyExtractor={(item) => item.sys_id}
					contentContainerStyle={styles.list}
					renderItem={({ item }) => <StatusCard item={item} />}
				/>
			</SafeAreaView>
		</ThemedView>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1 },
	safe: { flex: 1, paddingHorizontal: Spacing.four, paddingTop: Spacing.three },
	header: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: Spacing.half,
	},
	date: { marginBottom: Spacing.four },
	spinner: { marginTop: Spacing.five },
	error: { color: '#FF3B30', marginTop: Spacing.three },
	empty: { marginTop: Spacing.three },
	list: { gap: Spacing.two, paddingBottom: Spacing.four },
	card: {
		borderRadius: 12,
		padding: Spacing.three,
		gap: Spacing.one,
		borderWidth: StyleSheet.hairlineWidth,
	},
	cardRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
});
