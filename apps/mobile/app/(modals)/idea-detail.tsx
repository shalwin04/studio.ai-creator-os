/**
 * Content Idea Detail Modal
 *
 * Dark racing style: Idea details, AI insights, and actions
 */

import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { colors, spacing, radius, layout } from '../../src/theme';

// Mock idea data
const IDEA = {
  id: '1',
  title: 'AI Coding Tools Comparison: Cursor vs GitHub Copilot vs Claude',
  description: 'In-depth comparison of the three most popular AI coding assistants. Cover features, pricing, real-world coding tasks, and which one is best for different use cases.',
  source: 'AI Generated',
  category: 'Tutorial',
  impactScore: 92,
  status: 'draft',
  createdAt: 'Aug 8, 2024',
  trendingScore: 'High',
  estimatedViews: '150K - 300K',
  audienceMatch: '94%',
  tags: ['AI', 'Coding', 'Tools', 'Comparison'],
  outline: [
    'Intro: Why AI coding tools matter',
    'Feature comparison: Code completion',
    'Feature comparison: Chat & explanation',
    'Pricing breakdown',
    'Real-world coding challenge',
    'Final verdict & recommendations',
  ],
  relatedVideos: [
    { title: 'Building AI Apps with Claude', views: '524K' },
    { title: 'Cursor vs Copilot', views: '156K' },
  ],
};

const PIPELINE_STAGES = [
  { id: 'draft', label: 'Draft', icon: 'edit' },
  { id: 'scripting', label: 'Scripting', icon: 'file' },
  { id: 'filming', label: 'Filming', icon: 'video' },
  { id: 'editing', label: 'Editing', icon: 'scissors' },
  { id: 'published', label: 'Published', icon: 'check' },
];

