import { fileURLToPath } from 'url';
import path from 'path';
import { PREFIXES, RATE_LIMIT, ERRORS } from './constants.js';
import { styleText } from './utils.js';
import type { WAMessage, GroupMetadata } from 'baileys';
import type DatabaseService from './DatabaseService.js';
import type GachaService from './GachaService.js';
import type StreamManager from './StreamManager.js';
import type QueueManager from './QueueManager.js';
import type CacheManager from './CacheManager.js';
import type { ShopService } from './ShopService.js';
import type { LevelService } from './LevelService.js';

// ============================================================
// TYPE DEFINITIONS
// ============================================================

interface RateLimitData {
    lastCommand: number;
    count: number;
    timeout: number | null;
}

interface RateLimitResult {
    limited: boolean;
    message?: string;
}

interface BotLike {
    ws: {
        sendMessage(jid: string, content: unknown, options?: unknown): Promise<unknown>;
        groupMetadata(jid: string): Promise<GroupMetadata>;
        groupParticipantsUpdate(jid: string, participants: string[], action: 'add' | 'remove' | 'promote' | 'demote'): Promise<unknown>;
        user?: { id?: string; lid?: string };
    };
}

interface Context {
    bot: {
        sendMessage(jid: string, content: unknown, options?: unknown): Promise<unknown>;
        sock: BotLike['ws'];
        groupMetadata(jid: string): Promise<GroupMetadata>;
        groupParticipantsUpdate(jid: string, participants: string[], action: string): Promise<unknown>;
    };
    msg: WAMessage;
    sender: string;
    senderLid: string;
    senderPhone: string | null;
    chatId: string;
    isGroup: boolean;
    body: string;
    text: string;
    args: string[];
    command?: string;
    userData: unknown;
    dbService: DatabaseService;
    gachaService: GachaService;
    streamManager: StreamManager;
    queueManager: QueueManager;
    cacheManager: CacheManager;
    shopService: ShopService;
    levelService: LevelService;
    tokenService: unknown;
    prembotManager: unknown;
    from: {
        id: string;
        jid: string;
        name: string;
    };
    reply(text: string, options?: Record<string, unknown>): Promise<unknown>;
    replyWithAudio(url: string, options?: Record<string, unknown>): Promise<unknown>;
    replyWithVideo(url: string, options?: Record<string, unknown>): Promise<unknown>;
    replyWithImage(url: string, options?: Record<string, unknown>): Promise<unknown>;
    download(message?: WAMessage): Promise<Buffer>;
    prefix: string;
}

interface BeforeHandler {
    handler: (ctx: Context) => Promise<boolean>;
    plugin: string;
}

interface CommandData {
    execute: (ctx: Context) => Promise<void>;
    plugin: string;
}

declare global {
    var beforeHandlers: BeforeHandler[] | undefined;
    var commandMap: Map<string, CommandData>;
    var tokenService: unknown;
    var prembotManager: unknown;
}

let wapiModule: typeof import('@imjxsx/wapi') | null = null;

const getWapi = async () => {
    if (!wapiModule) {
        wapiModule = await import('@imjxsx/wapi');
    }
    return wapiModule;
};

// ============================================================
// MESSAGE HANDLER CLASS
// ============================================================

export class MessageHandler {
    private dbService: DatabaseService;
    private gachaService: GachaService;
    private streamManager: StreamManager;
    private queueManager: QueueManager;
    private cacheManager: CacheManager;
    private shopService: ShopService;
    private levelService: LevelService;
    private PREFIX: string;
    private rateLimitMap: Map<string, RateLimitData>;
    private processedMessages: Map<string, number>;

    constructor(
        dbService: DatabaseService,
        gachaService: GachaService,
        streamManager: StreamManager,
        queueManager: QueueManager,
        cacheManager: CacheManager,
        shopService: ShopService,
        levelService: LevelService
    ) {
        this.dbService = dbService;
        this.gachaService = gachaService;
        this.streamManager = streamManager;
        this.queueManager = queueManager;
        this.cacheManager = cacheManager;
        this.shopService = shopService;
        this.levelService = levelService;
        this.PREFIX = '#';
        this.rateLimitMap = new Map();
        this.processedMessages = new Map();
        setInterval(() => this.cleanup(), 30000);
    }

    private cleanup(): void {
        const now = Date.now();
        for (const [userId, data] of this.rateLimitMap) {
            if (now - data.lastCommand > RATE_LIMIT.SPAM_WINDOW) {
                this.rateLimitMap.delete(userId);
            }
        }
        for (const [msgId, timestamp] of this.processedMessages) {
            if (now - timestamp > 5000) {
                this.processedMessages.delete(msgId);
            }
        }
    }

