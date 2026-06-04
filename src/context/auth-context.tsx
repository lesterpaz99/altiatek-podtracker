import {
	exchangeCodeAsync,
	makeRedirectUri,
	useAuthRequest,
} from 'expo-auth-session';
import * as SecureStore from 'expo-secure-store';
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useState,
	type ReactNode,
} from 'react';

import { Config } from '@/services/config';
import {
	fetchCurrentUser,
	fetchPodMemberForUser,
	type PodMember,
} from '@/services/servicenow';

export type { PodMember };

const DISCOVERY = {
	authorizationEndpoint: `${Config.SERVICENOW_BASE_URL}/oauth_auth.do`,
	tokenEndpoint: `${Config.SERVICENOW_BASE_URL}/oauth_token.do`,
} as const;

const REDIRECT_URI = makeRedirectUri({
	scheme: 'com.podtracker.snapp',
	path: 'oauth-callback',
});

const KEYS = {
	ACCESS_TOKEN: 'sn_access_token',
	REFRESH_TOKEN: 'sn_refresh_token',
	EXPIRES_AT: 'sn_expires_at',
} as const;

export type Session = {
	accessToken: string;
	refreshToken?: string;
	expiresAt?: number;
};

type AuthContextValue = {
	session: Session | null;
	podMember: PodMember | null;
	isLoading: boolean;
	isResolvingIdentity: boolean;
	authError: string | null;
	startOAuth: () => void;
	signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
	const [session, setSession] = useState<Session | null>(null);
	const [podMember, setPodMember] = useState<PodMember | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isResolvingIdentity, setIsResolvingIdentity] = useState(false);
	const [authError, setAuthError] = useState<string | null>(null);

	const [request, response, promptAsync] = useAuthRequest(
		{
			clientId: Config.SN_OAUTH_CLIENT_ID,
			redirectUri: REDIRECT_URI,
			scopes: ['useraccount'],
			usePKCE: true,
		},
		DISCOVERY,
	);

	// Restore stored session on cold start
	useEffect(() => {
		async function restore() {
			try {
				const accessToken = await SecureStore.getItemAsync(KEYS.ACCESS_TOKEN);
				const refreshToken = await SecureStore.getItemAsync(KEYS.REFRESH_TOKEN);
				const expiresAtStr = await SecureStore.getItemAsync(KEYS.EXPIRES_AT);
				if (accessToken) {
					setSession({
						accessToken,
						refreshToken: refreshToken ?? undefined,
						expiresAt: expiresAtStr ? parseInt(expiresAtStr, 10) : undefined,
					});
				}
			} finally {
				setIsLoading(false);
			}
		}
		restore();
	}, []);

	// Exchange auth code for tokens after browser redirect
	useEffect(() => {
		if (!response) return;

		if (response.type === 'error') {
			setAuthError(response.error?.message ?? 'Authentication failed. Please try again.');
			return;
		}

		if (response.type !== 'success') return; // 'cancel' — user dismissed browser

		const { code } = response.params;
		if (!code || !request?.codeVerifier) return;

		setAuthError(null);

		exchangeCodeAsync(
			{
				clientId: Config.SN_OAUTH_CLIENT_ID,
				redirectUri: REDIRECT_URI,
				code,
				extraParams: { code_verifier: request.codeVerifier },
			},
			{ tokenEndpoint: DISCOVERY.tokenEndpoint },
		)
			.then(async (tokenResponse) => {
				const { accessToken, refreshToken, expiresIn } = tokenResponse;
				const expiresAt = expiresIn ? Date.now() + expiresIn * 1000 : undefined;

				await SecureStore.setItemAsync(KEYS.ACCESS_TOKEN, accessToken);
				if (refreshToken) {
					await SecureStore.setItemAsync(KEYS.REFRESH_TOKEN, refreshToken);
				}
				if (expiresAt) {
					await SecureStore.setItemAsync(KEYS.EXPIRES_AT, String(expiresAt));
				}

				setSession({
					accessToken,
					refreshToken: refreshToken ?? undefined,
					expiresAt,
				});
			})
			.catch((e: unknown) => {
				setAuthError(
					e instanceof Error ? e.message : 'Token exchange failed. Please try again.',
				);
			});
	}, [response, request]);

	// Resolve identity whenever a session is established (fresh login or cold-start restore)
	useEffect(() => {
		if (!session) {
			setPodMember(null);
			return;
		}
		if (podMember) return; // already resolved for this session
		setIsResolvingIdentity(true);
		fetchCurrentUser(session.accessToken)
			.then((user) => fetchPodMemberForUser(session.accessToken, user.sys_id).then((pm) => ({ user, pm })))
			.then(({ user, pm }) => setPodMember({ ...pm, email: user.email }))
			.catch((e: unknown) =>
				setAuthError(e instanceof Error ? e.message : 'Could not load your pod profile.')
			)
			.finally(() => setIsResolvingIdentity(false));
	}, [session]);

	const startOAuth = useCallback(() => {
		setAuthError(null);
		promptAsync();
	}, [promptAsync]);

	async function signOut() {
		await SecureStore.deleteItemAsync(KEYS.ACCESS_TOKEN);
		await SecureStore.deleteItemAsync(KEYS.REFRESH_TOKEN);
		await SecureStore.deleteItemAsync(KEYS.EXPIRES_AT);
		setSession(null);
		setPodMember(null);
	}

	return (
		<AuthContext.Provider value={{ session, podMember, isLoading, isResolvingIdentity, authError, startOAuth, signOut }}>
			{children}
		</AuthContext.Provider>
	);
}

export function useAuth() {
	const ctx = useContext(AuthContext);
	if (!ctx) throw new Error('useAuth must be used within AuthProvider');
	return ctx;
}
