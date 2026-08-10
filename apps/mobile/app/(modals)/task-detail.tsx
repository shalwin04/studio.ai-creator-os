/**
 * Task Detail Modal
 *
 * Dark racing style: Task details, status, and actions
 */

import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { colors, spacing, radius, layout } from '../../src/theme';

// Mock task data
const TASK = {
  id: '1',
  title: 'Review Northwind Audio Partnership',
  description: 'Review the sponsorship deal terms and respond to their latest offer. They\'re offering $3,500 for a 60-second integration.',
  status: 'in_progress',
  priority: 'high',
  dueDate: 'Tomorrow, 5:00 PM',
  category: 'Sponsorship',
  linkedContent: 'AI Tips Video',
  createdAt: 'Aug 8, 2024',
  reminder: '2 hours before',
};

const STATUS_OPTIONS = [
  { id: 'pending', label: 'To Do', color: colors.textTertiary },
  { id: 'in_progress', label: 'In Progress', color: colors.orange },
  { id: 'completed', label: 'Done', color: colors.teal },
];

const PRIORITY_OPTIONS = [
  { id: 'low', label: 'Low', color: colors.textTertiary },
  { id: 'medium', label: 'Medium', color: colors.accent },
  { id: 'high', label: 'High', color: colors.orange },
  { id: 'urgent', label: 'Urgent', color: colors.red },
];

