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
	params: Record<string, string> = {}
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
			throw new Error(
				`ServiceNow ${res.status}${body ? ': ' + body : ' — token rejected by Table API'}`
			);
		}

		if (!res.ok) {
			const body = await readErrorBody(res);
			throw new Error(
				body
					? `ServiceNow ${res.status}: ${body}`
					: `ServiceNow request failed with status ${res.status}.`
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

// u_pod_member on status tables is a direct reference to sys_user, not a custom table
export type PodMember = {
	sysId: string;       // sys_user.sys_id
	displayName: string; // sys_user.name
	email: string;       // sys_user.email
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
		}
	);
	if (!data.result[0])
		throw new Error('Could not resolve current user from ServiceNow.');
	return data.result[0];
}


export type StatusLine = {
	sys_id: string;
	u_item_name: string;
	u_current_focus: string;
	u_state: string;
	u_assignment_type: string;
	u_assignment: { value: string; display_value: string };
	u_no_task: string;
	u_assignment_name: string;
	u_at_risk: string;
	u_needs_help: string;
	u_blocked: string;
	u_target_date: string;
	u_time_percent: string;
	u_notes: string;
};

// Returns the single header record for today, or null if none exists yet
export async function fetchTodayHeader(
	accessToken: string,
	userSysId: string,
): Promise<PodMemberStatus | null> {
	const data = await snFetch<{ result: PodMemberStatus[] }>(
		accessToken,
		'/api/now/table/u_pod_member_status',
		{
			sysparm_query: `u_pod_member=${userSysId}^u_dateONToday@javascript:gs.beginningOfToday()@javascript:gs.endOfToday()`,
			sysparm_fields: 'sys_id,u_number,u_date,u_pod,u_pod_member',
			sysparm_display_value: 'true',
			sysparm_limit: '1',
		}
	);
	return data.result[0] ?? null;
}

export async function fetchStatusLines(
	accessToken: string,
	headerSysId: string,
): Promise<StatusLine[]> {
	const data = await snFetch<{ result: StatusLine[] }>(
		accessToken,
		'/api/now/table/u_pod_status_line',
		{
			sysparm_query: `u_parent=${headerSysId}`,
			sysparm_fields: 'sys_id,u_item_name,u_current_focus,u_state,u_assignment_type,u_assignment,u_no_task,u_assignment_name,u_at_risk,u_needs_help,u_blocked,u_target_date,u_time_percent,u_notes',
			sysparm_display_value: 'true',
			sysparm_limit: '50',
		}
	);
	return data.result;
}
