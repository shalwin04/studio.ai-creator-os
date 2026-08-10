import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from './supabase';

// Google OAuth configuration
const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_SECRET || ''; // For token exchange

// OAuth endpoints
const discovery = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
};

// Required scopes for YouTube API access
const YOUTUBE_SCOPES = [
  'https://www.googleapis.com/auth/youtube.readonly',
  'https://www.googleapis.com/auth/yt-analytics.readonly',
  'https://www.googleapis.com/auth/yt-analytics-monetary.readonly',
];

// Ensure web browser is ready for auth
WebBrowser.maybeCompleteAuthSession();

// ============================================
// OAUTH FLOW
// ============================================

export interface YouTubeAuthResult {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  channelId: string;
  channelTitle: string;
}

export async function initiateYouTubeAuth(): Promise<YouTubeAuthResult> {
  const redirectUri = AuthSession.makeRedirectUri({
    scheme: 'agentic-creator-os',
    path: 'youtube-callback',
  });

  const authRequest = new AuthSession.AuthRequest({
    clientId: GOOGLE_CLIENT_ID,
    scopes: YOUTUBE_SCOPES,
    redirectUri,
    responseType: AuthSession.ResponseType.Code,
    usePKCE: true,
    extraParams: {
      access_type: 'offline',
      prompt: 'consent',
    },
  });

  const authResult = await authRequest.promptAsync(discovery);

  if (authResult.type !== 'success' || !authResult.params.code) {
    throw new Error('YouTube authorization was cancelled or failed');
  }

  // Exchange code for tokens
  const tokenResult = await AuthSession.exchangeCodeAsync(
    {
      clientId: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      code: authResult.params.code,
      redirectUri,
      extraParams: {
        code_verifier: authRequest.codeVerifier || '',
      },
    },
    discovery
  );

  if (!tokenResult.accessToken || !tokenResult.refreshToken) {
    throw new Error('Failed to obtain access tokens');
  }

  // Get channel info
  const channelInfo = await fetchChannelInfo(tokenResult.accessToken);

  const expiresAt = new Date(Date.now() + (tokenResult.expiresIn || 3600) * 1000);

  return {
    accessToken: tokenResult.accessToken,
    refreshToken: tokenResult.refreshToken,
    expiresAt,
    channelId: channelInfo.id,
    channelTitle: channelInfo.title,
  };
}

// ============================================
// YOUTUBE DATA API
// ============================================

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';
const YOUTUBE_ANALYTICS_BASE = 'https://youtubeanalytics.googleapis.com/v2';

export interface YouTubeChannelInfo {
  id: string;
  title: string;
  description: string;
  customUrl: string;
  thumbnailUrl: string;
  subscriberCount: number;
  videoCount: number;
  viewCount: number;
}

export interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  publishedAt: string;
  duration: string;
  tags: string[];
  categoryId: string;
  privacyStatus: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
}

export interface VideoAnalytics {
  videoId: string;
  date: string;
  views: number;
  watchTimeMinutes: number;
  averageViewDuration: number;
  averageViewPercentage: number;
  likes: number;
  comments: number;
  shares: number;
  subscribersGained: number;
  subscribersLost: number;
  impressions: number;
  impressionClickThroughRate: number;
  estimatedRevenue: number;
}

