interface ReplyListenerLiveConfig {
    discordBotToken: string;
    discordChannelId: string;
    telegramBotToken: string;
    telegramChatId: string;
}
interface ReplyListenerLiveEnvResolution {
    enabled: boolean;
    missing: string[];
    config: ReplyListenerLiveConfig | null;
}
interface ReplyListenerLiveSmokeResult {
    discordMessageId: string;
    telegramMessageId: string;
}
interface ReplyListenerLiveSmokeDeps {
    fetchImpl?: typeof fetch;
    log?: (message: string) => void;
}
export declare function resolveReplyListenerLiveEnv(env?: NodeJS.ProcessEnv): ReplyListenerLiveEnvResolution;
export declare function runReplyListenerLiveSmoke(config: ReplyListenerLiveConfig, deps?: ReplyListenerLiveSmokeDeps): Promise<ReplyListenerLiveSmokeResult>;
export declare function main(): Promise<void>;
export {};
//# sourceMappingURL=test-reply-listener-live.d.ts.map