/**
 * Notification Service
 *
 * Push notification management via Expo.
 */

import { env } from '../../lib/env.js';

export interface PushNotification {
  to: string; // Expo push token
  title: string;
  body: string;
  data?: Record<string, any>;
  priority?: 'default' | 'normal' | 'high';
  sound?: 'default' | null;
  badge?: number;
}

export interface NotificationPayload {
  type: 'briefing' | 'reminder' | 'opportunity' | 'warning' | 'deadline';
  title: string;
  body: string;
  data?: Record<string, any>;
}

export class NotificationService {
  private creatorId: string;
  private expoUrl = 'https://exp.host/--/api/v2/push/send';

  constructor(creatorId: string) {
    this.creatorId = creatorId;
  }

  /**
   * Send push notification
   */
  async send(payload: NotificationPayload): Promise<void> {
    const token = await this.getExpoPushToken();
    if (!token) {
      console.log('No push token registered for creator:', this.creatorId);
      return;
    }

    const notification: PushNotification = {
      to: token,
      title: payload.title,
      body: payload.body,
      data: {
        type: payload.type,
        ...payload.data,
      },
      sound: 'default',
      priority: this.getPriority(payload.type),
    };

    await this.sendToExpo(notification);
    await this.logNotification(payload);
  }

  /**
   * Send to multiple recipients
   */
  async sendBatch(
    payloads: { creatorId: string; payload: NotificationPayload }[]
  ): Promise<void> {
    // TODO: Batch send notifications
  }

  /**
   * Send daily briefing notification
   */
  async sendBriefingNotification(briefingId: string): Promise<void> {
    await this.send({
      type: 'briefing',
      title: 'Good morning! Your daily briefing is ready',
      body: 'Tap to see your priorities for today',
      data: { briefingId },
    });
  }

  /**
   * Send reminder notification
   */
  async sendReminder(reminderId: string, message: string): Promise<void> {
    await this.send({
      type: 'reminder',
      title: 'Reminder',
      body: message,
      data: { reminderId },
    });
  }

  /**
   * Send deadline warning
   */
  async sendDeadlineWarning(taskId: string, title: string, hoursRemaining: number): Promise<void> {
    await this.send({
      type: 'deadline',
      title: 'Deadline approaching',
      body: `"${title}" is due in ${hoursRemaining} hours`,
      data: { taskId },
    });
  }

  private async getExpoPushToken(): Promise<string | null> {
    // TODO: Fetch from creators table
    return null;
  }

  private getPriority(type: string): 'default' | 'normal' | 'high' {
    switch (type) {
      case 'deadline':
      case 'warning':
        return 'high';
      case 'briefing':
        return 'normal';
      default:
        return 'default';
    }
  }

  private async sendToExpo(notification: PushNotification): Promise<void> {
    // TODO: Send via Expo API
    if (!env.EXPO_ACCESS_TOKEN) {
      console.log('Expo token not configured, skipping push');
      return;
    }

    const response = await fetch(this.expoUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.EXPO_ACCESS_TOKEN}`,
      },
      body: JSON.stringify(notification),
    });

    if (!response.ok) {
      console.error('Failed to send push notification:', await response.text());
    }
  }

  private async logNotification(payload: NotificationPayload): Promise<void> {
    // TODO: Save to proactive_notifications table
  }
}