async function fetchChannelInfo(accessToken: string): Promise<YouTubeChannelInfo> {
  const response = await fetch(
    `${YOUTUBE_API_BASE}/channels?part=snippet,statistics,brandingSettings&mine=true`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch channel info: ${response.status}`);
  }

  const data = await response.json();
  const channel = data.items?.[0];

  if (!channel) {
    throw new Error('No YouTube channel found for this account');
  }

  return {
    id: channel.id,
    title: channel.snippet.title,
    description: channel.snippet.description,
    customUrl: channel.snippet.customUrl || '',
    thumbnailUrl: channel.snippet.thumbnails?.high?.url || '',
    subscriberCount: parseInt(channel.statistics.subscriberCount, 10) || 0,
    videoCount: parseInt(channel.statistics.videoCount, 10) || 0,
    viewCount: parseInt(channel.statistics.viewCount, 10) || 0,
  };
}

export async function fetchVideos(
  accessToken: string,
  channelId: string,
  pageToken?: string,
  maxResults: number = 50
): Promise<{ videos: YouTubeVideo[]; nextPageToken?: string }> {
  // First, get upload playlist ID
  const channelResponse = await fetch(
    `${YOUTUBE_API_BASE}/channels?part=contentDetails&id=${channelId}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  const channelData = await channelResponse.json();
  const uploadsPlaylistId = channelData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;

  if (!uploadsPlaylistId) {
    throw new Error('Could not find uploads playlist');
  }

  // Get videos from uploads playlist
  let url = `${YOUTUBE_API_BASE}/playlistItems?part=snippet,contentDetails&playlistId=${uploadsPlaylistId}&maxResults=${maxResults}`;
  if (pageToken) {
    url += `&pageToken=${pageToken}`;
  }

  const playlistResponse = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const playlistData = await playlistResponse.json();

  // Get detailed video info
  const videoIds = playlistData.items?.map((item: any) => item.contentDetails.videoId).join(',');

  if (!videoIds) {
    return { videos: [], nextPageToken: undefined };
  }

  const videosResponse = await fetch(
    `${YOUTUBE_API_BASE}/videos?part=snippet,statistics,contentDetails,status&id=${videoIds}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  const videosData = await videosResponse.json();

  const videos: YouTubeVideo[] = videosData.items?.map((video: any) => ({
    id: video.id,
    title: video.snippet.title,
    description: video.snippet.description,
    thumbnailUrl: video.snippet.thumbnails?.high?.url || '',
    publishedAt: video.snippet.publishedAt,
    duration: video.contentDetails.duration,
    tags: video.snippet.tags || [],
    categoryId: video.snippet.categoryId,
    privacyStatus: video.status.privacyStatus,
    viewCount: parseInt(video.statistics.viewCount, 10) || 0,
    likeCount: parseInt(video.statistics.likeCount, 10) || 0,
    commentCount: parseInt(video.statistics.commentCount, 10) || 0,
  })) || [];

  return {
    videos,
    nextPageToken: playlistData.nextPageToken,
  };
}

export async function fetchVideoComments(
  accessToken: string,
  videoId: string,
  maxResults: number = 100
): Promise<any[]> {
  const response = await fetch(
    `${YOUTUBE_API_BASE}/commentThreads?part=snippet&videoId=${videoId}&maxResults=${maxResults}&order=relevance`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!response.ok) {
    // Comments might be disabled
    if (response.status === 403) {
      return [];
    }
    throw new Error(`Failed to fetch comments: ${response.status}`);
  }

  const data = await response.json();

  return data.items?.map((item: any) => ({
    id: item.id,
    authorName: item.snippet.topLevelComment.snippet.authorDisplayName,
    authorChannelId: item.snippet.topLevelComment.snippet.authorChannelId?.value,
    text: item.snippet.topLevelComment.snippet.textDisplay,
    likeCount: item.snippet.topLevelComment.snippet.likeCount,
    publishedAt: item.snippet.topLevelComment.snippet.publishedAt,
  })) || [];
}

export async function fetchVideoAnalytics(
  accessToken: string,
  channelId: string,
  videoId: string,
  startDate: string,
  endDate: string
): Promise<VideoAnalytics[]> {
  const metrics = [
    'views',
    'estimatedMinutesWatched',
    'averageViewDuration',
    'averageViewPercentage',
    'likes',
    'comments',
    'shares',
    'subscribersGained',
    'subscribersLost',
  ].join(',');

  const response = await fetch(
    `${YOUTUBE_ANALYTICS_BASE}/reports?ids=channel==${channelId}&startDate=${startDate}&endDate=${endDate}&metrics=${metrics}&dimensions=day&filters=video==${videoId}&sort=day`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch analytics: ${response.status}`);
  }

  const data = await response.json();

  return data.rows?.map((row: any[]) => ({
    videoId,
    date: row[0],
    views: row[1],
    watchTimeMinutes: row[2],
    averageViewDuration: row[3],
    averageViewPercentage: row[4],
    likes: row[5],
    comments: row[6],
    shares: row[7],
    subscribersGained: row[8],
    subscribersLost: row[9],
    impressions: 0,
    impressionClickThroughRate: 0,
    estimatedRevenue: 0,
  })) || [];
}

