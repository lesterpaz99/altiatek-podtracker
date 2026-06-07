import { Redirect, Stack } from 'expo-router';
import { useAuth } from '@/context/auth-context';

export default function AuthLayout() {
  const { session, isLoading } = useAuth();

  if (isLoading) return null;

  // Already authenticated — send to app; use Redirect (not useEffect) so
  // expo-router handles this synchronously without needing a mounted Stack
  if (session) return <Redirect href='/(app)/today' />;

  return <Stack screenOptions={{ headerShown: false }} />;
}
