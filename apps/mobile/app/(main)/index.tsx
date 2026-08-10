/**
 * Main Index - Redirects to Chat
 */

import { Redirect } from 'expo-router';

export default function MainIndex() {
  return <Redirect href="/(main)/chat" />;
}