export default function IdeaDetailModal() {
  const router = useRouter();
  const [idea, setIdea] = useState(IDEA);

  const currentStageIndex = PIPELINE_STAGES.findIndex(s => s.id === idea.status);

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Impact Score Hero */}
        <View style={styles.heroCard}>
          <LinearGradient
            colors={[colors.teal, colors.mercedes]}
            style={styles.heroGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.heroRow}>
              <View>
                <Text style={styles.heroLabel}>IMPACT SCORE</Text>
                <Text style={styles.heroValue}>{idea.impactScore}</Text>
              </View>
              <View style={styles.impactMeter}>
                <View style={[styles.impactFill, { width: `${idea.impactScore}%` }]} />
              </View>
            </View>
            <View style={styles.heroStats}>
              <View style={styles.heroStat}>
                <Text style={styles.heroStatValue}>{idea.estimatedViews}</Text>
                <Text style={styles.heroStatLabel}>Est. Views</Text>
              </View>
              <View style={styles.heroStat}>
                <Text style={styles.heroStatValue}>{idea.audienceMatch}</Text>
                <Text style={styles.heroStatLabel}>Audience Match</Text>
              </View>
              <View style={styles.heroStat}>
                <Text style={styles.heroStatValue}>{idea.trendingScore}</Text>
                <Text style={styles.heroStatLabel}>Trending</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Title & Category */}
        <View style={styles.titleSection}>
          <View style={styles.categoryRow}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{idea.category}</Text>
            </View>
            <View style={styles.sourceBadge}>
              <Svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke={colors.lime} strokeWidth={2}>
                <Path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </Svg>
              <Text style={styles.sourceText}>{idea.source}</Text>
            </View>
          </View>
          <Text style={styles.title}>{idea.title}</Text>
        </View>

        {/* Pipeline Progress */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pipeline Status</Text>
          <View style={styles.pipelineCard}>
            <View style={styles.pipelineStages}>
              {PIPELINE_STAGES.map((stage, index) => (
                <View key={stage.id} style={styles.pipelineStage}>
                  <View
                    style={[
                      styles.pipelineDot,
                      index <= currentStageIndex && styles.pipelineDotActive,
                    ]}
                  >
                    {index < currentStageIndex && (
                      <Svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke={colors.background} strokeWidth={3}>
                        <Path d="M20 6L9 17l-5-5" />
                      </Svg>
                    )}
                  </View>
                  <Text
                    style={[
                      styles.pipelineLabel,
                      index <= currentStageIndex && styles.pipelineLabelActive,
                    ]}
                  >
                    {stage.label}
                  </Text>
                  {index < PIPELINE_STAGES.length - 1 && (
                    <View
                      style={[
                        styles.pipelineLine,
                        index < currentStageIndex && styles.pipelineLineActive,
                      ]}
                    />
                  )}
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <View style={styles.descriptionCard}>
            <Text style={styles.description}>{idea.description}</Text>
          </View>
        </View>

        {/* Tags */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tags</Text>
          <View style={styles.tagsRow}>
            {idea.tags.map((tag) => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Outline */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Suggested Outline</Text>
          <View style={styles.outlineCard}>
            {idea.outline.map((item, index) => (
              <View key={index} style={styles.outlineItem}>
                <Text style={styles.outlineNumber}>{String(index + 1).padStart(2, '0')}</Text>
                <Text style={styles.outlineText}>{item}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Related Videos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Related Content</Text>
          <View style={styles.relatedCard}>
            {idea.relatedVideos.map((video, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.relatedItem, index === idea.relatedVideos.length - 1 && { borderBottomWidth: 0 }]}
              >
                <View style={styles.relatedIcon}>
                  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={colors.accent} strokeWidth={1.5}>
                    <Path d="M23 7l-7 5 7 5V7z" />
                    <Rect x={1} y={5} width={15} height={14} rx={2} />
                  </Svg>
                </View>
                <View style={styles.relatedContent}>
                  <Text style={styles.relatedTitle}>{video.title}</Text>
                  <Text style={styles.relatedViews}>{video.views} views</Text>
                </View>
                <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={colors.textTertiary} strokeWidth={1.5}>
                  <Path d="M9 18l6-6-6-6" />
                </Svg>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Bottom Padding */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionBar}>
        <TouchableOpacity style={styles.archiveButton} activeOpacity={0.7}>
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={colors.textSecondary} strokeWidth={1.5}>
            <Path d="M21 8v13H3V8M1 3h22v5H1zM10 12h4" />
          </Svg>
        </TouchableOpacity>
        <TouchableOpacity style={styles.startButton} activeOpacity={0.8}>
          <LinearGradient
            colors={[colors.lime, '#C8E600']}
            style={styles.startGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={colors.background} strokeWidth={2}>
              <Path d="M5 12h14M12 5l7 7-7 7" />
            </Svg>
            <Text style={styles.startText}>Start Production</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
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

  // Hero Card
  heroCard: {
    borderRadius: radius['2xl'],
    overflow: 'hidden',
    marginBottom: 20,
  },
  heroGradient: {
    padding: 20,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  heroLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 0.5,
  },
  heroValue: {
    fontSize: 48,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -2,
  },
  impactMeter: {
    width: 100,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  impactFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: colors.text,
  },
  heroStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  heroStat: {
    alignItems: 'center',
  },
  heroStatValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  heroStatLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },

  // Title Section
  titleSection: {
    marginBottom: 24,
  },
  categoryRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  categoryBadge: {
    backgroundColor: colors.accentMuted,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.accent,
  },
  sourceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.limeMuted,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
    gap: 6,
  },
  sourceText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.lime,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    lineHeight: 30,
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

  // Pipeline
  pipelineCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: 20,
  },
  pipelineStages: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  pipelineStage: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
  },
  pipelineDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  pipelineDotActive: {
    backgroundColor: colors.teal,
  },
  pipelineLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textTertiary,
  },
  pipelineLabelActive: {
    color: colors.text,
  },
  pipelineLine: {
    position: 'absolute',
    top: 12,
    left: '50%',
    width: '100%',
    height: 2,
    backgroundColor: colors.surfaceElevated,
  },
  pipelineLineActive: {
    backgroundColor: colors.teal,
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

  // Tags
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.full,
  },
  tagText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.text,
  },

  // Outline
  outlineCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: 16,
    gap: 12,
  },
  outlineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  outlineNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.teal,
  },
  outlineText: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },

  // Related
  relatedCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    overflow: 'hidden',
  },
  relatedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  relatedIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.lg,
    backgroundColor: colors.accentMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  relatedContent: {
    flex: 1,
  },
  relatedTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  relatedViews: {
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: 2,
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
  archiveButton: {
    width: 52,
    height: 52,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startButton: {
    flex: 1,
    borderRadius: radius.xl,
    overflow: 'hidden',
  },
  startGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    gap: 8,
  },
  startText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.background,
  },
});
