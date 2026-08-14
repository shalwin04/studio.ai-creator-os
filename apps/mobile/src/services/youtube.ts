/**
 * YouTube Connect Helper
 *
 * Starts the backend-driven YouTube OAuth flow (see apps/backend Phase 4/5:
 * POST /api/auth/youtube/connect + GET /api/auth/youtube/callback).
 */

import { Platform } from 'react-native';
import { apiGetYoutubeConnectUrl } from './api';

const YOUTUBE_APP_REDIRECT = 'agentic-creator-os://youtube-callback';

export type YoutubeConnectResult = 'web-redirect' | 'success' | 'cancelled';

// On web this navigates the current tab away — there's no in-app browser to
// return to, so the backend redirects back to `webReturnPath` on completion
// and the caller should read `?success=`/`?error=` from the URL on remount.
// On native it opens an in-app browser session and resolves once Google
// redirects to the app's custom scheme.
export async function startYoutubeConnect(webReturnPath: string): Promise<YoutubeConnectResult> {
  if (Platform.OS === 'web') {
    const redirectTo = `${window.location.origin}${webReturnPath}`;
    const url = await apiGetYoutubeConnectUrl(redirectTo);
    window.location.href = url;
    return 'web-redirect';
  }

  const WebBrowser = await import('expo-web-browser');
  const url = await apiGetYoutubeConnectUrl();
  const result = await WebBrowser.openAuthSessionAsync(url, YOUTUBE_APP_REDIRECT);
  return result.type === 'success' ? 'success' : 'cancelled';
}
