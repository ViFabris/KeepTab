import { useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';

import { BigButton } from '../components/BigButton';
import { PageHeader } from '../components/PageHeader';
import { addStaff, getStaff, removeStaff } from '../database/staffRepository';
import { colors } from '../theme';
import type { StaffMember } from '../types';

export function StaffScreen() {
  const db = useSQLiteContext();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const loadStaff = useCallback(async () => {
    try {
      setStaff(await getStaff(db));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not load staff.');
    }
  }, [db]);

  useEffect(() => {
    void loadStaff();
  }, [loadStaff]);

  async function submit() {
    setBusy(true);
    setError('');
    try {
      await addStaff(db, name);
      setName('');
      await loadStaff();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not add that name.');
    } finally {
      setBusy(false);
    }
  }

  function confirmRemove(member: StaffMember) {
    Alert.alert(
      `Remove ${member.name}?`,
      'Existing labels will keep the name as a snapshot.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
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
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not remove that name.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.screen}>
      <PageHeader title="Staff" subtitle="Names appear as large buttons during label creation." />
      <View style={styles.addRow}>
        <TextInput
          accessibilityLabel="New staff name"
          autoCapitalize="words"
          onChangeText={setName}
          onSubmitEditing={() => void submit()}
          placeholder="Enter a staff name"
          placeholderTextColor="#788781"
          returnKeyType="done"
          style={styles.input}
          value={name}
        />
        <BigButton
          label={busy ? 'Saving…' : 'Add staff'}
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
              label="Remove"
              onPress={() => confirmRemove(member)}
              disabled={busy}
              variant="danger"
              style={styles.removeButton}
            />
          </View>
        ))}
        {staff.length === 0 ? (
          <Text style={styles.empty}>No staff yet. Add the first name above.</Text>
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
