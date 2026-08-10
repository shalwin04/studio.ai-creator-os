/**
 * Chat Screen
 *
 * Fintech-inspired: Clean AI conversation with card actions
 */

import { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { colors, spacing, typography, radius, layout, shadows } from '../../../src/theme';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  card?: {
    title: string;
    value: string;
    subtitle: string;
    action: string;
    positive?: boolean;
  };
}

const INITIAL_MESSAGES: Message[] = [
  {
    id: '0',
    role: 'assistant',
    content: "Good morning, James! I've analyzed your channel — here's your top priority for today.",
    card: {
      title: 'Northwind Audio Partnership',
      value: '+$3,500',
      subtitle: 'Deal expires tomorrow',
      action: 'Review Deal',
      positive: true,
    },
  },
];

export default function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const handleSend = useCallback(() => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: 'u' + Date.now(),
      role: 'user',
      content: inputText.trim(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    setTimeout(() => {
      const reply = generateReply(userMessage.content);
      setMessages(prev => [...prev, reply]);
      setIsTyping(false);
    }, 1200);
  }, [inputText]);

  const quickFill = (text: string) => setInputText(text);

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.aiAvatar}>
            <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth={1.5}>
              <Path d="M12 2a2 2 0 012 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 017 7h1a1 1 0 011 1v3a1 1 0 01-1 1h-1v1a2 2 0 01-2 2H5a2 2 0 01-2-2v-1H2a1 1 0 01-1-1v-3a1 1 0 011-1h1a7 7 0 017-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 012-2z" />
            </Svg>
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>AI Assistant</Text>
            <View style={styles.statusRow}>
              <View style={[styles.statusDot, isTyping && styles.statusDotTyping]} />
              <Text style={styles.headerStatus}>
                {isTyping ? 'Analyzing...' : 'Online'}
              </Text>
            </View>
          </View>
          <TouchableOpacity style={styles.headerButton}>
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={colors.text} strokeWidth={1.5}>
              <Circle cx={12} cy={12} r={1} />
              <Circle cx={19} cy={12} r={1} />
              <Circle cx={5} cy={12} r={1} />
            </Svg>
          </TouchableOpacity>
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
          {isTyping && (
            <View style={styles.typingContainer}>
              <View style={styles.typingBubble}>
                <View style={styles.typingDots}>
                  <View style={[styles.typingDot, { opacity: 0.4 }]} />
                  <View style={[styles.typingDot, { opacity: 0.6 }]} />
                  <View style={[styles.typingDot, { opacity: 0.8 }]} />
                </View>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Input */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
        >
          <View style={styles.inputContainer}>
            {/* Quick Actions */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.quickActions}
            >
              <QuickButton icon="zap" label="Priority" onPress={() => quickFill('What should I focus on?')} />
              <QuickButton icon="chart" label="Analytics" onPress={() => quickFill("How's my channel?")} />
              <QuickButton icon="bulb" label="Ideas" onPress={() => quickFill('Give me video ideas')} />
              <QuickButton icon="calendar" label="Schedule" onPress={() => quickFill("What's upcoming?")} />
            </ScrollView>

            {/* Input Row */}
            <View style={styles.inputRow}>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="Ask anything..."
                  placeholderTextColor={colors.textTertiary}
                  value={inputText}
                  onChangeText={setInputText}
                  onSubmitEditing={handleSend}
                  returnKeyType="send"
                  multiline
                  maxLength={500}
                />
              </View>
              <TouchableOpacity
                style={[styles.sendButton, inputText.trim() && styles.sendButtonActive]}
                onPress={handleSend}
                disabled={!inputText.trim()}
              >
                <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={inputText.trim() ? '#FFFFFF' : colors.textTertiary} strokeWidth={2}>
                  <Path d="M22 2L11 13" />
                  <Path d="M22 2l-7 20-4-9-9-4 20-7z" />
                </Svg>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

// ============================================
// MESSAGE BUBBLE
// ============================================

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <View style={styles.userBubbleContainer}>
        <View style={styles.userBubble}>
          <Text style={styles.userText}>{message.content}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.assistantContainer}>
      <View style={styles.assistantAvatarSmall}>
        <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={colors.teal} strokeWidth={1.5}>
          <Path d="M12 2a2 2 0 012 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 017 7h1a1 1 0 011 1v3a1 1 0 01-1 1h-1v1a2 2 0 01-2 2H5a2 2 0 01-2-2v-1H2a1 1 0 01-1-1v-3a1 1 0 011-1h1a7 7 0 017-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 012-2z" />
        </Svg>
      </View>
      <View style={styles.assistantBubble}>
        <Text style={styles.assistantText}>{message.content}</Text>
        {message.card && (
          <TouchableOpacity style={styles.actionCard} activeOpacity={0.8}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{message.card.title}</Text>
              <Text style={[styles.cardValue, message.card.positive && styles.cardValuePositive]}>
                {message.card.value}
              </Text>
            </View>
            <Text style={styles.cardSubtitle}>{message.card.subtitle}</Text>
            <View style={styles.cardAction}>
              <Text style={styles.cardActionText}>{message.card.action}</Text>
              <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={colors.accent} strokeWidth={2}>
                <Path d="M5 12h14M12 5l7 7-7 7" />
              </Svg>
            </View>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ============================================
// QUICK BUTTON
// ============================================

function QuickButton({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.quickButton} onPress={onPress} activeOpacity={0.7}>
      {icon === 'zap' && (
        <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={colors.accent} strokeWidth={1.5}>
          <Path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
        </Svg>
      )}
      {icon === 'chart' && (
        <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={colors.accent} strokeWidth={1.5}>
          <Path d="M18 20V10M12 20V4M6 20v-6" />
        </Svg>
      )}
      {icon === 'bulb' && (
        <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={colors.accent} strokeWidth={1.5}>
          <Path d="M9 18h6M10 22h4M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0018 8 6 6 0 006 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 018.91 14" />
        </Svg>
      )}
      {icon === 'calendar' && (
        <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={colors.accent} strokeWidth={1.5}>
          <Rect x={3} y={4} width={18} height={18} rx={2} />
          <Path d="M16 2v4M8 2v4M3 10h18" />
        </Svg>
      )}
      <Text style={styles.quickButtonText}>{label}</Text>
    </TouchableOpacity>
  );
}

// ============================================
// HELPERS
// ============================================

function generateReply(input: string): Message {
  const lower = input.toLowerCase();

  if (lower.includes('focus') || lower.includes('priorit')) {
    return {
      id: 'a' + Date.now(),
      role: 'assistant',
      content: 'Based on deadline and revenue impact, this is your top priority:',
      card: {
        title: 'Northwind Audio Partnership',
        value: '+$3,500',
        subtitle: 'Deal expires tomorrow · Reply needed',
        action: 'Open Deal',
        positive: true,
      },
    };
  }

  if (lower.includes('channel') || lower.includes('analytic')) {
    return {
      id: 'a' + Date.now(),
      role: 'assistant',
      content: 'Your channel had strong growth this week:',
      card: {
        title: 'Weekly Performance',
        value: '+847',
        subtitle: 'New subscribers · 89.2K views · 6.2% CTR',
        action: 'View Analytics',
        positive: true,
      },
    };
  }

  if (lower.includes('idea') || lower.includes('content')) {
    return {
      id: 'a' + Date.now(),
      role: 'assistant',
      content: "Here are trending ideas based on your audience:",
      card: {
        title: '3 Video Ideas Ready',
        value: 'High',
        subtitle: '"AI Coding Tools" is trending with your audience',
        action: 'View Ideas',
        positive: true,
      },
    };
  }

  if (lower.includes('schedule') || lower.includes('upcoming') || lower.includes('calendar')) {
    return {
      id: 'a' + Date.now(),
      role: 'assistant',
      content: "Here's what's on your schedule:",
      card: {
        title: '2 Items Today',
        value: '2:00 PM',
        subtitle: 'Next: Film AI Review · Edit React Tips',
        action: 'Open Calendar',
      },
    };
  }

  return {
    id: 'a' + Date.now(),
    role: 'assistant',
    content: 'I can help with analytics, content planning, deals, and tasks. What would you like to explore?',
  };
}

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safeArea: {
    flex: 1,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: layout.screenPadding,
    paddingVertical: 14,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  aiAvatar: {
    width: 44,
    height: 44,
    borderRadius: radius.lg,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.teal,
  },
  statusDotTyping: {
    backgroundColor: colors.warning,
  },
  headerStatus: {
    fontSize: 13,
    color: colors.textTertiary,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Messages
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: layout.screenPadding,
    gap: 16,
  },

  // User Bubble
  userBubbleContainer: {
    alignItems: 'flex-end',
  },
  userBubble: {
    maxWidth: '80%',
    backgroundColor: colors.accent,
    borderRadius: radius.xl,
    borderBottomRightRadius: radius.xs,
    padding: 14,
    paddingHorizontal: 18,
  },
  userText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#FFFFFF',
  },

  // Assistant Bubble
  assistantContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  assistantAvatarSmall: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    backgroundColor: colors.tealMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  assistantBubble: {
    flex: 1,
    maxWidth: '85%',
  },
  assistantText: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.text,
    marginBottom: 12,
  },

  // Action Card
  actionCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: 16,
    ...shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  cardValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  cardValuePositive: {
    color: colors.teal,
  },
  cardSubtitle: {
    fontSize: 13,
    color: colors.textTertiary,
    marginBottom: 14,
  },
  cardAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.accent,
  },

  // Typing
  typingContainer: {
    alignItems: 'flex-start',
    paddingLeft: 38,
  },
  typingBubble: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 14,
    paddingHorizontal: 18,
  },
  typingDots: {
    flexDirection: 'row',
    gap: 4,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.textTertiary,
  },

  // Input Container
  inputContainer: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    paddingTop: 12,
    paddingBottom: layout.tabBarHeight + layout.tabBarBottom + 12,
    paddingHorizontal: layout.screenPadding,
  },
  quickActions: {
    gap: 8,
    marginBottom: 12,
  },
  quickButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.background,
    borderRadius: radius.full,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  quickButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.text,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: radius.xl,
    paddingHorizontal: 18,
    paddingVertical: 14,
    minHeight: 52,
    maxHeight: 120,
  },
  input: {
    fontSize: 15,
    color: colors.text,
    padding: 0,
    lineHeight: 20,
  },
  sendButton: {
    width: 52,
    height: 52,
    borderRadius: radius.xl,
    backgroundColor: colors.neutral300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonActive: {
    backgroundColor: colors.accent,
  },
});
