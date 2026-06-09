import DateTimePicker from '@expo/ui/community/datetime-picker';
import { SymbolView } from 'expo-symbols';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
	ActivityIndicator,
	FlatList,
	KeyboardAvoidingView,
	Modal,
	Platform,
	Pressable,
	ScrollView,
	StyleSheet,
	Switch,
	TextInput,
	TouchableOpacity,
	useWindowDimensions,
	View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { CardRadius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
	createStatusLine,
	updateStatusLine,
	searchTasks,
	type StatusLine,
	type TaskResult,
} from '@/services/servicenow';
import { GlassView } from 'expo-glass-effect';

// ─── Choice constants ────────────────────────────────────────────────────────
// Update values once ServiceNow choices are confirmed (SPEC §11c).

const ASSIGNMENT_TYPE_OPTIONS = [
	{ label: 'Customer Project', value: 'customer_project' },
	{ label: 'Managed Services', value: 'managed_services' },
	{ label: 'Shadowing', value: 'shadowing' },
	{ label: 'Internal Project', value: 'internal_project' },
	{ label: 'Training', value: 'training' },
	{ label: 'Presales activities', value: 'presales' },
];

const STATE_OPTIONS = [
	{ label: 'Planned', value: 'planned' },
	{ label: 'In progress', value: 'in_progress' },
	{ label: 'Completed', value: 'completed' },
];

const EFFORT_OPTIONS = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((n) => ({
	label: `${n}%`,
	value: String(n),
}));

// ─── Types ───────────────────────────────────────────────────────────────────

type FormState = {
	noTask: boolean;
	taskSysId: string;
	taskLabel: string;
	assignmentName: string;
	currentFocus: string;
	itemName: string;
	assignmentType: string;
	state: string;
	atRisk: boolean;
	needsHelp: boolean;
	blocked: boolean;
	targetDate: string;
	timePercent: string;
	notes: string;
};

const EMPTY_FORM: FormState = {
	noTask: false,
	taskSysId: '',
	taskLabel: '',
	assignmentName: '',
	currentFocus: '',
	itemName: '',
	assignmentType: '',
	state: 'open',
	atRisk: false,
	needsHelp: false,
	blocked: false,
	targetDate: '',
	timePercent: '',
	notes: '',
};

function formFromItem(item: StatusLine): FormState {
	return {
		noTask: item.u_no_task === 'true',
		taskSysId:
			item.u_no_task === 'true' ? '' : (item.u_assignment?.value ?? ''),
		taskLabel:
			item.u_no_task === 'true' ? '' : (item.u_assignment?.display_value ?? ''),
		assignmentName: item.u_assignment_name ?? '',
		currentFocus: item.u_current_focus ?? '',
		itemName: item.u_item_name ?? '',
		assignmentType: item.u_assignment_type ?? '',
		state: item.u_state ?? 'open',
		atRisk: item.u_at_risk === 'true',
		needsHelp: item.u_needs_help === 'true',
		blocked: item.u_blocked === 'true',
		targetDate: item.u_target_date ?? '',
		timePercent: item.u_time_percent ?? '',
		notes: item.u_notes ?? '',
	};
}

// ─── Props ───────────────────────────────────────────────────────────────────

type StatusLineModalProps = {
	visible: boolean;
	mode: 'add' | 'edit';
	item?: StatusLine;
	parentSysId: string;
	accessToken: string;
	onClose: () => void;
	onSuccess: () => void;
};

// ─── Sub-components ──────────────────────────────────────────────────────────

function FieldLabel({
	label,
	required,
}: {
	label: string;
	required?: boolean;
}) {
	const theme = useTheme();
	return (
		<View style={styles.fieldLabelRow}>
			<ThemedText style={[styles.fieldLabel, { color: theme.text }]}>
				{label}
			</ThemedText>
			{required && (
				<ThemedText style={[styles.requiredDot, { color: theme.danger }]}>
					{' '}
					*
				</ThemedText>
			)}
		</View>
	);
}

