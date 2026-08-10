/**
 * AI Chat Screen
 *
 * Dark racing style: Matches dashboard layout with cards and bold design
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
import { LinearGradient } from 'expo-linear-gradient';
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
    color?: string;
  };
}

const INITIAL_MESSAGES: Message[] = [
  {
    id: '0',
    role: 'assistant',
    content: "Good morning! I've analyzed your channel — here's your top priority for today.",
    card: {
      title: 'Northwind Audio Partnership',
      value: '+$3,500',
      subtitle: 'Deal expires tomorrow',
      action: 'Review Deal',
      color: colors.teal,
    },
  },
];

const SUGGESTIONS = [
  { id: '1', text: 'What should I focus on?', icon: 'zap' },
  { id: '2', text: "How's my channel doing?", icon: 'chart' },
  { id: '3', text: 'Give me video ideas', icon: 'bulb' },
  { id: '4', text: "What's on my schedule?", icon: 'calendar' },
];

export default function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const handleSend = useCallback((text?: string) => {
    const messageText = text || inputText.trim();
    if (!messageText) return;

    const userMessage: Message = {
      id: 'u' + Date.now(),
      role: 'user',
      content: messageText,
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    setTimeout(() => {
      const reply = generateReply(messageText);
      setMessages(prev => [...prev, reply]);
      setIsTyping(false);
    }, 1200);
  }, [inputText]);

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerBadge}>
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth={2}>
              <Path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
            </Svg>
            <Text style={styles.headerBadgeText}>AI Chat</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.profileButton}>
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={colors.text} strokeWidth={1.5}>
              <Circle cx={12} cy={12} r={1} />
              <Circle cx={19} cy={12} r={1} />
              <Circle cx={5} cy={12} r={1} />
            </Svg>
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
        >
          {/* Messages */}
          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesContainer}
            contentContainerStyle={styles.messagesContent}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
          >
            {/* Welcome Card */}
            {messages.length <= 1 && (
              <View style={styles.welcomeCard}>
                <LinearGradient
                  colors={['#1E3A5F', '#0D1B2A']}
                  style={styles.welcomeGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.welcomeIcon}>
                    <Svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke={colors.lime} strokeWidth={1.5}>
                      <Path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                      <Path d="M8 9h8M8 13h6" />
                    </Svg>
                  </View>
                  <Text style={styles.welcomeTitle}>Ask me anything</Text>
                  <Text style={styles.welcomeSubtitle}>
                    I can help with analytics, content planning, deals, and tasks.
                  </Text>
                </LinearGradient>
              </View>
            )}

            {/* Suggestions */}
            {messages.length <= 1 && (
              <View style={styles.suggestionsSection}>
                <Text style={styles.suggestionsTitle}>Suggestions</Text>
                <View style={styles.suggestionsGrid}>
                  {SUGGESTIONS.map((suggestion) => (
                    <TouchableOpacity
                      key={suggestion.id}
                      style={styles.suggestionCard}
                      onPress={() => handleSend(suggestion.text)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.suggestionIcon}>
                        <SuggestionIcon type={suggestion.icon} />
                      </View>
                      <Text style={styles.suggestionText}>{suggestion.text}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Messages */}
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <View style={styles.typingContainer}>
                <View style={styles.typingAvatar}>
                  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={colors.lime} strokeWidth={1.5}>
                    <Path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                  </Svg>
                </View>
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

          {/* Input Section */}
          <View style={styles.inputSection}>
            <View style={styles.inputRow}>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="Ask anything..."
                  placeholderTextColor={colors.textTertiary}
                  value={inputText}
                  onChangeText={setInputText}
                  onSubmitEditing={() => handleSend()}
                  returnKeyType="send"
                  multiline
                  maxLength={500}
                />
              </View>
              <TouchableOpacity
                style={[styles.sendButton, inputText.trim() && styles.sendButtonActive]}
                onPress={() => handleSend()}
                disabled={!inputText.trim()}
              >
                <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={inputText.trim() ? '#000' : colors.textTertiary} strokeWidth={2}>
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
      <View style={styles.assistantAvatar}>
        <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={colors.lime} strokeWidth={1.5}>
          <Path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
        </Svg>
      </View>
      <View style={styles.assistantBubble}>
        <Text style={styles.assistantText}>{message.content}</Text>
        {message.card && (
          <TouchableOpacity style={styles.actionCard} activeOpacity={0.8}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{message.card.title}</Text>
              <Text style={[styles.cardValue, { color: message.card.color || colors.teal }]}>
                {message.card.value}
              </Text>
            </View>
            <Text style={styles.cardSubtitle}>{message.card.subtitle}</Text>
            <View style={styles.cardAction}>
              <Text style={styles.cardActionText}>{message.card.action}</Text>
              <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={colors.lime} strokeWidth={2}>
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
// SUGGESTION ICON
// ============================================

function SuggestionIcon({ type }: { type: string }) {
  const iconColor = colors.lime;

  switch (type) {
    case 'zap':
      return (
        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth={1.5}>
          <Path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
        </Svg>
      );
    case 'chart':
      return (
        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth={1.5}>
          <Path d="M18 20V10M12 20V4M6 20v-6" />
        </Svg>
      );
    case 'bulb':
      return (
        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth={1.5}>
          <Path d="M9 18h6M10 22h4M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0018 8 6 6 0 006 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 018.91 14" />
        </Svg>
      );
    case 'calendar':
      return (
        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth={1.5}>
          <Rect x={3} y={4} width={18} height={18} rx={2} />
          <Path d="M16 2v4M8 2v4M3 10h18" />
        </Svg>
      );
    default:
      return null;
  }
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
        color: colors.teal,
      },
    };
  }

  if (lower.includes('channel') || lower.includes('analytic') || lower.includes('doing')) {
    return {
      id: 'a' + Date.now(),
      role: 'assistant',
      content: 'Your channel had strong growth this week:',
      card: {
        title: 'Weekly Performance',
        value: '+847',
        subtitle: 'New subscribers · 89.2K views · 6.2% CTR',
        action: 'View Analytics',
        color: colors.lime,
      },
    };
  }

  if (lower.includes('idea') || lower.includes('content') || lower.includes('video')) {
    return {
      id: 'a' + Date.now(),
      role: 'assistant',
      content: "Here are trending ideas based on your audience:",
      card: {
        title: '3 Video Ideas Ready',
        value: 'High',
        subtitle: '"AI Coding Tools" is trending with your audience',
        action: 'View Ideas',
        color: colors.orange,
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
        color: colors.accent,
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
  keyboardView: {
    flex: 1,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: layout.screenPadding,
    paddingVertical: 16,
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.lime,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: radius.full,
    gap: 8,
  },
  headerBadgeText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '600',
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Messages
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: layout.screenPadding,
    paddingBottom: 20,
    gap: 16,
  },

  // Welcome Card
  welcomeCard: {
    borderRadius: radius['2xl'],
    overflow: 'hidden',
    marginBottom: 8,
  },
  welcomeGradient: {
    padding: 24,
    alignItems: 'center',
  },
  welcomeIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(212, 255, 0, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Suggestions
  suggestionsSection: {
    marginBottom: 16,
  },
  suggestionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  suggestionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  suggestionCard: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: 16,
    gap: 10,
  },
  suggestionIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.lg,
    backgroundColor: colors.limeMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestionText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.text,
    lineHeight: 18,
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
  assistantAvatar: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    backgroundColor: colors.limeMuted,
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
    borderWidth: 1,
    borderColor: colors.border,
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
    color: colors.lime,
  },

  // Typing
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  typingAvatar: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    backgroundColor: colors.limeMuted,
    alignItems: 'center',
    justifyContent: 'center',
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

  // Input Section
  inputSection: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: 12,
    paddingBottom: layout.tabBarHeight + layout.tabBarBottom + 16,
    backgroundColor: colors.background,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: colors.surface,
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
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonActive: {
    backgroundColor: colors.lime,
  },
});
