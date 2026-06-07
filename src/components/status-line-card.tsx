import { SymbolView } from 'expo-symbols';
import { Platform, StyleSheet, View } from 'react-native';

import { CompletedCheck } from '@/components/completed-check';
import { FlagPill } from '@/components/flag-pill';
import { PulseDot } from '@/components/pulse-dot';
import { ThemedText } from '@/components/themed-text';
import { CardRadius, Spacing } from '@/constants/theme';
import { resolveState } from '@/helpers/status';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';
import { type StatusLine } from '@/services/servicenow';

export function StatusLineCard({
	item,
	podName,
}: {
	item: StatusLine;
	podName?: string;
}) {
	const theme = useTheme();
	const scheme = useColorScheme();
	const isDark = scheme === 'dark';
	const stateKey = resolveState(item.u_state ?? '');
	const isCompleted = stateKey === 'completed';
	const isAtRisk = item.u_at_risk === 'true';
	const needsHelp = item.u_needs_help === 'true';
	const isBlocked = item.u_blocked === 'true';
	const hasFlag = isAtRisk || needsHelp || isBlocked;

	const lineCode = item.u_assignment.display_value || '';

	return (
		<View
			style={[
				styles.card,
				{ backgroundColor: theme.backgroundElement },
				isDark
					? {
							borderWidth: StyleSheet.hairlineWidth,
							borderColor: theme.separator,
						}
					: styles.cardShadow,
				isCompleted && {
					borderWidth: StyleSheet.hairlineWidth,
					borderColor: theme.successSubtle,
					opacity: 0.94,
				},
			]}
		>
			{/* Top row: indicator + status text + code + edit pencil */}
			<View style={[styles.topRow, { borderBottomColor: theme.separator }]}>
				<View style={styles.topLeft}>
					{stateKey === 'completed' ? <CompletedCheck /> : <PulseDot />}
					<ThemedText
						type='caption'
						style={{
							color: isCompleted ? theme.success : theme.textSecondary,
							fontWeight: '500',
						}}
					>
						{isCompleted ? 'Completed' : 'In progress'}
					</ThemedText>
					{lineCode ? (
						<>
							<View
								style={[styles.dotSep, { backgroundColor: theme.textTertiary }]}
							/>
							<ThemedText type='caption' style={{ color: theme.textTertiary }}>
								{lineCode}
							</ThemedText>
						</>
					) : null}
				</View>
				{Platform.OS === 'ios' ? (
					<SymbolView
						name='pencil'
						style={styles.editIcon}
						tintColor={theme.textTertiary}
						resizeMode='scaleAspectFit'
					/>
				) : (
					<ThemedText style={{ color: theme.textTertiary, fontSize: 14 }}>
						✎
					</ThemedText>
				)}
			</View>

			{/* Body: name + effort */}
			<View style={styles.body}>
				<View style={styles.bodyLeft}>
					<ThemedText
						style={[styles.itemName, { color: theme.text }]}
						numberOfLines={2}
					>
						{item.u_item_name || item.u_assignment_name || 'Untitled'}
					</ThemedText>
					{item.u_current_focus ? (
						<ThemedText
							type='small'
							style={{ color: theme.textSecondary }}
							// numberOfLines={2}
						>
							{item.u_current_focus}
						</ThemedText>
					) : (
						<ThemedText type='small' style={{ color: theme.textSecondary }}>
							Add current focus to show here
						</ThemedText>
					)}
				</View>

				<View style={styles.effortBlock}>
					<ThemedText style={[styles.effortNumber, { color: theme.text }]}>
						{parseInt(item.u_time_percent, 10) || 0}
						<ThemedText
							style={[styles.effortPct, { color: theme.textSecondary }]}
						>
							%
						</ThemedText>
					</ThemedText>
					<ThemedText
						type='caption'
						style={[styles.effortCaption, { color: theme.textTertiary }]}
					>
						EFFORT
					</ThemedText>
				</View>
			</View>

			{/* Flag pills */}
			{hasFlag && (
				<View style={styles.flagRow}>
					{isBlocked && <FlagPill type='blocked' />}
					{isAtRisk && <FlagPill type='risk' />}
					{needsHelp && <FlagPill type='help' />}
				</View>
			)}

			{/* Meta row: target date + pod */}
			<View style={[styles.metaRow, { borderTopColor: theme.separator }]}>
				<ThemedText type='caption' style={{ color: theme.textTertiary }}>
					{isCompleted
						? `✓ Done · ${item.u_target_date || '—'}`
						: item.u_target_date || '—'}
				</ThemedText>
				{podName ? (
					<ThemedText type='caption' style={{ color: theme.textTertiary }}>
						⬡ {podName}
					</ThemedText>
				) : null}
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	card: {
		borderRadius: CardRadius,
	},
	cardShadow: {
		shadowColor: '#101828',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.07,
		shadowRadius: 12,
		elevation: 3,
	},
	topRow: {
		paddingHorizontal: Spacing.three,
		paddingVertical: Spacing.two,
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		borderBottomWidth: StyleSheet.hairlineWidth,
	},
	topLeft: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: Spacing.one,
		flex: 1,
	},
	dotSep: {
		width: 3,
		height: 3,
		borderRadius: 999,
		marginHorizontal: 2,
	},
	editIcon: {
		width: 16,
		height: 16,
		marginLeft: Spacing.two,
	},
	body: {
		paddingHorizontal: Spacing.three,
		paddingTop: Spacing.two,
		paddingBottom: Spacing.two,
		flexDirection: 'row',
		gap: Spacing.two,
	},
	bodyLeft: {
		flex: 1,
		gap: 4,
	},
	itemName: {
		fontSize: 17,
		fontWeight: '700',
		letterSpacing: -0.3,
		lineHeight: 22,
	},
	effortBlock: {
		alignItems: 'flex-end',
		justifyContent: 'flex-start',
		flexShrink: 0,
		minWidth: 52,
	},
	effortNumber: {
		fontSize: 22,
		fontWeight: '800',
		lineHeight: 26,
		letterSpacing: -0.5,
	},
	effortPct: {
		fontSize: 14,
		fontWeight: '600',
	},
	effortCaption: {
		textTransform: 'uppercase',
		letterSpacing: 0.7,
		marginTop: 2,
		fontSize: 10,
	},
	flagRow: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: Spacing.one,
		paddingHorizontal: Spacing.three,
		paddingBottom: Spacing.two,
	},
	metaRow: {
		paddingHorizontal: Spacing.three,
		paddingVertical: Spacing.two,
		flexDirection: 'row',
		justifyContent: 'space-between',
		borderTopWidth: StyleSheet.hairlineWidth,
	},
});