function ChipSelector({
	options,
	value,
	onChange,
}: {
	options: { label: string; value: string }[];
	value: string;
	onChange: (v: string) => void;
}) {
	const theme = useTheme();
	return (
		<ScrollView
			horizontal
			showsHorizontalScrollIndicator={false}
			contentContainerStyle={styles.chipRow}
		>
			{options.map((opt) => {
				const selected = opt.value === value;
				return (
					<TouchableOpacity
						key={opt.value}
						onPress={() => onChange(opt.value)}
						style={[
							styles.chip,
							{
								backgroundColor: selected
									? theme.accent
									: theme.backgroundSelected,
								borderColor: selected ? theme.accent : theme.fieldBorder,
							},
						]}
						activeOpacity={0.75}
					>
						<ThemedText
							style={[
								styles.chipLabel,
								{
									color: selected
										? theme.accentForeground
										: theme.textSecondary,
								},
							]}
						>
							{opt.label}
						</ThemedText>
					</TouchableOpacity>
				);
			})}
		</ScrollView>
	);
}

function FlagToggleRow({
	label,
	value,
	onChange,
}: {
	label: string;
	value: boolean;
	onChange: (v: boolean) => void;
}) {
	const theme = useTheme();
	return (
		<View style={[styles.flagRow, { borderBottomColor: theme.separator }]}>
			<ThemedText style={[styles.flagLabel, { color: theme.text }]}>
				{label}
			</ThemedText>
			<Switch
				value={value}
				onValueChange={onChange}
				trackColor={{ false: theme.backgroundSelected, true: theme.accentSoft }}
				thumbColor={value ? theme.accent : theme.textTertiary}
			/>
		</View>
	);
}

// ─── Date picker field ───────────────────────────────────────────────────────

function DatePickerField({
	value,
	onChange,
}: {
	value: string;
	onChange: (dateStr: string) => void;
}) {
	const theme = useTheme();
	const [showPicker, setShowPicker] = useState(false);

	const parsedDate = value ? new Date(value + 'T12:00:00') : new Date();

	function toDateStr(date: Date) {
		const y = date.getFullYear();
		const m = String(date.getMonth() + 1).padStart(2, '0');
		const d = String(date.getDate()).padStart(2, '0');
		return `${y}-${m}-${d}`;
	}

	const trigger = (
		<TouchableOpacity
			style={[
				styles.dateField,
				{
					backgroundColor: theme.backgroundElement,
					borderColor: showPicker ? theme.accent : theme.fieldBorder,
				},
			]}
			onPress={() => setShowPicker(true)}
			activeOpacity={0.7}
		>
			<ThemedText
				style={[
					styles.dateFieldText,
					{ color: value ? theme.text : theme.textTertiary },
				]}
			>
				{value || 'Select a date'}
			</ThemedText>
			{Platform.OS === 'ios' ? (
				<SymbolView
					name='calendar'
					style={styles.calendarIcon}
					tintColor={value ? theme.accent : theme.textTertiary}
					resizeMode='scaleAspectFit'
				/>
			) : (
				<ThemedText
					style={{
						color: value ? theme.accent : theme.textTertiary,
						fontSize: 16,
					}}
				>
					📅
				</ThemedText>
			)}
		</TouchableOpacity>
	);

	if (Platform.OS === 'android') {
		return (
			<View>
				{trigger}
				{showPicker && (
					<DateTimePicker
						value={parsedDate}
						mode='date'
						onValueChange={(_event, date) => {
							onChange(toDateStr(date));
							setShowPicker(false);
						}}
						onDismiss={() => setShowPicker(false)}
						accentColor={theme.accent}
					/>
				)}
			</View>
		);
	}

	return (
		<View>
			{trigger}
			<Modal
				visible={showPicker}
				transparent
				animationType='fade'
				onRequestClose={() => setShowPicker(false)}
			>
				<Pressable
					style={styles.datePickerBackdrop}
					onPress={() => setShowPicker(false)}
				/>
				<View style={styles.datePickerOverlay}>
					<GlassView style={styles.datePickerCard} glassEffectStyle='regular'>
						<DateTimePicker
							value={parsedDate}
							mode='date'
							display='inline'
							onValueChange={(_event, date) => onChange(toDateStr(date))}
							accentColor={theme.accent}
						/>
						<TouchableOpacity
							style={[
								styles.datePickerDoneBtn,
								{ borderTopColor: theme.separator },
							]}
							onPress={() => setShowPicker(false)}
						>
							<ThemedText
								style={{ color: theme.accent, fontSize: 16, fontWeight: '600' }}
							>
								Done
							</ThemedText>
						</TouchableOpacity>
					</GlassView>
				</View>
			</Modal>
		</View>
	);
}

