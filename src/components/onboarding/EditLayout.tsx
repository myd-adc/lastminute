import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button, goBack, Header, Screen } from '@/components/ui';
import { useT } from '@/i18n';
import { useIsWide } from '@/lib/layout';

import { PreviewCard, type PreviewPerson } from './PreviewCard';

// Shell for «Змінити профіль» / «Вподобання і сцени»: header with back, pinned «Зберегти»,
// and on wide web a live preview card next to the form.
export function EditLayout({
  title,
  children,
  onSave,
  canSave,
  preview,
}: {
  title: string;
  children: ReactNode;
  onSave: () => void;
  canSave: boolean;
  preview?: PreviewPerson;
}) {
  const wide = useIsWide();
  const { t } = useT();
  const save = <Button label={t('common.save')} onPress={onSave} disabled={!canSave} style={wide && styles.wideSave} />;
  return (
    <Screen keyboard footer={save}>
      <Header title={title} onBack={() => goBack('/me')} />
      <View style={wide ? styles.wideRow : { gap: 16 }}>
        <View style={wide ? styles.wideForm : { gap: 16 }}>{children}</View>
        {wide && preview && (
          <View style={styles.widePreview}>
            <PreviewCard person={preview} />
          </View>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  wideRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 48 },
  wideForm: { flex: 1, maxWidth: 600, gap: 16 },
  widePreview: { width: 320 },
  wideSave: { alignSelf: 'flex-start', minWidth: 240 },
});
