import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { fetchTodayStatuses, type PodMemberStatus } from '@/services/servicenow';

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function HomeScreen() {
  const [statuses, setStatuses] = useState<PodMemberStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTodayStatuses(todayISO())
      .then(setStatuses)
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : String(e)),
      )
      .finally(() => setLoading(false));
  }, []);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <ThemedText type="title" style={styles.title}>
          Pod Tracker
        </ThemedText>
        <ThemedText type="subtitle" style={styles.date}>
          {todayISO()}
        </ThemedText>

        {loading && <ActivityIndicator style={styles.spinner} />}

        {error && (
          <ThemedText type="small" style={styles.error}>
            {error}
          </ThemedText>
        )}

        {!loading && !error && statuses.length === 0 && (
          <ThemedText type="small" style={styles.empty}>
            No status records for today.
          </ThemedText>
        )}

        <FlatList
          data={statuses}
          keyExtractor={(item) => item.sys_id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <ThemedView type="backgroundElement" style={styles.card}>
              <ThemedText type="smallBold">{item.u_number}</ThemedText>
              <ThemedText type="small">{item.u_pod_member.display_value}</ThemedText>
              <ThemedText type="small" style={styles.pod}>
                {item.u_pod.display_value}
              </ThemedText>
            </ThemedView>
          )}
        />
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
  },
  title: { marginBottom: Spacing.one },
  date: { marginBottom: Spacing.three },
  spinner: { marginTop: Spacing.five },
  error: { color: '#C0392B', marginTop: Spacing.three },
  empty: { marginTop: Spacing.three },
  list: { gap: Spacing.two, paddingBottom: Spacing.four },
  card: {
    borderRadius: Spacing.two,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  pod: { opacity: 0.6 },
});