// ─── Task picker ─────────────────────────────────────────────────────────────

function TaskPicker({
	accessToken,
	taskSysId,
	taskLabel,
	onSelect,
	onClear,
}: {
	accessToken: string;
	taskSysId: string;
	taskLabel: string;
	onSelect: (sysId: string, label: string) => void;
	onClear: () => void;
}) {
	const theme = useTheme();
	const [query, setQuery] = useState('');
	const [results, setResults] = useState<TaskResult[]>([]);
	const [searching, setSearching] = useState(false);
	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const abortRef = useRef<AbortController | null>(null);

	const runSearch = useCallback(
		(q: string) => {
			if (debounceRef.current) clearTimeout(debounceRef.current);
			if (q.length < 2) {
				setResults([]);
				return;
			}
			debounceRef.current = setTimeout(async () => {
				abortRef.current?.abort();
				abortRef.current = new AbortController();
				setSearching(true);
				try {
					const found = await searchTasks(accessToken, q);
					setResults(found);
				} catch {
					setResults([]);
				} finally {
					setSearching(false);
				}
			}, 400);
		},
		[accessToken]
	);

	useEffect(() => {
		runSearch(query);
		return () => {
			if (debounceRef.current) clearTimeout(debounceRef.current);
		};
	}, [query, runSearch]);

	if (taskSysId) {
		return (
			<View
				style={[
					styles.selectedTask,
					{ backgroundColor: theme.accentSoft, borderColor: theme.accent },
				]}
			>
				<ThemedText
					style={[styles.selectedTaskText, { color: theme.accent }]}
					numberOfLines={1}
				>
					{taskLabel}
				</ThemedText>
				<TouchableOpacity onPress={onClear} hitSlop={8}>
					{Platform.OS === 'ios' ? (
						<SymbolView
							name='xmark'
							style={styles.clearIcon}
							tintColor={theme.accent}
							resizeMode='scaleAspectFit'
						/>
					) : (
						<ThemedText style={{ color: theme.accent, fontSize: 14 }}>
							✕
						</ThemedText>
					)}
				</TouchableOpacity>
			</View>
		);
	}

	return (
		<View>
			<View
				style={[
					styles.searchRow,
					{
						backgroundColor: theme.backgroundElement,
						borderColor: theme.fieldBorder,
					},
				]}
			>
				{Platform.OS === 'ios' ? (
					<SymbolView
						name='magnifyingglass'
						style={styles.searchIcon}
						tintColor={theme.textTertiary}
						resizeMode='scaleAspectFit'
					/>
				) : (
					<ThemedText style={{ color: theme.textTertiary, marginRight: 6 }}>
						⌕
					</ThemedText>
				)}
				<TextInput
					style={[styles.searchInput, { color: theme.text }]}
					placeholder='Search task…'
					placeholderTextColor={theme.textTertiary}
					value={query}
					onChangeText={setQuery}
					returnKeyType='search'
					autoCorrect={false}
				/>
				{searching && (
					<ActivityIndicator size='small' color={theme.textTertiary} />
				)}
			</View>

			{results.length > 0 && (
				<View
					style={[
						styles.resultsList,
						{
							backgroundColor: theme.backgroundElement,
							borderColor: theme.fieldBorder,
						},
					]}
				>
					<FlatList
						data={results}
						keyExtractor={(t) => t.sys_id}
						scrollEnabled={false}
						ItemSeparatorComponent={() => (
							<View
								style={[styles.resultSep, { backgroundColor: theme.separator }]}
							/>
						)}
						renderItem={({ item: task }) => (
							<TouchableOpacity
								style={styles.resultRow}
								onPress={() => {
									onSelect(
										task.sys_id,
										`${task.number} — ${task.short_description}`
									);
									setQuery('');
									setResults([]);
								}}
								activeOpacity={0.7}
							>
								<ThemedText
									style={[styles.resultNumber, { color: theme.accent }]}
								>
									{task.number}
								</ThemedText>
								<ThemedText
									style={[styles.resultDesc, { color: theme.textSecondary }]}
									numberOfLines={1}
								>
									{task.short_description}
								</ThemedText>
							</TouchableOpacity>
						)}
					/>
				</View>
			)}
		</View>
	);
}

