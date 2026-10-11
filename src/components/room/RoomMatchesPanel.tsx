import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ChatThread } from '@/components/chat/ChatThread';
import type { Event } from '@/data/types';
import { useT } from '@/i18n';
import { expiresAt, matchesAt } from '@/lib/selectors';
import { time } from '@/lib/time';
import { dmChatId, pairKey, useStore } from '@/store/AppStore';
import { fonts, onest, type, useTheme } from '@/theme';

import { Face } from './Face';
import { TimerPill } from './TimerPill';

export const MATCH_PANEL_WIDTH = 440;

// W05 right panel: «Метчі на цю подію», match rows and the selected DM thread.
export function RoomMatchesPanel({
  event,
  now,
  selectedId,
  onSelect,
}: {
  event: Event;
  now: number;
  selectedId: string | null;
  onSelect: (userId: string) => void;
}) {
  const { c } = useTheme();
  const { t } = useT();
  const { state } = useStore();
  const matches = matchesAt(state, event.id);
  const selected = matches.find((u) => u.id === selectedId) ?? matches[0];
  const left = expiresAt(event) - now;

  return (
    <View style={[styles.panel, { borderLeftColor: c.line, backgroundColor: c.surface }]}>
      <View style={styles.head}>
        <Text style={[styles.title, { color: c.text }]}>{t('room.matches.title')}</Text>
        {matches.length > 0 && (
          <View style={[styles.count, { backgroundColor: c.accent }]}>
            <Text style={[onest('bold', 13, 16), { color: c.onAccent }]}>{matches.length}</Text>
          </View>
        )}
      </View>

      {matches.length === 0 ? (
        <View style={styles.empty}>
          <Text style={{ fontSize: 40 }}>👋</Text>
          <Text style={[type.headline, { color: c.text, textAlign: 'center' }]}>{t('room.matches.empty')}</Text>
          <Text style={[type.subhead, { color: c.muted, textAlign: 'center' }]}>
            {t('room.matches.emptyBody')}
          </Text>
        </View>
      ) : (
        <>
          <View>
            {matches.map((u) => {
              const on = u.id === selected?.id;
              const at = state.decisions[pairKey(event.id, u.id)]?.at;
              return (
                <Pressable
                  key={u.id}
                  accessibilityRole="button"
                  accessibilityState={{ selected: on }}
                  onPress={() => onSelect(u.id)}
                  style={({ hovered }: { hovered?: boolean }) => [styles.row, (on || hovered) && { backgroundColor: c.surface2 }]}
                >
                  <Face name={u.name} gradient={u.gradient} size={44} fontSize={16} font="display" />
                  <View style={{ flex: 1, gap: 1 }}>
                    <Text style={[onest('bold', 16, 20), { color: c.text }]} numberOfLines={1}>
                      {u.name}
                    </Text>
                    <Text style={[onest('regular', 13, 17), { color: c.muted }]} numberOfLines={1}>
                      {t('room.matches.bothTapped')}
                      {at ? ` · ${time(at)}` : ''}
                    </Text>
                  </View>
                  <TimerPill ms={left} />
                </Pressable>
              );
            })}
          </View>
          {selected && (
            <View style={styles.thread}>
              <ChatThread key={selected.id} variant="panel" chatId={dmChatId(event.id, selected.id)} eventId={event.id} userId={selected.id} />
            </View>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { width: MATCH_PANEL_WIDTH, borderLeftWidth: 1 },
  head: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingTop: 28, paddingBottom: 16, gap: 8 },
  title: { flex: 1, fontFamily: fonts.displaySemibold, fontSize: 16, lineHeight: 20 },
  count: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 14 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 24, paddingVertical: 14 },
  thread: { flex: 1 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 48 },
});
