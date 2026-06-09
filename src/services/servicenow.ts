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
	sysId: string; // sys_user.sys_id
	displayName: string; // sys_user.name
	email: string; // sys_user.email
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
	userSysId: string
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
	headerSysId: string
): Promise<StatusLine[]> {
	type RawRef = { value: string; display_value: string };
	type RawField = string | number | RawRef;
	type RawLine = Record<string, RawField>;

	const data = await snFetch<{ result: RawLine[] }>(
		accessToken,
		'/api/now/table/u_pod_status_line',
		{
			sysparm_query: `u_parent=${headerSysId}`,
			sysparm_fields:
				'sys_id,u_item_name,u_current_focus,u_state,u_assignment_type,u_assignment,u_no_task,u_assignment_name,u_at_risk,u_needs_help,u_blocked,u_target_date,u_time_percent,u_notes',
			// 'all' returns {value, display_value} objects for every field so that
			// choice fields give internal codes (needed for ChipSelector matching)
			// and reference fields give both sys_id and display name.
			sysparm_display_value: 'all',
			sysparm_limit: '50',
		}
	);

	function str(f: RawField | undefined): string {
		if (f == null) return '';
		if (typeof f === 'object') return String(f.value ?? '');
		return String(f);
	}

	function ref(f: RawField | undefined): { value: string; display_value: string } {
		if (f != null && typeof f === 'object') {
			return { value: String(f.value ?? ''), display_value: String(f.display_value ?? '') };
		}
		const s = f != null ? String(f) : '';
		return { value: s, display_value: s };
	}

	return data.result.map((r) => ({
		sys_id: str(r.sys_id),
		u_item_name: str(r.u_item_name),
		u_current_focus: str(r.u_current_focus),
		u_state: str(r.u_state),
		u_assignment_type: str(r.u_assignment_type),
		u_assignment: ref(r.u_assignment),
		u_no_task: str(r.u_no_task),
		u_assignment_name: str(r.u_assignment_name),
		u_at_risk: str(r.u_at_risk),
		u_needs_help: str(r.u_needs_help),
		u_blocked: str(r.u_blocked),
		u_target_date: str(r.u_target_date),
		u_time_percent: str(r.u_time_percent),
		u_notes: str(r.u_notes),
	}));
}

export type TaskResult = {
	sys_id: string;
	number: string;
	short_description: string;
	sys_class_name: string;
};

export async function searchTasks(
	accessToken: string,
	query: string
): Promise<TaskResult[]> {
	const data = await snFetch<{ result: TaskResult[] }>(
		accessToken,
		'/api/now/table/task',
		{
			sysparm_query: `numberLIKE${query}^ORshort_descriptionLIKE${query}^active=true`,
			sysparm_fields: 'sys_id,number,short_description,sys_class_name',
			sysparm_limit: '20',
		}
	);
	return data.result;
}

export type CreateStatusLineBody = {
	u_parent: string;
	u_no_task: boolean;
	u_assignment?: string;
	u_assignment_name?: string;
	u_current_focus: string;
	u_item_name: string;
	u_assignment_type: string;
	u_state: string;
	u_at_risk: boolean;
	u_needs_help: boolean;
	u_blocked: boolean;
	u_target_date: string;
	u_time_percent: number;
	u_notes: string;
};

export async function createTodayHeader(
	accessToken: string,
	podMemberSysId: string
): Promise<PodMemberStatus> {
	const today = new Date().toISOString().split('T')[0];
	const url = new URL(
		`${Config.SERVICENOW_BASE_URL}/api/now/table/u_pod_member_status`
	);
	url.searchParams.set('sysparm_display_value', 'true');

	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

	try {
		const res = await fetch(url.toString(), {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${accessToken}`,
				Accept: 'application/json',
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ u_pod_member: podMemberSysId, u_date: today }),
			signal: controller.signal,
		});

		if (!res.ok) {
			const text = await readErrorBody(res);
			throw new Error(
				text
					? `ServiceNow ${res.status}: ${text}`
					: `ServiceNow request failed with status ${res.status}.`
			);
		}

		const data = (await res.json()) as { result: PodMemberStatus };
		return data.result;
	} catch (error) {
		if (error instanceof Error && error.name === 'AbortError') {
			throw new Error('ServiceNow did not respond. Please try again.');
		}
		throw error;
	} finally {
		clearTimeout(timeout);
	}
}

export type UpdateStatusLineBody = {
	u_no_task: boolean;
	u_assignment?: string;
	u_assignment_name?: string;
	u_current_focus: string;
	u_item_name: string;
	u_assignment_type: string;
	u_state: string;
	u_at_risk: boolean;
	u_needs_help: boolean;
	u_blocked: boolean;
	u_target_date: string;
	u_time_percent: number;
	u_notes: string;
};

export async function updateStatusLine(
	accessToken: string,
	sysId: string,
	body: UpdateStatusLineBody
): Promise<StatusLine> {
	const url = new URL(
		`${Config.SERVICENOW_BASE_URL}/api/now/table/u_pod_status_line/${sysId}`
	);

	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

	try {
		const res = await fetch(url.toString(), {
			method: 'PATCH',
			headers: {
				Authorization: `Bearer ${accessToken}`,
				Accept: 'application/json',
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(body),
			signal: controller.signal,
		});

		if (!res.ok) {
			const text = await readErrorBody(res);
			throw new Error(
				text
					? `ServiceNow ${res.status}: ${text}`
					: `ServiceNow request failed with status ${res.status}.`
			);
		}

		const data = (await res.json()) as { result: StatusLine };
		return data.result;
	} catch (error) {
		if (error instanceof Error && error.name === 'AbortError') {
			throw new Error('ServiceNow did not respond. Please try again.');
		}
		throw error;
	} finally {
		clearTimeout(timeout);
	}
}

export async function createStatusLine(
	accessToken: string,
	body: CreateStatusLineBody
): Promise<StatusLine> {
	const url = new URL(
		`${Config.SERVICENOW_BASE_URL}/api/now/table/u_pod_status_line`
	);

	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

	try {
		const res = await fetch(url.toString(), {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${accessToken}`,
				Accept: 'application/json',
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(body),
			signal: controller.signal,
		});

		if (!res.ok) {
			const text = await readErrorBody(res);
			throw new Error(
				text
					? `ServiceNow ${res.status}: ${text}`
					: `ServiceNow request failed with status ${res.status}.`
			);
		}

		const data = (await res.json()) as { result: StatusLine };
		return data.result;
	} catch (error) {
		if (error instanceof Error && error.name === 'AbortError') {
			throw new Error('ServiceNow did not respond. Please try again.');
		}
		throw error;
	} finally {
		clearTimeout(timeout);
	}
}
