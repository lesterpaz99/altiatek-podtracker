import { Stack, useRouter } from 'expo-router';
import { useEffect } from 'react';

import { useAuth } from '@/context/auth-context';

export default function AuthLayout() {
  const { session, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (session) router.replace('/(app)/today');
  }, [session, isLoading]);

  return <Stack screenOptions={{ headerShown: false }} />;
}
