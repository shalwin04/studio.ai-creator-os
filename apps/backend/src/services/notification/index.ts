/**
 * Notification Service
 *
 * Push notification management via Expo.
 */

import { eq, inArray } from 'drizzle-orm';
import { env } from '../../lib/env.js';
import { getDb } from '../../lib/database.js';
import { creators, proactiveNotifications } from '../../db/schema.js';

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

const EXPO_BATCH_SIZE = 100;

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
      await this.logNotification(this.creatorId, payload);
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

    await this.sendToExpo([notification]);
    await this.logNotification(this.creatorId, payload);
  }

  /**
   * Send to multiple recipients
   */
  async sendBatch(
    payloads: { creatorId: string; payload: NotificationPayload }[]
  ): Promise<void> {
    if (payloads.length === 0) return;

    const db = getDb();
    const creatorIds = [...new Set(payloads.map((p) => p.creatorId))];
    const rows = await db
      .select({ id: creators.id, expoPushToken: creators.expoPushToken })
      .from(creators)
      .where(inArray(creators.id, creatorIds));
    const tokenByCreator = new Map(rows.map((r) => [r.id, r.expoPushToken]));

    const notifications: PushNotification[] = [];
    for (const { creatorId, payload } of payloads) {
      const token = tokenByCreator.get(creatorId);
      if (!token) {
        console.log('No push token registered for creator:', creatorId);
        continue;
      }
      notifications.push({
        to: token,
        title: payload.title,
        body: payload.body,
        data: { type: payload.type, ...payload.data },
        sound: 'default',
        priority: this.getPriority(payload.type),
      });
    }

    for (let i = 0; i < notifications.length; i += EXPO_BATCH_SIZE) {
      await this.sendToExpo(notifications.slice(i, i + EXPO_BATCH_SIZE));
    }

    await Promise.all(payloads.map(({ creatorId, payload }) => this.logNotification(creatorId, payload)));
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
    const db = getDb();
    const creator = await db.query.creators.findFirst({
      where: eq(creators.id, this.creatorId),
    });
    return creator?.expoPushToken ?? null;
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

  private async sendToExpo(notifications: PushNotification[]): Promise<void> {
    if (notifications.length === 0) return;
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
      body: JSON.stringify(notifications),
    });

    if (!response.ok) {
      console.error('Failed to send push notification:', await response.text());
    }
  }

  private async logNotification(creatorId: string, payload: NotificationPayload): Promise<void> {
    const db = getDb();
    await db.insert(proactiveNotifications).values({
      creatorId,
      type: payload.type,
      title: payload.title,
      body: payload.body,
      data: payload.data ?? {},
    });
  }
}
