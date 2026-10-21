import { Check, Send } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { useT } from '@/i18n';
import { useIsWide } from '@/lib/layout';
import { display, onest, useTheme } from '@/theme';

import { Button } from './Button';
import { QrCode } from './QrCode';
import { Sheet } from './Sheet';
import { Text } from './Text';

export type ShareOutcome = 'shared' | 'copied' | 'cancelled' | 'failed';

type Props = {
  visible: boolean;
  onClose: () => void;
  title: string;
  sub: string;
  // What the code opens, read out by screen readers: the event or community name.
  subject: string;
  url: string;
  onShare: () => Promise<ShareOutcome>;
};

// "Show a friend": a big code to scan straight off your screen, with the usual share under it. No link printed:
// the short id means nothing to a reader, and the scanner's camera shows the address anyway.
// The share result is reported here rather than in a toast, which would sit behind this sheet's scrim.
export function QrSheet({ visible, onClose, title, sub, subject, url, onShare }: Props) {
  const { c } = useTheme();
  const { t } = useT();
  const wide = useIsWide();
  const [outcome, setOutcome] = useState<ShareOutcome | null>(null);

  const close = () => {
    setOutcome(null);
    onClose();
  };
  const copied = outcome === 'copied';

  return (
    <Sheet
      visible={visible}
      onClose={close}
      footer={
        <>
          <Button label={copied ? t('common.qr.copied') : t('common.qr.shareLink')} icon={copied ? Check : Send} onPress={() => onShare().then(setOutcome)} />
          {outcome === 'failed' && <Text style={[onest('regular', 13, 17), styles.centre, { color: c.danger }]}>{t('common.qr.failed')}</Text>}
        </>
      }
    >
      <Text style={[display(20, 25), { color: c.text }]}>{title}</Text>
      <Text style={[onest('regular', 14, 19), { color: c.muted }]}>{sub}</Text>
      <View style={styles.code}>
        <QrCode value={url} size={wide ? 280 : 240} label={t('common.qr.a11y', { title: subject })} />
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  code: { alignItems: 'center', paddingVertical: 8 },
  centre: { textAlign: 'center' },
});