    private checkRateLimit(userId: string): RateLimitResult {
        const now = Date.now();
        let userData = this.rateLimitMap.get(userId);
        if (!userData) {
            this.rateLimitMap.set(userId, { lastCommand: now, count: 1, timeout: null });
            return { limited: false };
        }
        if (userData.timeout && now < userData.timeout) {
            return { limited: true, message: ERRORS.SPAM_DETECTED };
        } else if (userData.timeout) {
            userData.timeout = null;
            userData.count = 0;
        }
        if (now - userData.lastCommand < RATE_LIMIT.COMMAND_COOLDOWN) {
            userData.count++;
            if (userData.count >= RATE_LIMIT.SPAM_THRESHOLD) {
                userData.timeout = now + RATE_LIMIT.SPAM_TIMEOUT;
                return { limited: true, message: ERRORS.SPAM_DETECTED };
            }
            return { limited: true, message: ERRORS.RATE_LIMITED };
        }
        if (now - userData.lastCommand > RATE_LIMIT.SPAM_WINDOW) {
            userData.count = 1;
        } else {
            userData.count++;
        }
        userData.lastCommand = now;
        return { limited: false };
    }

    private isDuplicate(messageId: string): boolean {
        if (this.processedMessages.has(messageId)) {
            return true;
        }
        this.processedMessages.set(messageId, Date.now());
        return false;
    }

    async handleMessage(bot: BotLike, m: WAMessage, isPrembot: boolean = false): Promise<void> {
        if (!m.message) {
            return;
        }

        const messageType = Object.keys(m.message)[0];
        let text = '';

        if (messageType === 'conversation') {
            text = (m.message as { conversation?: string }).conversation || '';
        } else if (messageType === 'extendedTextMessage') {
            text = (m.message as { extendedTextMessage?: { text?: string } }).extendedTextMessage?.text || '';
        } else if (messageType === 'imageMessage') {
            text = (m.message as { imageMessage?: { caption?: string } }).imageMessage?.caption || '';
        } else if (messageType === 'videoMessage') {
            text = (m.message as { videoMessage?: { caption?: string } }).videoMessage?.caption || '';
        }

        try {
            if (m.key.fromMe && !isPrembot) {
                return;
            }

            const messageId = m.key.id;
            if (!messageId || this.isDuplicate(messageId)) {
                return;
            }

            const chatId = m.key.remoteJid;
            if (!chatId) return;

            let sender = m.key.participant || m.key.remoteJid || '';
            const senderLid = sender;
            let senderPhone: string | null = null;

            const participantAlt = (m.key as { participantAlt?: string }).participantAlt;
            const remoteJidAlt = (m.key as { remoteJidAlt?: string }).remoteJidAlt;
            const senderAlt = (m as { senderAlt?: string }).senderAlt;

            if (participantAlt?.includes('@s.whatsapp.net')) {
                senderPhone = participantAlt.split(':')[0].split('@')[0];
            } else if (remoteJidAlt?.includes('@s.whatsapp.net')) {
                senderPhone = remoteJidAlt.split(':')[0].split('@')[0];
            } else if (senderAlt?.includes('@s.whatsapp.net')) {
                senderPhone = senderAlt.split(':')[0].split('@')[0];
            } else if (sender.includes('@s.whatsapp.net')) {
                senderPhone = sender.split(':')[0].split('@')[0];
            } else if (!chatId.endsWith('@g.us') && chatId.includes('@s.whatsapp.net')) {
                senderPhone = chatId.split(':')[0].split('@')[0];
            } else if (m.key.fromMe && bot.ws?.user?.id) {
                senderPhone = bot.ws.user.id.split(':')[0].split('@')[0];
            }

            if (sender.includes('@lid') && senderPhone) {
                sender = `${senderPhone}@s.whatsapp.net`;
            } else if (sender.includes('@lid')) {
                const lidMatch = sender.match(/^(\d+)/);
                if (lidMatch) {
                    sender = `${lidMatch[1]}@s.whatsapp.net`;
                }
            }

            const isGroup = chatId.endsWith('@g.us');

            const ctx: Context = {
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
                    }
                },
                msg: m,
                sender: sender,
                senderLid: senderLid,
                senderPhone: senderPhone,
                chatId: chatId,
                isGroup: isGroup,
                body: text,
                text: text,
                args: [],
                userData: this.dbService.getUser(sender, senderLid),
                dbService: this.dbService,
                gachaService: this.gachaService,
                streamManager: this.streamManager,
                queueManager: this.queueManager,
                cacheManager: this.cacheManager,
                shopService: this.shopService,
                levelService: this.levelService,
                tokenService: global.tokenService,
                prembotManager: global.prembotManager,
                from: {
                    id: sender,
                    jid: sender,
                    name: m.pushName || 'Usuario'
                },
                reply: async (replyText: string, options: Record<string, unknown> = {}) => {
                    return await bot.ws.sendMessage(chatId, { text: replyText, ...options }, { quoted: m });
                },
                replyWithAudio: async (url: string, options: Record<string, unknown> = {}) => {
                    return await bot.ws.sendMessage(chatId, {
                        audio: { url },
                        mimetype: 'audio/mpeg',
                        ...options
                    }, { quoted: m });
                },
                replyWithVideo: async (url: string, options: Record<string, unknown> = {}) => {
                    return await bot.ws.sendMessage(chatId, {
                        video: { url },
                        ...options
                    }, { quoted: m });
                },
                replyWithImage: async (url: string, options: Record<string, unknown> = {}) => {
                    return await bot.ws.sendMessage(chatId, {
                        image: { url },
                        ...options
                    }, { quoted: m });
                },
                download: async (message?: WAMessage) => {
                    const wapi = await getWapi();
                    const { downloadContentFromMessage } = wapi;
                    const msg = message || m;
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
                },
                prefix: this.PREFIX
            };

