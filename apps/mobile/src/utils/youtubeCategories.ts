/**
 * Standard YouTube Data API video category IDs.
 * https://developers.google.com/youtube/v3/docs/videoCategories/list
 */

import { colors } from '../theme';

const YOUTUBE_CATEGORIES: Record<string, string> = {
  '1': 'Film & Animation',
  '2': 'Autos & Vehicles',
  '10': 'Music',
  '15': 'Pets & Animals',
  '17': 'Sports',
  '19': 'Travel & Events',
  '20': 'Gaming',
  '22': 'People & Blogs',
  '23': 'Comedy',
  '24': 'Entertainment',
  '25': 'News & Politics',
  '26': 'Howto & Style',
  '27': 'Education',
  '28': 'Science & Technology',
  '29': 'Nonprofits & Activism',
};

const CATEGORY_COLORS: Record<string, string> = {
  Education: colors.teal,
  'Science & Technology': colors.teal,
  Gaming: colors.mclaren,
  Entertainment: colors.orange,
  'People & Blogs': colors.orange,
  Comedy: colors.ferrari,
  Music: colors.ferrari,
};

export function getCategoryName(id: string | null | undefined): string {
  return (id && YOUTUBE_CATEGORIES[id]) || 'Other';
}

export function getCategoryColor(name: string): string {
  return CATEGORY_COLORS[name] ?? colors.accent;
}
