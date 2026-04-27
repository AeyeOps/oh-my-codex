import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { sendDiscord, sendDiscordBot, sendSlack, sendWebhook, dispatchNotifications, } from '../dispatcher.js';
const basePayload = {
    event: 'session-idle',
    sessionId: 'test-session-123',
    message: 'Test notification message',
    timestamp: new Date('2025-01-15T12:00:00Z').toISOString(),
    projectPath: '/home/user/project',
    projectName: 'project',
};
// ---------------------------------------------------------------------------
// sendDiscord
// ---------------------------------------------------------------------------
describe('sendDiscord', () => {
    it('returns error when not enabled', async () => {
        const config = { enabled: false, webhookUrl: '' };
        const result = await sendDiscord(config, basePayload);
        assert.equal(result.success, false);
        assert.equal(result.platform, 'discord');
        assert.ok(result.error?.includes('Not configured'));
    });
    it('returns error when webhookUrl is empty', async () => {
        const config = { enabled: true, webhookUrl: '' };
        const result = await sendDiscord(config, basePayload);
        assert.equal(result.success, false);
    });
    it('rejects invalid webhook URL (non-discord host)', async () => {
        const config = {
            enabled: true,
            webhookUrl: 'https://evil.com/webhook',
        };
        const result = await sendDiscord(config, basePayload);
        assert.equal(result.success, false);
        assert.equal(result.error, 'Invalid webhook URL');
    });
    it('rejects http:// webhook URL', async () => {
        const config = {
            enabled: true,
            webhookUrl: 'http://discord.com/api/webhooks/123/abc',
        };
        const result = await sendDiscord(config, basePayload);
        assert.equal(result.success, false);
        assert.equal(result.error, 'Invalid webhook URL');
    });
    it('rejects malformed URL', async () => {
        const config = {
            enabled: true,
            webhookUrl: 'not-a-url',
        };
        const result = await sendDiscord(config, basePayload);
        assert.equal(result.success, false);
        assert.equal(result.error, 'Invalid webhook URL');
    });
});
// ---------------------------------------------------------------------------
// sendDiscordBot
// ---------------------------------------------------------------------------
describe('sendDiscordBot', () => {
    it('returns error when not enabled', async () => {
        const config = { enabled: false };
        const result = await sendDiscordBot(config, basePayload);
        assert.equal(result.success, false);
        assert.equal(result.platform, 'discord-bot');
        assert.ok(result.error?.includes('Not enabled'));
    });
    it('returns error when missing botToken', async () => {
        const config = {
            enabled: true,
            channelId: '123456',
        };
        const result = await sendDiscordBot(config, basePayload);
        assert.equal(result.success, false);
        assert.ok(result.error?.includes('Missing botToken or channelId'));
    });
    it('returns error when missing channelId', async () => {
        const config = {
            enabled: true,
            botToken: 'token',
        };
        const result = await sendDiscordBot(config, basePayload);
        assert.equal(result.success, false);
        assert.ok(result.error?.includes('Missing botToken or channelId'));
    });
});
// ---------------------------------------------------------------------------
// sendSlack
// ---------------------------------------------------------------------------
describe('sendSlack', () => {
    it('returns error when not enabled', async () => {
        const config = { enabled: false, webhookUrl: '' };
        const result = await sendSlack(config, basePayload);
        assert.equal(result.success, false);
        assert.equal(result.platform, 'slack');
    });
    it('rejects invalid slack webhook URL', async () => {
        const config = {
            enabled: true,
            webhookUrl: 'https://evil.com/services/hook',
        };
        const result = await sendSlack(config, basePayload);
        assert.equal(result.success, false);
        assert.equal(result.error, 'Invalid webhook URL');
    });
    it('rejects http:// slack webhook URL', async () => {
        const config = {
            enabled: true,
            webhookUrl: 'http://hooks.slack.com/services/test',
        };
        const result = await sendSlack(config, basePayload);
        assert.equal(result.success, false);
        assert.equal(result.error, 'Invalid webhook URL');
    });
});
// ---------------------------------------------------------------------------
// sendWebhook
// ---------------------------------------------------------------------------
describe('sendWebhook', () => {
    it('returns error when not enabled', async () => {
        const config = { enabled: false, url: '' };
        const result = await sendWebhook(config, basePayload);
        assert.equal(result.success, false);
        assert.equal(result.platform, 'webhook');
    });
    it('rejects http:// URL (requires HTTPS)', async () => {
        const config = {
            enabled: true,
            url: 'http://example.com/hook',
        };
        const result = await sendWebhook(config, basePayload);
        assert.equal(result.success, false);
        assert.equal(result.error, 'Invalid URL (HTTPS required)');
    });
    it('rejects malformed URL', async () => {
        const config = {
            enabled: true,
            url: 'not-a-url',
        };
        const result = await sendWebhook(config, basePayload);
        assert.equal(result.success, false);
        assert.equal(result.error, 'Invalid URL (HTTPS required)');
    });
});
// ---------------------------------------------------------------------------
// dispatchNotifications
// ---------------------------------------------------------------------------
describe('dispatchNotifications', () => {
    it('returns empty results when no platforms enabled', async () => {
        const config = { enabled: true };
        const result = await dispatchNotifications(config, 'session-idle', basePayload);
        assert.equal(result.event, 'session-idle');
        assert.equal(result.results.length, 0);
        assert.equal(result.anySuccess, false);
    });
    it('returns empty when config disabled', async () => {
        const config = {
            enabled: true,
            discord: { enabled: false, webhookUrl: '' },
        };
        const result = await dispatchNotifications(config, 'session-end', basePayload);
        assert.equal(result.results.length, 0);
        assert.equal(result.anySuccess, false);
    });
    it('dispatches to enabled platforms and collects results', async () => {
        const config = {
            enabled: true,
            discord: { enabled: true, webhookUrl: 'not-valid' },
            slack: { enabled: true, webhookUrl: 'not-valid' },
        };
        const result = await dispatchNotifications(config, 'session-end', basePayload);
        assert.ok(result.results.length > 0);
        // Both should fail (invalid URLs)
        assert.equal(result.anySuccess, false);
    });
    it('uses event-level platform config when present', async () => {
        const config = {
            enabled: true,
            events: {
                'session-end': {
                    enabled: true,
                    discord: { enabled: true, webhookUrl: 'invalid-url' },
                },
            },
        };
        const result = await dispatchNotifications(config, 'session-end', basePayload);
        assert.ok(result.results.length > 0);
        assert.equal(result.results[0].platform, 'discord');
    });
    it('falls back to top-level config when event has no platform override', async () => {
        const config = {
            enabled: true,
            discord: { enabled: true, webhookUrl: 'invalid-url' },
            events: {
                'session-start': { enabled: true },
            },
        };
        const result = await dispatchNotifications(config, 'session-start', basePayload);
        assert.ok(result.results.length > 0);
        assert.equal(result.results[0].platform, 'discord');
    });
});
//# sourceMappingURL=dispatcher.test.js.map