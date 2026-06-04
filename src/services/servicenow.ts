import { Config } from './config';

const REQUEST_TIMEOUT_MS = 15000;

async function readErrorBody(res: Response) {
	try {
		return await res.text();
	} catch {
		return '';
	}
}

async function snFetch<T>(
	accessToken: string,
	path: string,
	params: Record<string, string> = {},
): Promise<T> {
	const url = new URL(`${Config.SERVICENOW_BASE_URL}${path}`);
	Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

	try {
		const res = await fetch(url.toString(), {
			headers: {
				Authorization: `Bearer ${accessToken}`,
				Accept: 'application/json',
			},
			signal: controller.signal,
		});

		if (res.status === 401 || res.status === 403) {
			const body = await readErrorBody(res);
			throw new Error(`ServiceNow ${res.status}${body ? ': ' + body : ' — token rejected by Table API'}`);
		}

		if (!res.ok) {
			const body = await readErrorBody(res);
			throw new Error(
				body
					? `ServiceNow ${res.status}: ${body}`
					: `ServiceNow request failed with status ${res.status}.`,
			);
		}

		return res.json() as Promise<T>;
	} catch (error) {
		if (error instanceof Error && error.name === 'AbortError') {
			throw new Error('ServiceNow did not respond. Please try again.');
		}
		throw error;
	} finally {
		clearTimeout(timeout);
	}
}

export type SysUser = {
	sys_id: string;
	name: string;
	email: string;
	user_name: string;
};

export type PodMember = {
	sysId: string;
	podSysId: string;
	teamSysId: string;
	userSysId: string;
	displayName: string;
	email: string;
};

export type PodMemberStatus = {
	sys_id: string;
	u_number: string;
	u_date: string;
	u_pod: { value: string; display_value: string };
	u_pod_member: { value: string; display_value: string };
};

export async function fetchCurrentUser(accessToken: string): Promise<SysUser> {
	const data = await snFetch<{ result: SysUser[] }>(
		accessToken,
		'/api/now/table/sys_user',
		{
			sysparm_query: 'sys_id=javascript:gs.getUserID()',
			sysparm_fields: 'sys_id,name,email,user_name',
			sysparm_limit: '1',
		},
	);
	if (!data.result[0]) throw new Error('Could not resolve current user from ServiceNow.');
	return data.result[0];
}

export async function fetchPodMemberForUser(
	accessToken: string,
	userSysId: string,
): Promise<PodMember> {
	const data = await snFetch<{
		result: Array<{
			sys_id: string;
			u_pod: { value: string };
			u_team: { value: string };
			u_user: { value: string };
			u_display_name: string;
		}>;
	}>(accessToken, '/api/now/table/u_pod_member', {
		sysparm_query: `u_user=${userSysId}`,
		sysparm_fields: 'sys_id,u_pod,u_team,u_user,u_display_name',
		sysparm_display_value: 'true',
		sysparm_limit: '1',
	});
	const r = data.result[0];
	if (!r) throw new Error('No pod member record found for this user.');
	return {
		sysId: r.sys_id,
		podSysId: r.u_pod.value,
		teamSysId: r.u_team.value,
		userSysId: r.u_user.value,
		displayName: r.u_display_name,
		email: '',
	};
}

export async function fetchTodayStatuses(
	accessToken: string,
	podMemberSysId: string,
	date: string,
): Promise<PodMemberStatus[]> {
	const data = await snFetch<{ result: PodMemberStatus[] }>(
		accessToken,
		'/api/now/table/u_pod_member_status',
		{
			sysparm_query: `u_pod_member=${podMemberSysId}^u_date=${date}`,
			sysparm_fields: 'sys_id,u_number,u_date,u_pod,u_pod_member',
			sysparm_display_value: 'true',
			sysparm_limit: '10',
		},
	);
	return data.result;
}
