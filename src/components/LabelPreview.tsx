import { StyleSheet, Text, View } from 'react-native';

import { getFormLabel, getStorageLabel } from '../i18n';
import { useLanguage } from '../i18n/LanguageContext';
import { colors } from '../theme';
import type { ShelfLife, StorageType } from '../types';
import { formatDateTime, formatShelfLife } from '../utils/dates';

interface LabelPreviewProps {
  label: {
    itemName: string;
    form: string;
    storageType: StorageType;
    madeAt: string;
    useByAt?: string;
    staffName: string;
  };
  shelfLife: ShelfLife | null;
  compact?: boolean;
}

export function LabelPreview({ label, shelfLife, compact = false }: LabelPreviewProps) {
  const { language, copy } = useLanguage();
  return (
    <View style={[styles.label, compact && styles.compact]}>
      <View style={styles.titleRow}>
        <Text numberOfLines={1} style={[styles.itemName, compact && styles.compactItem]}>
          {label.itemName}
        </Text>
        <Text style={styles.mockBadge}>{copy.sampleLabelBadge}</Text>
      </View>
      <Text style={[styles.detail, compact && styles.compactDetail]}>
        {getFormLabel(label.form, language)} · {getStorageLabel(label.storageType, language)}
      </Text>
      <View style={styles.rule} />
      <View style={styles.dateRow}>
        <View style={styles.dateColumn}>
          <Text style={styles.fieldLabel}>{copy.made}</Text>
          <Text style={[styles.fieldValue, compact && styles.compactValue]}>
            {formatDateTime(label.madeAt, language)}
          </Text>
        </View>
        <View style={styles.dateColumn}>
          <Text style={styles.fieldLabel}>{copy.useBy}</Text>
          <Text style={[styles.useBy, compact && styles.compactUseBy]}>
            {label.useByAt ? formatDateTime(label.useByAt, language) : copy.notConfigured}
          </Text>
        </View>
      </View>
      <View style={styles.footer}>
        <Text style={styles.staff}>{copy.madeBy(label.staffName)}</Text>
        {shelfLife ? (
          <Text style={styles.duration}>
            {copy.shelfLife(formatShelfLife(shelfLife.hours, language))}
          </Text>
        ) : null}
      </View>
      {shelfLife?.isPlaceholder ? (
        <Text style={styles.placeholder}>{copy.placeholderWarning}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    width: '100%',
    padding: 26,
    borderWidth: 3,
    borderColor: colors.ink,
    borderRadius: 8,
    backgroundColor: colors.surface,
  },
  compact: { padding: 18 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  itemName: { flex: 1, color: '#000000', fontSize: 44, fontWeight: '900' },
  compactItem: { fontSize: 34 },
  mockBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 5,
    backgroundColor: '#ecefec',
    color: '#27332e',
    fontSize: 12,
    fontWeight: '900',
  },
  detail: { marginTop: 5, color: '#18231f', fontSize: 24, fontWeight: '700' },
  compactDetail: { fontSize: 20 },
  rule: { height: 3, marginVertical: 18, backgroundColor: '#000000' },
  dateRow: { flexDirection: 'row', gap: 32 },
  dateColumn: { flex: 1 },
  fieldLabel: { color: '#36423d', fontSize: 13, fontWeight: '900', letterSpacing: 1.5 },
  fieldValue: { marginTop: 5, color: '#000000', fontSize: 22, fontWeight: '700' },
  compactValue: { fontSize: 18 },
  useBy: { marginTop: 5, color: colors.dangerDark, fontSize: 28, fontWeight: '900' },
  compactUseBy: { fontSize: 22 },
  footer: { marginTop: 20, flexDirection: 'row', justifyContent: 'space-between', gap: 16 },
  staff: { color: '#000000', fontSize: 18, fontWeight: '800' },
  duration: { color: '#27332e', fontSize: 17, fontWeight: '600' },
  placeholder: {
    marginTop: 16,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#9ca49f',
    color: colors.danger,
    fontSize: 13,
    fontWeight: '900',
    textAlign: 'center',
  },
});
