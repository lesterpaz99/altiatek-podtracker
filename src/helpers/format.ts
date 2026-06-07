export function todayLabel(): string {
	return new Date().toLocaleDateString('en-US', {
		weekday: 'long',
		month: 'long',
		day: 'numeric',
	});
}

export function greet(displayName: string): string {
	const hour = new Date().getHours();
	const first = displayName.split(' ')[0];
	const period = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
	return `Good ${period},\n${first}`;
}

export function getInitials(displayName: string): string {
	const parts = displayName.trim().split(' ');
	if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
	return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
