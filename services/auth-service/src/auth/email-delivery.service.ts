import { Injectable, Logger } from '@nestjs/common';

type EmailPayload = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

@Injectable()
export class EmailDeliveryService {
  private readonly logger = new Logger(EmailDeliveryService.name);

  async send(payload: EmailPayload) {
    const provider = (process.env.EMAIL_PROVIDER ?? 'console').trim().toLowerCase();

    if (provider === 'postmark') {
      await this.sendViaPostmark(payload);
      return;
    }

    if (provider === 'resend') {
      await this.sendViaResend(payload);
      return;
    }

    this.logger.log(`[email:console] to=${payload.to} subject="${payload.subject}"`);
    this.logger.debug(payload.text);
  }

  private async sendViaPostmark(payload: EmailPayload) {
    const token = process.env.POSTMARK_SERVER_TOKEN;
    if (!token) {
      throw new Error('POSTMARK_SERVER_TOKEN is not configured');
    }

    const response = await fetch('https://api.postmarkapp.com/email', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-Postmark-Server-Token': token,
      },
      body: JSON.stringify({
        From: this.resolveFromAddress(),
        To: payload.to,
        Subject: payload.subject,
        TextBody: payload.text,
        HtmlBody: payload.html,
        ReplyTo: process.env.EMAIL_REPLY_TO,
      }),
    });

    if (!response.ok) {
      throw new Error(`Postmark request failed with status ${response.status}`);
    }
  }

  private async sendViaResend(payload: EmailPayload) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('RESEND_API_KEY is not configured');
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: this.resolveFromAddress(),
        to: [payload.to],
        subject: payload.subject,
        text: payload.text,
        html: payload.html,
        reply_to: process.env.EMAIL_REPLY_TO ? [process.env.EMAIL_REPLY_TO] : undefined,
      }),
    });

    if (!response.ok) {
      throw new Error(`Resend request failed with status ${response.status}`);
    }
  }

  private resolveFromAddress() {
    return process.env.EMAIL_FROM ?? 'SynapseHub <no-reply@synapsehub.local>';
  }
}
