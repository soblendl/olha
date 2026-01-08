import { styleText } from '../lib/utils.js';
import { ERRORS } from '../lib/constants.js';
import type { WAMessage, GroupMetadata } from 'baileys';
import type DatabaseService from '../lib/DatabaseService.js';
import type GachaService from '../lib/GachaService.js';
import type StreamManager from '../lib/StreamManager.js';
import type QueueManager from '../lib/QueueManager.js';
import type CacheManager from '../lib/CacheManager.js';
import type { ShopService } from '../lib/ShopService.js';
import type { LevelService } from '../lib/LevelService.js';
import type TokenService from '../lib/TokenService.js';
import type PrembotManager from '../lib/PrembotManager.js';
import type { PluginContext, BotSocket } from '../src/types/plugin.js';
import { downloadContentFromMessage } from 'baileys';

// ============================================================
// TYPE DEFINITIONS
// ============================================================

interface BotLike {
    ws: BotSocket;
}

interface Services {
    dbService: DatabaseService;
    gachaService: GachaService;
    streamManager: StreamManager;
    queueManager: QueueManager;
    cacheManager: CacheManager;
    shopService: ShopService;
    levelService: LevelService;
    tokenService: TokenService;
    prembotManager: PrembotManager;
    pluginMarketplace: any;
}

interface CtxData {
    chatId: string;
    sender: string;
    senderLid: string;
    senderPhone: string | null;
    isGroup: boolean;
    body: string;
    text: string;
    args: string[];
    msg: WAMessage;
    userData: UserData;
    from: {
        id: string;
        jid: string;
        name: string;
    };
}

interface UserData {
    stats?: {
        commands?: number;
    };
    [key: string]: unknown;
}

interface Job {
    data: {
        commandName: string;
        ctxData: CtxData;
    };
}

interface CommandData {
    execute: (ctx: PluginContext) => Promise<void | unknown>;
    plugin: string;
}

declare global {
    var commandMap: Map<string, CommandData>;
}

let wapiModule: typeof import('@imjxsx/wapi') | null = null;

const getWapi = async () => {
    if (!wapiModule) {
        wapiModule = await import('@imjxsx/wapi');
    }
    return wapiModule;
};

// ============================================================
// COMMAND WORKER SETUP
// ============================================================

export function setupCommandWorker(bot: BotLike, services: Services): void {
    const queue = services.queueManager.getQueue('commandQueue');

    queue.process(1, async (job: Job) => {
        const { commandName, ctxData } = job.data;
        const commandData = global.commandMap.get(commandName);

        if (!commandData) {
            console.error(`Command worker: Command '${commandName}' not found.`);
            return;
        }

        const ctx: PluginContext = {
            ...ctxData,
            ...services,
            prefix: '#', // Default prefix if not provided in ctxData
            command: commandName,
            mentionedJid: [], // Initialize or extract if available
            bot: {
                sendMessage: async (jid: string, content: unknown, options?: unknown) => {
                    return await bot.ws.sendMessage(jid, content, options);
                },
                sock: bot.ws,
                groupMetadata: async (jid: string) => {
                    return await bot.ws.groupMetadata(jid);
                },
                groupParticipantsUpdate: async (jid: string, participants: string[], action: string) => {
                    return await bot.ws.groupParticipantsUpdate(jid, participants, action as 'add' | 'remove' | 'promote' | 'demote');
                },
                relayMessage: async (jid: string, message: unknown, options: unknown) => {
                    return await bot.ws.relayMessage(jid, message, options);
                },
                downloadMediaMessage: async (message: unknown) => {
                     // Temporary/Partial implementation for wrapper
                     // Ideally we should use downloadMediaMessage from baileys directly or via bot.ws if exposed
                     // But bot.ws is BotSocket which might not have it directly if it's not in the interface
                     // PluginContext expects: downloadMediaMessage(message: unknown): Promise<Buffer>;
                     try {
                        // Assuming message is a WAMessage
                        const msg = message as WAMessage;
                        if (!msg.message) throw new Error('No message content');
                        const type = Object.keys(msg.message)[0] as keyof typeof msg.message;
                         if (!type) throw new Error('No message type');
                        const stream = await downloadContentFromMessage(
                            msg.message[type] as any,
                            type.replace('Message', '') as any
                        );
                        let buffer = Buffer.from([]);
                        for await (const chunk of stream) {
                            buffer = Buffer.concat([buffer, chunk]);
                        }
                        return buffer;
                     } catch (e) {
                         console.error('downloadMediaMessage error', e);
                         return Buffer.from([]);
                     }
                },
                // Add index signature to satisfy PluginContext.bot which has [key: string]: unknown
                // And explicitly add missing methods from PluginContext.bot if any.
                // PluginContext.bot requests:
                // sendMessage, sock, groupMetadata, groupParticipantsUpdate, downloadMediaMessage, relayMessage
                // We have all these above.
            },
            reply: async (text: string, options: Record<string, unknown> = {}) => {
                return await bot.ws.sendMessage(ctxData.chatId, { text, ...options }, { quoted: ctxData.msg });
            },
            replyWithAudio: async (url: string | Buffer, options: Record<string, unknown> = {}) => {
                const content = Buffer.isBuffer(url) ? { audio: url } : { audio: { url } };
                return await bot.ws.sendMessage(ctxData.chatId, { ...content, mimetype: 'audio/mpeg', ...options }, { quoted: ctxData.msg });
            },
            replyWithVideo: async (url: string | Buffer, options: Record<string, unknown> = {}) => {
                const content = Buffer.isBuffer(url) ? { video: url } : { video: { url } };
                return await bot.ws.sendMessage(ctxData.chatId, { ...content, ...options }, { quoted: ctxData.msg });
            },
            replyWithImage: async (url: string | Buffer, options: Record<string, unknown> = {}) => {
                const content = Buffer.isBuffer(url) ? { image: url } : { image: { url } };
                return await bot.ws.sendMessage(ctxData.chatId, { ...content, ...options }, { quoted: ctxData.msg });
            },
            download: async (message?: WAMessage) => {
                const msg = message || ctxData.msg;
                if (!msg.message) throw new Error('No message to download');
                const type = Object.keys(msg.message)[0] as keyof typeof msg.message;
                const stream = await downloadContentFromMessage(
                    msg.message[type] as Parameters<typeof downloadContentFromMessage>[0],
                    type.replace('Message', '') as Parameters<typeof downloadContentFromMessage>[1]
                );
                let buffer = Buffer.from([]);
                for await (const chunk of stream) {
                    buffer = Buffer.concat([buffer, chunk]);
                }
                return buffer;
            }
        };

        try {
            await commandData.execute(ctx);
            if (!ctx.userData.stats) ctx.userData.stats = {};
            ctx.userData.stats.commands = (ctx.userData.stats.commands || 0) + 1;
            services.dbService.markDirty();
        } catch (error) {
            console.error(`Error executing command '${commandName}' in worker:`, error);
            try {
                await ctx.reply(styleText(ERRORS.GENERIC_ERROR));
            } catch (e) {
                console.error(`Failed to send error reply for command '${commandName}':`, e);
            }
        }
    });

    console.log('👷‍♂️ Command worker is ready to process jobs.');
}
