import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { CardRadius, Spacing } from '@/constants/theme';
import { resolveState } from '@/helpers/status';
import { useTheme } from '@/hooks/use-theme';
import { type StatusLine } from '@/services/servicenow';

export function UtilizationCard({ lines }: { lines: StatusLine[] }) {
	const theme = useTheme();
	const activeLines = lines.filter(
		(l) => resolveState(l.u_state ?? '') !== 'completed'
	);
	const util = activeLines.reduce(
		(sum, l) => sum + (parseInt(l.u_time_percent, 10) || 0),
		0
	);
	const isOver = util > 100;
	const barFill = Math.min(util, 100);

	return (
		<View style={[styles.card, { backgroundColor: theme.text }]}>
			<View style={styles.left}>
				<View style={styles.topRow}>
					<ThemedText style={[styles.number, { color: theme.background }]}>
						{util}%
					</ThemedText>
					{isOver && (
						<View
							style={[styles.overPill, { backgroundColor: theme.dangerSubtle }]}
						>
							<ThemedText
								type='caption'
								style={{ color: theme.danger, fontWeight: '700' }}
							>
								Over-allocated
							</ThemedText>
						</View>
					)}
				</View>
				<ThemedText
					type='small'
					style={{ color: theme.backgroundTop, marginTop: 2 }}
				>
					Utilization across {activeLines.length} active{' '}
					{activeLines.length === 1 ? 'line' : 'lines'}
				</ThemedText>
			</View>

			<View style={styles.right}>
				<View
					style={[
						styles.meterTrack,
						{ backgroundColor: theme.backgroundElement },
					]}
				>
					<View
						style={[
							styles.meterFill,
							{
								width: `${barFill}%` as unknown as number,
								backgroundColor: isOver ? theme.danger : theme.accent,
							},
						]}
					/>
				</View>
				<ThemedText
					type='caption'
					style={{ color: theme.backgroundElement, marginTop: 4 }}
				>
					cap 100%
				</ThemedText>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	card: {
		borderRadius: CardRadius,
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: Spacing.three,
		paddingVertical: Spacing.three,
		marginBottom: Spacing.three,
		gap: Spacing.three,
	},
	left: { flex: 1 },
	topRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: Spacing.two,
	},
	number: {
		fontSize: 30,
		fontWeight: '800',
		letterSpacing: -1,
		lineHeight: 38,
		includeFontPadding: false,
	},
	overPill: {
		borderRadius: 999,
		paddingVertical: 3,
		paddingHorizontal: 9,
	},
	right: {
		width: 70,
		alignItems: 'flex-end',
	},
	meterTrack: {
		width: 70,
		height: 8,
		borderRadius: 999,
		overflow: 'hidden',
	},
	meterFill: {
		height: 8,
		borderRadius: 999,
	},
});
