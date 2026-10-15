import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { AlertTriangle } from 'lucide-react-native';

import { colors, radii, sizes, spacing, typography } from '../theme';
import { Button } from './Button';
import { Card } from './Card';

export function ConfirmDialog({
  visible,
  title,
  body,
  cancelLabel,
  confirmLabel,
  busy = false,
  onCancel,
  onConfirm,
}: {
  visible: boolean;
  title: string;
  body: string;
  cancelLabel: string;
  confirmLabel: string;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal
      animationType="fade"
      onRequestClose={onCancel}
      transparent
      visible={visible}
    >
      <View style={styles.overlay}>
        <Pressable accessibilityRole="button" onPress={onCancel} style={StyleSheet.absoluteFill} />
        <Card style={styles.dialog}>
          <View style={styles.heading}>
            <View style={styles.iconCircle}>
              <AlertTriangle color={colors.danger} size={sizes.iconLg} strokeWidth={2} />
            </View>
            <View style={styles.copy}>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.body}>{body}</Text>
            </View>
          </View>
          <View style={styles.actions}>
            <Button
              disabled={busy}
              label={cancelLabel}
              onPress={onCancel}
              style={styles.action}
              variant="secondary"
            />
            <Button
              disabled={busy}
              label={confirmLabel}
              onPress={onConfirm}
              style={styles.action}
              variant="destructive"
            />
          </View>
        </Card>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
    backgroundColor: colors.overlay,
  },
  dialog: { width: '62%', maxWidth: 680, gap: spacing.xl, padding: spacing.xxl },
  heading: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  iconCircle: {
    width: sizes.control,
    height: sizes.control,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
    backgroundColor: colors.dangerSoft,
  },
  copy: { flex: 1, minWidth: 0 },
  title: { ...typography.h2, color: colors.ink },
  body: { ...typography.body, marginTop: spacing.xs, color: colors.muted },
  actions: { flexDirection: 'row', gap: spacing.md },
  action: { flex: 1 },
});
