import { Redirect, Stack } from 'expo-router';
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/hooks/use-theme';

function IdentityErrorScreen() {
  const { authError, signOut } = useAuth();
  const theme = useTheme();
  return (
    <View style={styles.center}>
      <ThemedText type='small' style={styles.error}>
        {authError ?? 'Could not load your pod profile.'}
      </ThemedText>
      <TouchableOpacity onPress={signOut} style={styles.signOutButton}>
        <ThemedText type='label' style={{ color: theme.accent }}>
          Sign out
        </ThemedText>
      </TouchableOpacity>
    </View>
  );
}

export default function AppLayout() {
  const { session, podMember, isLoading, isResolvingIdentity } = useAuth();

  // Covered by AnimatedSplashOverlay while auth restores from secure store
  if (isLoading) return null;

  // No session — send to login; use Redirect (not useEffect) so expo-router
  // sees the intent synchronously regardless of whether a Stack is mounted
  if (!session) return <Redirect href='/(auth)/login' />;

  // Session exists but pod member identity hasn't resolved yet
  if (isResolvingIdentity) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  // Resolution finished but failed (network error, user not in pod, etc.)
  if (!podMember) return <IdentityErrorScreen />;

  return <Stack screenOptions={{ headerShown: false }} />;
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.four },
  error: { color: '#FF3B30', textAlign: 'center', marginBottom: Spacing.three },
  signOutButton: { marginTop: Spacing.two },
});
