import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { Trash2, UserPlus } from 'lucide-react-native';

import { BigButton } from '../components/BigButton';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Input } from '../components/Input';
import { ListRow } from '../components/ListRow';
import { PageHeader } from '../components/PageHeader';
import { addStaff, getStaff, removeStaff } from '../database/staffRepository';
import { useLanguage } from '../i18n/LanguageContext';
import { colors, radii, sizes, spacing, typography } from '../theme';
import type { StaffMember } from '../types';

export function StaffScreen({
  embedded = false,
  onStaffCountChange,
}: {
  embedded?: boolean;
  onStaffCountChange?: (count: number) => void;
}) {
  const db = useSQLiteContext();
  const { copy } = useLanguage();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [pendingRemove, setPendingRemove] = useState<StaffMember | null>(null);

  const loadStaff = useCallback(async () => {
    try {
      setStaff(await getStaff(db));
    } catch {
      setError(copy.staffLoadError);
    }
  }, [copy.staffLoadError, db]);

  useEffect(() => {
    void loadStaff();
  }, [loadStaff]);

  useEffect(() => {
    onStaffCountChange?.(staff.length);
  }, [onStaffCountChange, staff.length]);

  async function submit() {
    if (!name.trim()) {
      setError(copy.enterStaffName);
      return;
    }
    setBusy(true);
    setError('');
    try {
      await addStaff(db, name);
      setName('');
      await loadStaff();
    } catch (caught) {
      setError(
        caught instanceof Error && caught.message.includes('already exists')
          ? copy.duplicateStaff
          : copy.staffAddError,
      );
    } finally {
      setBusy(false);
    }
  }

  function confirmRemove(member: StaffMember) {
    setPendingRemove(member);
  }

  async function remove(member: StaffMember) {
    setBusy(true);
    setError('');
    try {
      await removeStaff(db, member.id);
      setStaff((current) => current.filter((person) => person.id !== member.id));
    } catch {
      setError(copy.staffRemoveError);
    } finally {
      setBusy(false);
      setPendingRemove(null);
    }
  }

  return (
    <View style={[styles.screen, embedded && styles.embedded]}>
      {!embedded ? <PageHeader title={copy.staffTitle} subtitle={copy.staffHint} /> : null}
      <View style={styles.addRow}>
        <Input
          accessibilityLabel={copy.staffInputPlaceholder}
          autoCapitalize="words"
          onChangeText={setName}
          onSubmitEditing={() => void submit()}
          placeholder={copy.staffInputPlaceholder}
          returnKeyType="done"
          containerStyle={styles.input}
          value={name}
        />
        <BigButton
          label={busy ? copy.saving : copy.addStaff}
          onPress={() => void submit()}
          disabled={busy || !name.trim()}
          style={styles.addButton}
          leading={<UserPlus color={colors.background} size={sizes.iconMd} strokeWidth={2} />}
        />
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <ScrollView contentContainerStyle={styles.list}>
        {staff.map((member) => (
          <ListRow
            key={member.id}
            style={styles.row}
            leading={(
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{member.name.charAt(0).toLocaleUpperCase()}</Text>
              </View>
            )}
            trailing={(
              <BigButton
                label={copy.remove}
                onPress={() => confirmRemove(member)}
                disabled={busy}
                variant="danger"
                style={styles.removeButton}
                leading={<Trash2 color={colors.background} size={sizes.iconSm} strokeWidth={2} />}
              />
            )}
          >
            <Text numberOfLines={1} style={styles.name}>{member.name}</Text>
          </ListRow>
        ))}
        {staff.length === 0 ? (
          <Text style={styles.empty}>{copy.noStaffList}</Text>
        ) : null}
      </ScrollView>
      <ConfirmDialog
        body={copy.removeStaffHint}
        busy={busy}
        cancelLabel={copy.cancel}
        confirmLabel={copy.remove}
        onCancel={() => setPendingRemove(null)}
        onConfirm={() => {
          if (pendingRemove) void remove(pendingRemove);
        }}
        title={pendingRemove ? copy.removeStaffTitle(pendingRemove.name) : ''}
        visible={pendingRemove !== null}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: spacing.xxl, gap: spacing.lg, backgroundColor: colors.background },
  embedded: { padding: spacing.none },
  addRow: { flexDirection: 'row', gap: spacing.md },
  input: {
    flex: 1,
  },
  addButton: { width: 210 },
  list: { gap: spacing.sm, paddingBottom: spacing.xl },
  row: {
    minHeight: sizes.control + spacing.lg,
  },
  avatar: {
    width: sizes.tapMin,
    height: sizes.tapMin,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
    backgroundColor: colors.primarySoft,
  },
  avatarText: { ...typography.h2, color: colors.primaryDark },
  name: { ...typography.h2, flex: 1, color: colors.ink },
  removeButton: { width: 160, minHeight: sizes.tapMin },
  empty: { ...typography.body, padding: spacing.xxl, color: colors.muted, textAlign: 'center' },
  error: {
    ...typography.bodyStrong,
    padding: spacing.sm,
    borderRadius: radii.sm,
    backgroundColor: colors.dangerSoft,
    color: colors.dangerDark,
  },
});
