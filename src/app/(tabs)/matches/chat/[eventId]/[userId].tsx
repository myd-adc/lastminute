import { useLocalSearchParams } from 'expo-router';
import { KeyboardAvoidingView, Platform } from 'react-native';

import { ChatPanel } from '@/components/ChatPanel';
import { Screen } from '@/components/Screen';

export default function ChatScreen() {
  const { eventId, userId } = useLocalSearchParams<{ eventId: string; userId: string }>();
  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen scroll={false}>
        <ChatPanel eventId={eventId} userId={userId} variant="phone" />
      </Screen>
    </KeyboardAvoidingView>
  );
}
