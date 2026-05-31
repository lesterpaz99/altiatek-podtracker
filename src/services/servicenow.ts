import { Config } from './config';

function basicAuth() {
  return btoa(`${Config.SN_USERNAME}:${Config.SN_PASSWORD}`);
}

async function snFetch<T>(
  path: string,
  params: Record<string, string> = {},
): Promise<T> {
  const url = new URL(`${Config.SERVICENOW_BASE_URL}${path}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Basic ${basicAuth()}`,
      Accept: 'application/json',
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`ServiceNow ${res.status}: ${body}`);
  }

  return res.json() as Promise<T>;
}

export type PodMemberStatus = {
  sys_id: string;
  u_number: string;
  u_date: string;
  u_pod: { value: string; display_value: string };
  u_pod_member: { value: string; display_value: string };
};

export async function fetchTodayStatuses(date: string): Promise<PodMemberStatus[]> {
  const data = await snFetch<{ result: PodMemberStatus[] }>(
    '/api/now/table/u_pod_member_status',
    {
      sysparm_query: `u_date=${date}`,
      sysparm_fields: 'sys_id,u_number,u_date,u_pod,u_pod_member',
      sysparm_display_value: 'true',
      sysparm_limit: '10',
    },
  );
  return data.result;
}
