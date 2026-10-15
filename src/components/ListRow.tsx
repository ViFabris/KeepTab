import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { cardStyle, spacing } from '../theme';

export function ListRow({ children, leading, trailing, style }: {
  children: ReactNode;
  leading?: ReactNode;
  trailing?: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.row, style]}>
      {leading}
      <View style={styles.content}>{children}</View>
      {trailing}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { ...cardStyle, minHeight: 72, padding: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  content: { flex: 1, minWidth: 0 },
});
