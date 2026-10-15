import { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronDown, Globe2, X } from 'lucide-react-native';

import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { ALL_TIME_ZONES } from '../data/timeZones';
import { useLanguage } from '../i18n/LanguageContext';
import { colors, radii, sizes, spacing, typography } from '../theme';

export function TimeZoneSelect({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const { copy } = useLanguage();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const filteredZones = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    if (!normalized) return ALL_TIME_ZONES;
    return ALL_TIME_ZONES.filter((timeZone) =>
      timeZone.replaceAll('_', ' ').toLocaleLowerCase().includes(normalized),
    );
  }, [query]);

  function close() {
    setOpen(false);
    setQuery('');
  }

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        accessibilityLabel={copy.setup.selectTimeZone}
        accessibilityRole="button"
        onPress={() => setOpen(true)}
        style={({ pressed }) => [styles.control, pressed && styles.pressed]}
      >
        <Globe2 color={colors.secondary} size={sizes.iconMd} strokeWidth={2} />
        <Text numberOfLines={1} style={styles.value}>{value}</Text>
        <ChevronDown color={colors.ink} size={sizes.iconMd} strokeWidth={2} />
      </Pressable>

      <Modal animationType="fade" onRequestClose={close} transparent visible={open}>
        <View style={styles.overlay}>
          <Pressable accessibilityRole="button" onPress={close} style={StyleSheet.absoluteFill} />
          <Card style={styles.menu}>
            <View style={styles.header}>
              <Text style={styles.title}>{copy.setup.selectTimeZone}</Text>
              <Button
                accessibilityLabel={copy.cancel}
                label={copy.cancel}
                leading={<X color={colors.ink} size={sizes.iconSm} strokeWidth={2} />}
                onPress={close}
                style={styles.closeButton}
                variant="secondary"
              />
            </View>
            <Input
              accessibilityLabel={copy.setup.searchTimeZones}
              icon="search"
              onChangeText={setQuery}
              placeholder={copy.setup.searchTimeZones}
              value={query}
            />
            <FlatList
              contentContainerStyle={styles.list}
              data={filteredZones}
              initialNumToRender={18}
              keyExtractor={(timeZone) => timeZone}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={<Text style={styles.empty}>{copy.setup.noTimeZones}</Text>}
              renderItem={({ item: timeZone }) => (
                <Button
                  label={timeZone}
                  onPress={() => {
                    onChange(timeZone);
                    close();
                  }}
                  selected={timeZone === value}
                  style={styles.option}
                  variant="ghost"
                />
              )}
            />
          </Card>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: spacing.xs },
  label: { ...typography.bodyStrong, color: colors.ink },
  control: {
    minHeight: sizes.control,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceRaised,
  },
  pressed: { opacity: 0.82 },
  value: { ...typography.body, flex: 1, color: colors.ink },
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
    backgroundColor: colors.overlay,
  },
  menu: {
    width: '72%',
    maxWidth: 840,
    height: '82%',
    padding: spacing.xl,
    gap: spacing.md,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  title: { ...typography.h2, flex: 1, color: colors.ink },
  closeButton: { minWidth: 140, minHeight: sizes.tapMin },
  list: { gap: spacing.xs, paddingBottom: spacing.lg },
  option: { minHeight: sizes.tapMin, justifyContent: 'flex-start' },
  empty: { ...typography.body, padding: spacing.xl, textAlign: 'center', color: colors.muted },
});
