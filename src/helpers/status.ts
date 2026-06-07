export type StateKey = 'open' | 'in_progress' | 'completed';

export function resolveState(raw: string): StateKey {
	const s = raw.toLowerCase().replace(/[\s-]+/g, '_');
	if (s.includes('progress') || s === 'wip') return 'in_progress';
	if (s.includes('complet') || s === 'done' || s === 'closed') return 'completed';
	return 'open';
}