// ─── Main modal ──────────────────────────────────────────────────────────────

export function StatusLineModal({
	visible,
	mode,
	item,
	parentSysId,
	accessToken,
	onClose,
	onSuccess,
}: StatusLineModalProps) {
	const theme = useTheme();
	const { height: screenHeight } = useWindowDimensions();

	const [form, setForm] = useState<FormState>(EMPTY_FORM);
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (visible) {
			setForm(mode === 'edit' && item ? formFromItem(item) : EMPTY_FORM);
			setError(null);
		}
	}, [visible, mode, item]);

	const set = useCallback(
		<K extends keyof FormState>(key: K, value: FormState[K]) => {
			setForm((prev) => ({ ...prev, [key]: value }));
		},
		[]
	);

	const isValid =
		form.currentFocus.trim() !== '' &&
		form.itemName.trim() !== '' &&
		form.targetDate.trim() !== '' &&
		form.timePercent.trim() !== '' &&
		form.notes.trim() !== '' &&
		(form.noTask ? form.assignmentName.trim() !== '' : form.taskSysId !== '');

	async function handleSubmit() {
		if (!isValid || submitting) return;
		setSubmitting(true);
		setError(null);

		const lineFields = {
			u_no_task: form.noTask,
			...(form.noTask
				? { u_assignment_name: form.assignmentName }
				: { u_assignment: form.taskSysId }),
			u_current_focus: form.currentFocus,
			u_item_name: form.itemName,
			u_assignment_type: form.assignmentType,
			u_state: form.state,
			u_at_risk: form.atRisk,
			u_needs_help: form.needsHelp,
			u_blocked: form.blocked,
			u_target_date: form.targetDate,
			u_time_percent: parseInt(form.timePercent, 10),
			u_notes: form.notes,
		};

		try {
			if (mode === 'edit' && item) {
				await updateStatusLine(accessToken, item.sys_id, lineFields);
			} else {
				await createStatusLine(accessToken, { u_parent: parentSysId, ...lineFields });
			}
			onSuccess();
			onClose();
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Something went wrong.');
		} finally {
			setSubmitting(false);
		}
	}

	const title = mode === 'edit' ? 'Edit status line' : 'Add status line';
	const submitLabel = mode === 'edit' ? 'Save changes' : 'Add line';

	return (
		<Modal
			visible={visible}
			animationType='slide'
			transparent
			onRequestClose={onClose}
		>
			<Pressable style={styles.backdrop} onPress={onClose} />

			<KeyboardAvoidingView
				behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
				style={styles.sheetWrapper}
				keyboardVerticalOffset={0}
			>
				<View
					style={[
						styles.sheet,
						{
							backgroundColor: theme.backgroundElement,
							height: screenHeight * 0.88,
						},
					]}
				>
					{/* Grab handle */}
					<View style={styles.handleWrap}>
						<View
							style={[styles.handle, { backgroundColor: theme.textTertiary }]}
						/>
					</View>

					{/* Header */}
					<View
						style={[styles.sheetHeader, { borderBottomColor: theme.separator }]}
					>
						<ThemedText style={[styles.sheetTitle, { color: theme.text }]}>
							{title}
						</ThemedText>

						<View style={styles.headerActions}>
							{/* Voice placeholder — future feature */}
							<TouchableOpacity
								style={[styles.voiceBtn, { backgroundColor: theme.accentSoft }]}
								activeOpacity={0.8}
							>
								{Platform.OS === 'ios' ? (
									<SymbolView
										name='mic.fill'
										style={styles.voiceIcon}
										tintColor={theme.accent}
										resizeMode='scaleAspectFit'
									/>
								) : (
									<ThemedText style={{ color: theme.accent, fontSize: 13 }}>
										🎤
									</ThemedText>
								)}
								<ThemedText
									style={[styles.voiceBtnLabel, { color: theme.accent }]}
								>
									Voice
								</ThemedText>
							</TouchableOpacity>

							<TouchableOpacity
								onPress={onClose}
								style={[
									styles.closeBtn,
									{ backgroundColor: theme.backgroundSelected },
								]}
								hitSlop={8}
							>
								{Platform.OS === 'ios' ? (
									<SymbolView
										name='xmark'
										style={styles.closeIcon}
										tintColor={theme.textSecondary}
										resizeMode='scaleAspectFit'
									/>
								) : (
									<ThemedText
										style={{
											color: theme.textSecondary,
											fontSize: 14,
											lineHeight: 16,
										}}
									>
										✕
									</ThemedText>
								)}
							</TouchableOpacity>
						</View>
					</View>

					{/* Scrollable form */}
					<ScrollView
						style={[styles.form, { backgroundColor: theme.background }]}
						contentContainerStyle={styles.formContent}
						keyboardShouldPersistTaps='handled'
						showsVerticalScrollIndicator={false}
					>
						{/* Assignment */}
						<View style={styles.section}>
							<FieldLabel label='Assignment' required />
							{form.noTask ? (
								<TextInput
									style={[
										styles.input,
										{
											backgroundColor: theme.backgroundElement,
											borderColor: theme.fieldBorder,
											color: theme.text,
										},
									]}
									placeholder='Assignment name'
									placeholderTextColor={theme.textTertiary}
									value={form.assignmentName}
									onChangeText={(v) => set('assignmentName', v)}
								/>
							) : (
								<TaskPicker
									accessToken={accessToken}
									taskSysId={form.taskSysId}
									taskLabel={form.taskLabel}
									onSelect={(sysId, label) => {
										set('taskSysId', sysId);
										set('taskLabel', label);
									}}
									onClear={() => {
										set('taskSysId', '');
										set('taskLabel', '');
									}}
								/>
							)}

							<TouchableOpacity
								style={styles.noTaskRow}
								onPress={() => set('noTask', !form.noTask)}
								activeOpacity={0.7}
							>
								<View
									style={[
										styles.checkbox,
										{
											borderColor: form.noTask
												? theme.accent
												: theme.fieldBorder,
											backgroundColor: form.noTask
												? theme.accent
												: 'transparent',
										},
									]}
								>
									{form.noTask && Platform.OS === 'ios' && (
										<SymbolView
											name='checkmark'
											style={styles.checkIcon}
											tintColor={theme.accentForeground}
											resizeMode='scaleAspectFit'
										/>
									)}
									{form.noTask && Platform.OS !== 'ios' && (
										<ThemedText
											style={{
												color: theme.accentForeground,
												fontSize: 10,
												lineHeight: 12,
											}}
										>
											✓
										</ThemedText>
									)}
								</View>
								<ThemedText
									style={[styles.noTaskLabel, { color: theme.textSecondary }]}
								>
									No task?
								</ThemedText>
							</TouchableOpacity>
						</View>

						{/* Current focus */}
						<View style={styles.section}>
							<FieldLabel label='Current focus' required />
							<TextInput
								style={[
									styles.input,
									styles.multiline,
									{
										backgroundColor: theme.backgroundElement,
										borderColor: theme.fieldBorder,
										color: theme.text,
									},
								]}
								placeholder='What are you focused on right now?'
								placeholderTextColor={theme.textTertiary}
								value={form.currentFocus}
								onChangeText={(v) => set('currentFocus', v)}
								multiline
								textAlignVertical='top'
							/>
						</View>

						{/* Work item name */}
						<View style={styles.section}>
							<FieldLabel label='Work item name' required />
							<TextInput
								style={[
									styles.input,
									{
										backgroundColor: theme.backgroundElement,
										borderColor: theme.fieldBorder,
										color: theme.text,
									},
								]}
								placeholder='e.g., Backend refactor'
								placeholderTextColor={theme.textTertiary}
								value={form.itemName}
								onChangeText={(v) => set('itemName', v)}
							/>
						</View>

						{/* Assignment type */}
						<View style={styles.section}>
							<FieldLabel label='Assignment type' />
							<ChipSelector
								options={ASSIGNMENT_TYPE_OPTIONS}
								value={form.assignmentType}
								onChange={(v) => set('assignmentType', v)}
							/>
						</View>

						{/* State */}
						<View style={styles.section}>
							<FieldLabel label='State' />
							<ChipSelector
								options={STATE_OPTIONS}
								value={form.state}
								onChange={(v) => set('state', v)}
							/>
						</View>

						{/* Flags */}
						<View style={styles.section}>
							<FieldLabel label='Flags' />
							<View
								style={[
									styles.flagsCard,
									{
										backgroundColor: theme.backgroundElement,
										borderColor: theme.fieldBorder,
									},
								]}
							>
								<FlagToggleRow
									label='At risk'
									value={form.atRisk}
									onChange={(v) => set('atRisk', v)}
								/>
								<FlagToggleRow
									label='Needs help'
									value={form.needsHelp}
									onChange={(v) => set('needsHelp', v)}
								/>
								<View style={styles.flagRow}>
									<ThemedText style={[styles.flagLabel, { color: theme.text }]}>
										Blocked
									</ThemedText>
									<Switch
										value={form.blocked}
										onValueChange={(v) => set('blocked', v)}
										trackColor={{
											false: theme.backgroundSelected,
											true: theme.dangerSubtle,
										}}
										thumbColor={
											form.blocked ? theme.danger : theme.textTertiary
										}
									/>
								</View>
							</View>
						</View>

						{/* Target date */}
						<View style={styles.section}>
							<FieldLabel label='Target date' required />
							<DatePickerField
								value={form.targetDate}
								onChange={(v) => set('targetDate', v)}
							/>
						</View>

						{/* Effort */}
						<View style={styles.section}>
							<FieldLabel label='Effort' required />
							<ChipSelector
								options={EFFORT_OPTIONS}
								value={form.timePercent}
								onChange={(v) => set('timePercent', v)}
							/>
						</View>

						{/* Notes */}
						<View style={[styles.section, styles.lastSection]}>
							<FieldLabel label='Notes / Next steps' required />
							<TextInput
								style={[
									styles.input,
									styles.multiline,
									{
										backgroundColor: theme.backgroundElement,
										borderColor: theme.fieldBorder,
										color: theme.text,
									},
								]}
								placeholder='Notes, blockers, next actions…'
								placeholderTextColor={theme.textTertiary}
								value={form.notes}
								onChangeText={(v) => set('notes', v)}
								multiline
								textAlignVertical='top'
							/>
						</View>

						{error !== null && (
							<ThemedText style={[styles.errorText, { color: theme.danger }]}>
								{error}
							</ThemedText>
						)}
					</ScrollView>

					{/* Sticky footer */}
					<View
						style={[
							styles.footer,
							{
								backgroundColor: theme.backgroundElement,
								borderTopColor: theme.separator,
							},
						]}
					>
						<TouchableOpacity
							style={[
								styles.footerBtn,
								styles.cancelBtn,
								{ borderColor: theme.fieldBorder },
							]}
							onPress={onClose}
							activeOpacity={0.7}
						>
							<ThemedText
								style={[styles.footerBtnText, { color: theme.textSecondary }]}
							>
								Cancel
							</ThemedText>
						</TouchableOpacity>

						<TouchableOpacity
							style={[
								styles.footerBtn,
								styles.submitBtn,
								{
									backgroundColor:
										isValid && !submitting
											? theme.accent
											: theme.backgroundSelected,
								},
							]}
							onPress={handleSubmit}
							disabled={!isValid || submitting}
							activeOpacity={0.8}
						>
							{submitting ? (
								<ActivityIndicator
									size='small'
									color={theme.accentForeground}
								/>
							) : (
								<ThemedText
									style={[
										styles.footerBtnText,
										{
											color: isValid
												? theme.accentForeground
												: theme.textTertiary,
											fontWeight: '600',
										},
									]}
								>
									{submitLabel}
								</ThemedText>
							)}
						</TouchableOpacity>
					</View>
				</View>
			</KeyboardAvoidingView>
		</Modal>
	);
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
	backdrop: {
		...StyleSheet.absoluteFill,
		backgroundColor: 'rgba(0,0,0,0.45)',
	},
	sheetWrapper: {
		flex: 1,
		justifyContent: 'flex-end',
	},
	sheet: {
		borderTopLeftRadius: 28,
		borderTopRightRadius: 28,
		overflow: 'hidden',
	},
	handleWrap: {
		alignItems: 'center',
		paddingTop: Spacing.two,
		paddingBottom: Spacing.one,
	},
	handle: {
		width: 36,
		height: 4,
		borderRadius: 2,
		opacity: 0.35,
	},
	sheetHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingHorizontal: Spacing.three,
		paddingVertical: Spacing.two,
		borderBottomWidth: StyleSheet.hairlineWidth,
	},
	sheetTitle: {
		fontSize: 17,
		fontWeight: '700',
		letterSpacing: -0.3,
	},
	headerActions: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: Spacing.two,
	},
	voiceBtn: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 5,
		paddingHorizontal: 10,
		paddingVertical: 6,
		borderRadius: 20,
	},
	voiceIcon: {
		width: 13,
		height: 13,
	},
	voiceBtnLabel: {
		fontSize: 13,
		fontWeight: '600',
	},
	closeBtn: {
		width: 28,
		height: 28,
		borderRadius: 14,
		alignItems: 'center',
		justifyContent: 'center',
	},
	closeIcon: {
		width: 12,
		height: 12,
	},
	form: {
		flex: 1,
	},
	formContent: {
		paddingHorizontal: Spacing.three,
		paddingTop: Spacing.three,
	},
	section: {
		marginBottom: Spacing.three,
	},
	lastSection: {
		marginBottom: Spacing.two,
	},
	fieldLabelRow: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: Spacing.one + 2,
	},
	fieldLabel: {
		fontSize: 13.5,
		fontWeight: '700',
	},
	requiredDot: {
		fontSize: 13.5,
		fontWeight: '700',
	},
	input: {
		height: 46,
		borderRadius: 12,
		borderWidth: 1,
		paddingHorizontal: Spacing.two + 4,
		fontSize: 15,
	},
	multiline: {
		height: 88,
		paddingTop: Spacing.two,
	},
	noTaskRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: Spacing.two,
		marginTop: Spacing.two,
	},
	checkbox: {
		width: 20,
		height: 20,
		borderRadius: 5,
		borderWidth: 1.5,
		alignItems: 'center',
		justifyContent: 'center',
	},
	checkIcon: {
		width: 11,
		height: 11,
	},
	noTaskLabel: {
		fontSize: 14,
		fontWeight: '500',
	},
	chipRow: {
		gap: Spacing.one,
		paddingVertical: 2,
	},
	chip: {
		paddingHorizontal: 13,
		paddingVertical: 7,
		borderRadius: CardRadius,
		borderWidth: 1,
	},
	chipLabel: {
		fontSize: 13,
		fontWeight: '500',
	},
	flagsCard: {
		borderRadius: 12,
		borderWidth: 1,
		overflow: 'hidden',
	},
	flagRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingHorizontal: Spacing.three,
		paddingVertical: Spacing.two,
	},
	flagLabel: {
		fontSize: 15,
		fontWeight: '500',
	},
	// Task picker
	searchRow: {
		flexDirection: 'row',
		alignItems: 'center',
		height: 46,
		borderRadius: 12,
		borderWidth: 1,
		paddingHorizontal: Spacing.two + 4,
		gap: Spacing.one,
	},
	searchIcon: {
		width: 15,
		height: 15,
	},
	searchInput: {
		flex: 1,
		fontSize: 15,
	},
	selectedTask: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		borderRadius: 12,
		borderWidth: 1,
		paddingHorizontal: Spacing.two + 4,
		paddingVertical: Spacing.two,
		gap: Spacing.two,
	},
	selectedTaskText: {
		flex: 1,
		fontSize: 14,
		fontWeight: '500',
	},
	clearIcon: {
		width: 12,
		height: 12,
	},
	resultsList: {
		marginTop: 4,
		borderRadius: 12,
		borderWidth: 1,
		overflow: 'hidden',
	},
	resultRow: {
		paddingHorizontal: Spacing.two + 4,
		paddingVertical: Spacing.two,
	},
	resultSep: {
		height: StyleSheet.hairlineWidth,
		marginHorizontal: Spacing.two + 4,
	},
	resultNumber: {
		fontSize: 12,
		fontWeight: '600',
		marginBottom: 2,
	},
	resultDesc: {
		fontSize: 13,
	},
	// Footer
	footer: {
		flexDirection: 'row',
		gap: Spacing.two,
		paddingHorizontal: Spacing.three,
		paddingTop: Spacing.two,
		paddingBottom: Spacing.four,
		borderTopWidth: StyleSheet.hairlineWidth,
	},
	footerBtn: {
		flex: 1,
		height: 50,
		borderRadius: 14,
		alignItems: 'center',
		justifyContent: 'center',
	},
	cancelBtn: {
		borderWidth: 1,
	},
	submitBtn: {},
	footerBtnText: {
		fontSize: 15,
	},
	errorText: {
		fontSize: 13,
		textAlign: 'center',
		marginBottom: Spacing.three,
	},
	dateField: {
		height: 46,
		borderRadius: 12,
		borderWidth: 1,
		paddingHorizontal: Spacing.two + 4,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	dateFieldText: {
		flex: 1,
		fontSize: 15,
	},
	calendarIcon: {
		width: 18,
		height: 18,
	},
	datePickerBackdrop: {
		...StyleSheet.absoluteFill,
		// backgroundColor: 'rgba(0,0,0,0.5)',
	},
	datePickerOverlay: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		paddingHorizontal: Spacing.three,
		paddingVertical: Spacing.four,
	},
	datePickerCard: {
		borderRadius: 16,
		overflow: 'hidden',
		width: '100%',
	},
	datePickerDoneBtn: {
		alignItems: 'center',
		paddingVertical: 14,
		borderTopWidth: StyleSheet.hairlineWidth,
	},
});