export default function TaskDetailModal() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [task, setTask] = useState(TASK);
  const [isEditing, setIsEditing] = useState(false);

  const currentStatus = STATUS_OPTIONS.find(s => s.id === task.status);
  const currentPriority = PRIORITY_OPTIONS.find(p => p.id === task.priority);

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Status Badge */}
        <View style={styles.statusRow}>
          <View style={[styles.statusBadge, { backgroundColor: `${currentStatus?.color}20` }]}>
            <View style={[styles.statusDot, { backgroundColor: currentStatus?.color }]} />
            <Text style={[styles.statusText, { color: currentStatus?.color }]}>
              {currentStatus?.label}
            </Text>
          </View>
          <View style={[styles.priorityBadge, { backgroundColor: `${currentPriority?.color}20` }]}>
            <Text style={[styles.priorityText, { color: currentPriority?.color }]}>
              {currentPriority?.label} Priority
            </Text>
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title}>{task.title}</Text>

        {/* Due Date Card */}
        <View style={styles.dueDateCard}>
          <LinearGradient
            colors={[colors.orangeMuted, 'transparent']}
            style={styles.dueDateGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <View style={styles.dueDateIcon}>
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={colors.orange} strokeWidth={1.5}>
                <Circle cx={12} cy={12} r={10} />
                <Path d="M12 6v6l4 2" />
              </Svg>
            </View>
            <View style={styles.dueDateContent}>
              <Text style={styles.dueDateLabel}>Due Date</Text>
              <Text style={styles.dueDateValue}>{task.dueDate}</Text>
            </View>
            <TouchableOpacity style={styles.editButton}>
              <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={colors.textTertiary} strokeWidth={1.5}>
                <Path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                <Path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
              </Svg>
            </TouchableOpacity>
          </LinearGradient>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <View style={styles.descriptionCard}>
            <Text style={styles.description}>{task.description}</Text>
          </View>
        </View>

        {/* Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Details</Text>
          <View style={styles.detailsCard}>
            <DetailRow
              icon="folder"
              label="Category"
              value={task.category}
            />
            <DetailRow
              icon="video"
              label="Linked Content"
              value={task.linkedContent}
            />
            <DetailRow
              icon="bell"
              label="Reminder"
              value={task.reminder}
            />
            <DetailRow
              icon="calendar"
              label="Created"
              value={task.createdAt}
              noBorder
            />
          </View>
        </View>

        {/* Status Change */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Update Status</Text>
          <View style={styles.statusOptions}>
            {STATUS_OPTIONS.map((status) => (
              <TouchableOpacity
                key={status.id}
                style={[
                  styles.statusOption,
                  task.status === status.id && styles.statusOptionActive,
                  task.status === status.id && { borderColor: status.color },
                ]}
                onPress={() => setTask({ ...task, status: status.id })}
              >
                <View style={[styles.statusOptionDot, { backgroundColor: status.color }]} />
                <Text
                  style={[
                    styles.statusOptionText,
                    task.status === status.id && { color: colors.text },
                  ]}
                >
                  {status.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Bottom Padding */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionBar}>
        <TouchableOpacity style={styles.deleteButton} activeOpacity={0.7}>
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={colors.red} strokeWidth={1.5}>
            <Path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
          </Svg>
        </TouchableOpacity>
        <TouchableOpacity style={styles.saveButton} activeOpacity={0.8}>
          <LinearGradient
            colors={[colors.lime, '#C8E600']}
            style={styles.saveGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={colors.background} strokeWidth={2}>
              <Path d="M20 6L9 17l-5-5" />
            </Svg>
            <Text style={styles.saveText}>Mark Complete</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function DetailRow({
  icon,
  label,
  value,
  noBorder,
}: {
  icon: string;
  label: string;
  value: string;
  noBorder?: boolean;
}) {
  const icons: Record<string, React.ReactNode> = {
    folder: (
      <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={colors.textTertiary} strokeWidth={1.5}>
        <Path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
      </Svg>
    ),
    video: (
      <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={colors.textTertiary} strokeWidth={1.5}>
        <Path d="M23 7l-7 5 7 5V7z" />
        <Rect x={1} y={5} width={15} height={14} rx={2} />
      </Svg>
    ),
    bell: (
      <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={colors.textTertiary} strokeWidth={1.5}>
        <Path d="M18 8A6 6 0 106 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <Path d="M13.73 21a2 2 0 01-3.46 0" />
      </Svg>
    ),
    calendar: (
      <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={colors.textTertiary} strokeWidth={1.5}>
        <Rect x={3} y={4} width={18} height={18} rx={2} />
        <Path d="M16 2v4M8 2v4M3 10h18" />
      </Svg>
    ),
  };

  return (
    <View style={[styles.detailRow, !noBorder && styles.detailRowBorder]}>
      <View style={styles.detailIcon}>{icons[icon]}</View>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: 20,
  },

  // Status Row
  statusRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  priorityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Title
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 20,
    lineHeight: 32,
  },

  // Due Date Card
  dueDateCard: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    marginBottom: 24,
    backgroundColor: colors.surface,
  },
  dueDateGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  dueDateIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.lg,
    backgroundColor: colors.orangeMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  dueDateContent: {
    flex: 1,
  },
  dueDateLabel: {
    fontSize: 12,
    color: colors.textTertiary,
    marginBottom: 2,
  },
  dueDateValue: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  editButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Section
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textTertiary,
    marginBottom: 10,
    marginLeft: 4,
  },

  // Description
  descriptionCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: 16,
  },
  description: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 22,
  },

  // Details Card
  detailsCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    overflow: 'hidden',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  detailRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  detailIcon: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  detailLabel: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.text,
  },

  // Status Options
  statusOptions: {
    flexDirection: 'row',
    gap: 10,
  },
  statusOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    paddingVertical: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  statusOptionActive: {
    backgroundColor: colors.surfaceElevated,
  },
  statusOptionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusOptionText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textTertiary,
  },

  // Action Bar
  actionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: layout.screenPadding,
    paddingBottom: 34,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 12,
  },
  deleteButton: {
    width: 52,
    height: 52,
    borderRadius: radius.xl,
    backgroundColor: colors.redMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButton: {
    flex: 1,
    borderRadius: radius.xl,
    overflow: 'hidden',
  },
  saveGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    gap: 8,
  },
  saveText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.background,
  },
});
