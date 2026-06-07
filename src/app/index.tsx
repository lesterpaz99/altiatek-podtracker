import { Redirect } from 'expo-router';

import { useAuth } from '@/context/auth-context';

export default function Index() {
	const { session, isLoading } = useAuth();

	if (isLoading) return null;

	return <Redirect href={session ? '/(app)/today' : '/(auth)/login'} />;
}
