import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme';

export function SafetyBanner({ compact = false }: { compact?: boolean }) {
  return (
    <View style={[styles.banner, compact && styles.compact]}>
      <Text style={[styles.title, compact && styles.compactTitle]}>SAMPLE DATA</Text>
      <Text style={[styles.body, compact && styles.compactBody]}>
        Shelf lives are placeholders and are not verified for food safety.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderWidth: 2,
    borderColor: '#e5b84b',
    borderRadius: 12,
    backgroundColor: colors.warningBackground,
  },
  compact: { paddingHorizontal: 12, paddingVertical: 10 },
  title: { color: colors.warning, fontSize: 17, fontWeight: '900' },
  compactTitle: { fontSize: 14 },
  body: { marginTop: 3, color: colors.warning, fontSize: 16, lineHeight: 21 },
  compactBody: { fontSize: 13, lineHeight: 17 },
});
