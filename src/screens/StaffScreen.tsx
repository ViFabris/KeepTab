import { useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';

import { BigButton } from '../components/BigButton';
import { PageHeader } from '../components/PageHeader';
import { addStaff, getStaff, removeStaff } from '../database/staffRepository';
import { useLanguage } from '../i18n/LanguageContext';
import { colors } from '../theme';
import type { StaffMember } from '../types';

export function StaffScreen() {
  const db = useSQLiteContext();
  const { copy } = useLanguage();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

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
    Alert.alert(
      copy.removeStaffTitle(member.name),
      copy.removeStaffHint,
      [
        { text: copy.cancel, style: 'cancel' },
        {
          text: copy.remove,
          style: 'destructive',
          onPress: () => void remove(member),
        },
      ],
    );
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
    }
  }

  return (
    <View style={styles.screen}>
      <PageHeader title={copy.staffTitle} subtitle={copy.staffHint} />
      <View style={styles.addRow}>
        <TextInput
          accessibilityLabel={copy.staffInputPlaceholder}
          autoCapitalize="words"
          onChangeText={setName}
          onSubmitEditing={() => void submit()}
          placeholder={copy.staffInputPlaceholder}
          placeholderTextColor="#788781"
          returnKeyType="done"
          style={styles.input}
          value={name}
        />
        <BigButton
          label={busy ? copy.saving : copy.addStaff}
          onPress={() => void submit()}
          disabled={busy || !name.trim()}
          style={styles.addButton}
        />
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <ScrollView contentContainerStyle={styles.list}>
        {staff.map((member) => (
          <View key={member.id} style={styles.row}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{member.name.charAt(0).toLocaleUpperCase()}</Text>
            </View>
            <Text numberOfLines={1} style={styles.name}>{member.name}</Text>
            <BigButton
              label={copy.remove}
              onPress={() => confirmRemove(member)}
              disabled={busy}
              variant="danger"
              style={styles.removeButton}
            />
          </View>
        ))}
        {staff.length === 0 ? (
          <Text style={styles.empty}>{copy.noStaffList}</Text>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 28, gap: 18 },
  addRow: { flexDirection: 'row', gap: 14 },
  input: {
    flex: 1,
    minHeight: 68,
    paddingHorizontal: 20,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: colors.surface,
    color: colors.ink,
    fontSize: 23,
    fontWeight: '600',
  },
  addButton: { width: 210 },
  list: { gap: 12, paddingBottom: 24 },
  row: {
    minHeight: 86,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: colors.surface,
  },
  avatar: {
    width: 58,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 29,
    backgroundColor: colors.primarySoft,
  },
  avatarText: { color: colors.primaryDark, fontSize: 25, fontWeight: '900' },
  name: { flex: 1, color: colors.ink, fontSize: 25, fontWeight: '800' },
  removeButton: { width: 150, minHeight: 58 },
  empty: { padding: 34, color: colors.muted, fontSize: 20, textAlign: 'center' },
  error: {
    padding: 12,
    borderRadius: 10,
    backgroundColor: colors.dangerSoft,
    color: colors.dangerDark,
    fontSize: 17,
    fontWeight: '700',
  },
});
