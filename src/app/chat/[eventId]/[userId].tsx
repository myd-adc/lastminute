import { useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { ChatConversation } from '@/components/chat/ChatConversation';
import { ChatsTwoPane } from '@/components/chat/ChatsTwoPane';
import { useIsWide } from '@/lib/layout';
import { dmChatId } from '@/store/AppStore';
import { useTheme } from '@/theme';

// M13 «Чат» on phones; on wide web the W06 two-pane view with this chat selected.
export default function ChatScreen() {
  const { eventId, userId } = useLocalSearchParams<{ eventId: string; userId: string }>();
  const { c } = useTheme();
  const wide = useIsWide();
  if (wide) return <ChatsTwoPane key={`${eventId}:${userId}`} initialChatId={dmChatId(eventId, userId)} />;
  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ChatConversation eventId={eventId} userId={userId} variant="screen" />
    </View>
  );
}