export async function fetchChannelAnalytics(
  accessToken: string,
  channelId: string,
  startDate: string,
  endDate: string
): Promise<any> {
  const metrics = [
    'views',
    'estimatedMinutesWatched',
    'subscribersGained',
    'subscribersLost',
    'likes',
    'comments',
  ].join(',');

  const response = await fetch(
    `${YOUTUBE_ANALYTICS_BASE}/reports?ids=channel==${channelId}&startDate=${startDate}&endDate=${endDate}&metrics=${metrics}&dimensions=day&sort=day`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch channel analytics: ${response.status}`);
  }

  return response.json();
}

// ============================================
// TOKEN MANAGEMENT
// ============================================

export async function refreshAccessToken(refreshToken: string): Promise<{
  accessToken: string;
  expiresAt: Date;
}> {
  const response = await fetch(discovery.tokenEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }).toString(),
  });

  if (!response.ok) {
    throw new Error('Failed to refresh access token');
  }

  const data = await response.json();
  const expiresAt = new Date(Date.now() + data.expires_in * 1000);

  return {
    accessToken: data.access_token,
    expiresAt,
  };
}

export async function getValidAccessToken(creatorId: string): Promise<string> {
  // Get stored channel with tokens
  const { data: channel, error } = await supabase
    .from('youtube_channels')
    .select('access_token, refresh_token, token_expires_at')
    .eq('creator_id', creatorId)
    .single();

  if (error || !channel) {
    throw new Error('YouTube channel not connected');
  }

  const expiresAt = new Date(channel.token_expires_at);
  const now = new Date();

  // If token is still valid (with 5 minute buffer), return it
  if (expiresAt.getTime() - now.getTime() > 5 * 60 * 1000) {
    return channel.access_token;
  }

  // Refresh the token
  const { accessToken, expiresAt: newExpiresAt } = await refreshAccessToken(
    channel.refresh_token
  );

  // Update stored token
  await supabase
    .from('youtube_channels')
    .update({
      access_token: accessToken,
      token_expires_at: newExpiresAt.toISOString(),
    })
    .eq('creator_id', creatorId);

  return accessToken;
}

// ============================================
// SYNC UTILITIES
// ============================================

export async function syncChannelData(creatorId: string): Promise<void> {
  const accessToken = await getValidAccessToken(creatorId);

  // Get channel from DB
  const { data: channelRecord } = await supabase
    .from('youtube_channels')
    .select('channel_id')
    .eq('creator_id', creatorId)
    .single();

  if (!channelRecord) {
    throw new Error('No YouTube channel linked');
  }

  // Fetch fresh channel data
  const channelInfo = await fetchChannelInfo(accessToken);

  // Update channel in DB
  await supabase
    .from('youtube_channels')
    .update({
      title: channelInfo.title,
      description: channelInfo.description,
      custom_url: channelInfo.customUrl,
      thumbnail_url: channelInfo.thumbnailUrl,
      subscriber_count: channelInfo.subscriberCount,
      video_count: channelInfo.videoCount,
      view_count: channelInfo.viewCount,
      last_synced_at: new Date().toISOString(),
      sync_status: 'completed',
    })
    .eq('creator_id', creatorId);
}

export async function syncVideos(creatorId: string, fullSync: boolean = false): Promise<number> {
  const accessToken = await getValidAccessToken(creatorId);

  const { data: channelRecord } = await supabase
    .from('youtube_channels')
    .select('id, channel_id')
    .eq('creator_id', creatorId)
    .single();

  if (!channelRecord) {
    throw new Error('No YouTube channel linked');
  }

  let totalSynced = 0;
  let pageToken: string | undefined;
  const maxPages = fullSync ? 10 : 1; // Limit pages to manage quota
  let page = 0;

  while (page < maxPages) {
    const { videos, nextPageToken } = await fetchVideos(
      accessToken,
      channelRecord.channel_id,
      pageToken
    );

    if (videos.length === 0) break;

    // Upsert videos to DB
    const videosToUpsert = videos.map((video) => ({
      channel_id: channelRecord.id,
      video_id: video.id,
      title: video.title,
      description: video.description,
      thumbnail_url: video.thumbnailUrl,
      published_at: video.publishedAt,
      duration_seconds: parseDuration(video.duration),
      tags: video.tags,
      category_id: video.categoryId,
      privacy_status: video.privacyStatus,
      view_count: video.viewCount,
      like_count: video.likeCount,
      comment_count: video.commentCount,
      is_short: parseDuration(video.duration) <= 60,
    }));

    const { error } = await supabase
      .from('youtube_videos')
      .upsert(videosToUpsert, { onConflict: 'video_id' });

    if (error) {
      console.error('Error upserting videos:', error);
    }

    totalSynced += videos.length;
    pageToken = nextPageToken;
    page++;

    if (!nextPageToken) break;
  }

  return totalSynced;
}

// Parse ISO 8601 duration to seconds
function parseDuration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;

  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);

  return hours * 3600 + minutes * 60 + seconds;
}