            // XP System
            const lastXp = this.cacheManager.get<boolean>(`xp_${sender}`);
            if (!lastXp && text.length > 3) {
                const xpAmount = Math.floor(Math.random() * 6) + 5;
                this.levelService.addXp(sender, xpAmount).then(res => {
                    if (res.leveledUp) {
                        ctx.reply(styleText(`🎉 *¡SUBISTE DE NIVEL!*\n\n> Nivel: *${res.currentLevel}*`));
                    }
                }).catch(e => console.error('XP Error:', e));
                this.cacheManager.set(`xp_${sender}`, true, 30);
            }

            if (global.beforeHandlers?.length && global.beforeHandlers.length > 0) {
                const results = await Promise.allSettled(
                    global.beforeHandlers.map(({ handler, plugin }) =>
                        handler(ctx).catch(err => {
                            console.error(`Error in before handler for ${plugin}:`, err);
                            throw err;
                        })
                    )
                );
                results.forEach((result, idx) => {
                    if (result.status === 'rejected' && global.beforeHandlers) {
                        console.error(`Before handler ${global.beforeHandlers[idx].plugin} failed`);
                    }
                });
            }

            const prefix = PREFIXES.find(p => text.startsWith(p));
            if (!text || !prefix) {
                return;
            }

            const rateCheck = this.checkRateLimit(sender);
            if (rateCheck.limited) {
                if (rateCheck.message === ERRORS.SPAM_DETECTED) {
                    const lastWarning = this.cacheManager.get<boolean>(`spam_warn_${sender}`);
                    if (!lastWarning) {
                        await ctx.reply(styleText(rateCheck.message));
                        this.cacheManager.set(`spam_warn_${sender}`, true, 30);
                    }
                }
                return;
            }

            const args = text.slice(prefix.length).trim().split(/\s+/);
            const commandName = args.shift()?.toLowerCase();
            ctx.args = args;
            ctx.command = commandName;

            if (!commandName) return;

            const commandData = global.commandMap.get(commandName);
            if (!commandData) {
                const fkontak = {
                    key: { participants: '0@s.whatsapp.net', remoteJid: 'status@broadcast', fromMe: false, id: 'Halo' },
                    message: {
                        contactMessage: {
                            vcard: `BEGIN:VCARD\nVERSION:3.0\nN:Sy;Bot;;;\nFN:y\nitem1.TEL;waid=${sender.split('@')[0]}:${sender.split('@')[0]}\nitem1.X-ABLabel:Ponsel\nEND:VCARD`
                        }
                    },
                    participant: '0@s.whatsapp.net'
                };
                await bot.ws.sendMessage(chatId, {
                    text: styleText(`(ó﹏ò｡) Lo siento, el comando *${commandName}* no existe en mis comandos.`)
                }, { quoted: fkontak });
                return;
            }

            await commandData.execute(ctx);

            const userData = ctx.userData as { stats?: { commands?: number } };
            if (!userData.stats) userData.stats = {};
            userData.stats.commands = (userData.stats.commands || 0) + 1;
            this.dbService.markDirty();

        } catch (error) {
            console.error('ꕤ Error procesando mensaje:', error);
            const prefix = PREFIXES.find(p => text.startsWith(p));
            if (prefix && text.trim().length > prefix.length) {
                const chatId = m.key.remoteJid;
                if (chatId) {
                    try {
                        await bot.ws.sendMessage(chatId, {
                            text: styleText(ERRORS.GENERIC_ERROR)
                        }, { quoted: m });
                    } catch { }
                }
            }
        }
    }
}
