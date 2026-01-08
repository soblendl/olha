import { Bot, LocalAuth } from '@imjxsx/wapi';
import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import type TokenService from './TokenService.js';
import type { MessageHandler } from './MessageHandler.js';

// ============================================================
// TYPE DEFINITIONS
// ============================================================

interface Limits {
    MAX_GROUPS: number;
    MAX_CHATS: number;
    COMMANDS_PER_MINUTE: number;
    MESSAGES_PER_MINUTE: number;
    SPAM_TIMEOUT: number;
    RECONNECT_ATTEMPTS: number;
    BACKUP_INTERVAL: number;
}

const BLOCKED_COMMANDS: string[] = [
    'eval', 'exec', 'shell', 'terminal', 'bash', 'cmd',
    'setowner', 'addowner', 'delowner', 'removeowner',
    'restart', 'shutdown', 'update', 'reboot',
    'banuser', 'unbanuser', 'globalban',
    'broadcast', 'bcall', 'bcgc',
    'setprefix', 'setbotname',
    'addprem', 'delprem',
    'clearsession', 'deletesession'
];

const LIMITS: Limits = {
    MAX_GROUPS: 50,
    MAX_CHATS: 200,
    COMMANDS_PER_MINUTE: 30,
    MESSAGES_PER_MINUTE: 60,
    SPAM_TIMEOUT: 5 * 60 * 1000,
    RECONNECT_ATTEMPTS: 5,
    BACKUP_INTERVAL: 5 * 60 * 1000
};

interface PrembotData {
    bot: BotInstance;
    chatId: string;
    sessionPath: string;
    uuid: string;
    tokenId: string;
    userId: string;
    connectedAt: number;
    stats: { messages: number; commands: number };
    rateLimit: { commands: number[]; messages: number[] };
    backupInterval?: ReturnType<typeof setInterval>;
}

interface PendingConnection {
    startTime: number;
    tokenId: string;
}

interface CodeData {
    userId: string;
    tokenId: string;
    createdAt: number;
}

interface RateLimitResult {
    allowed: boolean;
    waitTime?: number;
}

interface PrembotStatus {
    active: boolean;
    userId: string;
    daysRemaining: number;
    expiresAt: string;
    stats: { messages: number; commands: number };
    limits: { groups: string; commandsPerMin: number };
    banned: boolean;
}

interface PrembotInfo {
    userId: string;
    connectedAt: number;
    stats: { messages: number; commands: number };
}

interface StartResult {
    success: boolean;
    message: string;
}

interface StopResult {
    success: boolean;
    message: string;
}

interface BotInstance {
    ws?: {
        ev: {
            on(event: string, handler: (...args: unknown[]) => void): void;
        };
        sendMessage?(jid: string, content: unknown): Promise<unknown>;
    };
    sendMessage(jid: string, content: unknown): Promise<unknown>;
    on(event: string, handler: (...args: unknown[]) => void): void;
    login(method: 'qr' | 'otp'): Promise<void>;
    disconnect?(): void;
}

interface MainSock {
    sendMessage(jid: string, content: unknown): Promise<unknown>;
}

declare global {
    var messageHandler: MessageHandler | undefined;
}

// ============================================================
// PREMBOT MANAGER CLASS
// ============================================================

class PrembotManager {
    private tokenService: TokenService;
    private prembots: Map<string, PrembotData>;
    private pendingConnections: Map<string, PendingConnection>;
    private codes: Map<string, CodeData>;
    private spamTracker: Map<string, unknown>;
    private groupCounts: Map<string, number>;

    constructor(tokenService: TokenService) {
        this.tokenService = tokenService;
        this.prembots = new Map();
        this.pendingConnections = new Map();
        this.codes = new Map();
        this.spamTracker = new Map();
        this.groupCounts = new Map();
    }

    generateCode(): string {
        return Math.random().toString(36).substring(2, 10).toUpperCase();
    }

    isCommandBlocked(command: string): boolean {
        return BLOCKED_COMMANDS.includes(command.toLowerCase());
    }

    createPairingCode(userId: string, tokenId: string): string {
        const code = this.generateCode();
        this.codes.set(code, {
            userId,
            tokenId,
            createdAt: Date.now()
        });
        setTimeout(() => this.codes.delete(code), 5 * 60 * 1000);
        return code;
    }

    async startPrembot(tokenId: string, chatId: string, mainSock: MainSock, phoneNumber: string): Promise<StartResult> {
        const validation = this.tokenService.validateToken(tokenId);
        if (!validation.valid) {
            return { success: false, message: `❌ ${validation.error}` };
        }

        let cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
        if (cleanPhone.length < 10 || cleanPhone.length > 15) {
            return { success: false, message: `❌ Número de teléfono inválido: ${cleanPhone} (${cleanPhone.length} dígitos)` };
        }

        console.log('[Prembot] Phone number received:', phoneNumber);
        console.log('[Prembot] Clean phone number:', cleanPhone);

        const userId = `${cleanPhone}@s.whatsapp.net`;

        if (this.prembots.has(userId)) {
            return { success: false, message: '❌ Ya tienes un Prembot activo' };
        }

        if (this.pendingConnections.has(userId)) {
            return { success: false, message: '❌ Ya hay una conexión en proceso' };
        }

        this.pendingConnections.set(userId, {
            startTime: Date.now(),
            tokenId: tokenId
        });

        try {
            const sessionPath = path.join(process.cwd(), 'prembots', cleanPhone);
            if (fs.existsSync(sessionPath)) {
                fs.rmSync(sessionPath, { recursive: true, force: true });
            }
            fs.mkdirSync(sessionPath, { recursive: true });

            const prembotUUID = uuidv4();
            const auth = new LocalAuth(prembotUUID, sessionPath);
            const account = { jid: '', pn: `${cleanPhone}@s.whatsapp.net`, name: '' };
            console.log('[Prembot] Account config:', JSON.stringify(account));

            const prembotInstance = new Bot(prembotUUID, auth, account) as unknown as BotInstance;

            let isConnected = false;
            let reconnectAttempts = 0;

            const timeout = setTimeout(() => {
                if (!isConnected) {
                    this.pendingConnections.delete(userId);
                    prembotInstance.disconnect?.();
                    mainSock.sendMessage(chatId, {
                        text: '⏰ *Tiempo agotado*\n\nNo se pudo vincular. El token sigue disponible.'
                    }).catch(() => { });
                }
            }, 3 * 60 * 1000);

            prembotInstance.on('otp', async (otpCode: string) => {
                console.log('[Prembot] OTP received:', otpCode);
                const formatted = otpCode.match(/.{1,4}/g)?.join('-') || otpCode;
                await mainSock.sendMessage(chatId, {
                    text: `🌟 *PREMBOT - Código de Vinculación*\n\n` +
                        `\`${formatted}\`\n\n` +
                        `*Pasos:*\n` +
                        `① Abre WhatsApp\n` +
                        `② Dispositivos vinculados\n` +
                        `③ Vincular dispositivo\n` +
                        `④ Vincular con número\n` +
                        `⑤ Ingresa el código\n\n` +
                        `> _Expira en 3 minutos_`
                });
                await mainSock.sendMessage(chatId, { text: otpCode });
            });

            prembotInstance.on('open', async (acc: { name?: string }) => {
                clearTimeout(timeout);
                isConnected = true;
                reconnectAttempts = 0;
                this.pendingConnections.delete(userId);

                this.tokenService.useToken(tokenId, userId);
                this.tokenService.registerPrembot(userId, tokenId);

                const prembotData: PrembotData = {
                    bot: prembotInstance,
                    chatId,
                    sessionPath,
                    uuid: prembotUUID,
                    tokenId,
                    userId,
                    connectedAt: Date.now(),
                    stats: { messages: 0, commands: 0 },
                    rateLimit: { commands: [], messages: [] }
                };

                this.prembots.set(userId, prembotData);
                this.startBackupInterval(userId);

                const userName = acc?.name || 'Usuario';
                await mainSock.sendMessage(chatId, {
                    text: `🌟 *PREMBOT ACTIVADO*\n\n` +
                        `👤 ${userName}\n` +
                        `📱 ${cleanPhone}\n` +
                        `🎫 Token: ${tokenId.slice(0, 15)}...\n\n` +
                        `*Límites:*\n` +
                        `• Grupos: ${LIMITS.MAX_GROUPS}\n` +
                        `• Chats: ${LIMITS.MAX_CHATS}\n` +
                        `• Cmds/min: ${LIMITS.COMMANDS_PER_MINUTE}\n\n` +
                        `> _Usa #prembot status para ver stats_`
                });

                this.setupMessageHandler(prembotInstance, userId);
            });

            prembotInstance.on('close', async (reason: unknown) => {
                console.log('[Prembot] Disconnected:', reason);
                clearTimeout(timeout);

                if (isConnected && reconnectAttempts < LIMITS.RECONNECT_ATTEMPTS) {
                    reconnectAttempts++;
                    console.log(`[Prembot] Reconnecting... Attempt ${reconnectAttempts}`);
                    const backoff = Math.pow(2, reconnectAttempts) * 1000;
                    await new Promise(r => setTimeout(r, backoff));
                    try {
                        await prembotInstance.login('qr');
                    } catch (e) {
                        console.error('[Prembot] Reconnect failed:', (e as Error).message);
                    }
                } else if (!isConnected) {
                    this.pendingConnections.delete(userId);
                    let errorMsg = '❌ No se pudo conectar';
                    const reasonStr = String(reason).toLowerCase();
                    if (reasonStr.includes('401')) errorMsg = '❌ Código inválido';
                    else if (reasonStr.includes('403')) errorMsg = '❌ WhatsApp bloqueó temporalmente';
                    else if (reasonStr.includes('428')) errorMsg = '❌ Máximo de dispositivos alcanzado';
                    else if (reasonStr.includes('515')) errorMsg = '❌ Error de WhatsApp. Reintenta.';
                    mainSock.sendMessage(chatId, { text: errorMsg }).catch(() => { });
                } else {
                    this.prembots.delete(userId);
                }
            });

            prembotInstance.on('error', (err: Error) => {
                console.error('[Prembot] Error:', err);
            });

            console.log('[Prembot] Starting OTP login for:', cleanPhone);
            await prembotInstance.login('otp');
            return { success: true, message: '⏳ Generando código de vinculación...' };

        } catch (error) {
            console.error('[Prembot] Error:', error);
            this.pendingConnections.delete(userId);
            return { success: false, message: '❌ Error: ' + (error as Error).message };
        }
    }

    private setupMessageHandler(prembotInstance: BotInstance, ownerId: string): void {
        prembotInstance.ws?.ev.on('messages.upsert', async ({ messages }: { messages: Array<{ key: { remoteJid: string; fromMe: boolean }; message?: unknown }> }) => {
            for (const m of messages) {
                if (!m.message) continue;

                const chatId = m.key.remoteJid;
                const prembotData = this.prembots.get(ownerId);
                if (!prembotData) continue;

                const msgContent = m.message as { conversation?: string; extendedTextMessage?: { text?: string } };
                const text = msgContent.conversation || msgContent.extendedTextMessage?.text || '';

                if (m.key.fromMe) {
                    const isCommand = text.startsWith('#') || text.startsWith('/') || text.startsWith('!');
                    if (!isCommand) continue;
                }

                if (!this.tokenService.isPrembotActive(ownerId)) {
                    await prembotInstance.sendMessage(chatId, {
                        text: '❌ Este Prembot ha expirado o fue desactivado.'
                    });
                    this.stopPrembot(ownerId);
                    return;
                }

                const rateCheck = this.checkRateLimit(ownerId, 'messages');
                if (!rateCheck.allowed) continue;

                prembotData.stats.messages++;
                this.tokenService.updateStats(ownerId, 'messages');

                if (text.startsWith('#') || text.startsWith('/') || text.startsWith('!')) {
                    const command = text.slice(1).split(' ')[0].toLowerCase();
                    if (this.isCommandBlocked(command)) {
                        await prembotInstance.sendMessage(chatId, {
                            text: '🔒 Este comando está bloqueado en Prembots.'
                        });
                        continue;
                    }

                    const cmdRateCheck = this.checkRateLimit(ownerId, 'commands');
                    if (!cmdRateCheck.allowed) {
                        await prembotInstance.sendMessage(chatId, {
                            text: `⏱ Rate limit excedido. Espera ${Math.ceil((cmdRateCheck.waitTime || 0) / 1000)}s`
                        });
                        continue;
                    }

                    prembotData.stats.commands++;
                    this.tokenService.updateStats(ownerId, 'commands');
                }

                if (global.messageHandler) {
                    try {
                        await global.messageHandler.handleMessage(prembotInstance as unknown as Parameters<typeof global.messageHandler.handleMessage>[0], m as unknown as Parameters<typeof global.messageHandler.handleMessage>[1], true);
                    } catch (err) {
                        console.error('[Prembot] Handler error:', err);
                    }
                }
            }
        });

        prembotInstance.ws?.ev.on('groups.update', (updates: unknown[]) => {
            for (const _update of updates) {
                const currentCount = this.groupCounts.get(ownerId) || 0;
                if (currentCount >= LIMITS.MAX_GROUPS) {
                    console.log(`[Prembot] ${ownerId} hit group limit`);
                }
            }
        });
    }

    private checkRateLimit(userId: string, type: 'commands' | 'messages'): RateLimitResult {
        const prembotData = this.prembots.get(userId);
        if (!prembotData) return { allowed: false };

        const now = Date.now();
        const oneMinAgo = now - 60000;
        const limit = type === 'commands'
            ? LIMITS.COMMANDS_PER_MINUTE
            : LIMITS.MESSAGES_PER_MINUTE;

        prembotData.rateLimit[type] = prembotData.rateLimit[type].filter(t => t > oneMinAgo);

        if (prembotData.rateLimit[type].length >= limit) {
            const oldestTimestamp = prembotData.rateLimit[type][0];
            const waitTime = 60000 - (now - oldestTimestamp);
            return { allowed: false, waitTime };
        }

        prembotData.rateLimit[type].push(now);
        return { allowed: true };
    }

    private startBackupInterval(userId: string): void {
        const prembotData = this.prembots.get(userId);
        if (!prembotData) return;

        prembotData.backupInterval = setInterval(() => {
            this.backupSession(userId);
        }, LIMITS.BACKUP_INTERVAL);
    }

    private backupSession(userId: string): void {
        const prembotData = this.prembots.get(userId);
        if (!prembotData) return;

        try {
            const backupDir = path.join(process.cwd(), 'prembots_backup', userId.split('@')[0]);
            fs.mkdirSync(backupDir, { recursive: true });

            if (fs.existsSync(prembotData.sessionPath)) {
                const files = fs.readdirSync(prembotData.sessionPath);
                for (const file of files) {
                    const src = path.join(prembotData.sessionPath, file);
                    const dest = path.join(backupDir, file);
                    fs.copyFileSync(src, dest);
                }
            }
            console.log(`[Prembot] Backup completed for ${userId}`);
        } catch (error) {
            console.error(`[Prembot] Backup error for ${userId}:`, (error as Error).message);
        }
    }

    stopPrembot(userId: string): StopResult {
        const prembotData = this.prembots.get(userId);
        if (!prembotData) {
            if (this.pendingConnections.has(userId)) {
                this.pendingConnections.delete(userId);
                return { success: true, message: '✅ Conexión cancelada' };
            }
            return { success: false, message: '❌ No tienes un Prembot activo' };
        }

        try {
            if (prembotData.backupInterval) {
                clearInterval(prembotData.backupInterval);
            }
            if (prembotData.bot) {
                prembotData.bot.disconnect?.();
            }
            this.prembots.delete(userId);
            return { success: true, message: '✅ Prembot detenido' };
        } catch {
            return { success: false, message: '❌ Error al detener' };
        }
    }

    getPrembotStatus(userId: string): PrembotStatus | null {
        const prembotData = this.prembots.get(userId);
        const tokenData = this.tokenService.getPrembot(userId);

        if (!prembotData && !tokenData) {
            return null;
        }

        const expiresAt = tokenData?.expiresAt || 0;
        const daysRemaining = Math.max(0, Math.ceil((expiresAt - Date.now()) / (24 * 60 * 60 * 1000)));

        return {
            active: !!prembotData,
            userId,
            daysRemaining,
            expiresAt: new Date(expiresAt).toLocaleDateString(),
            stats: prembotData?.stats || tokenData?.stats || { messages: 0, commands: 0 },
            limits: {
                groups: `${this.groupCounts.get(userId) || 0}/${LIMITS.MAX_GROUPS}`,
                commandsPerMin: LIMITS.COMMANDS_PER_MINUTE
            },
            banned: tokenData?.banned || false
        };
    }

    getAllPrembots(): PrembotInfo[] {
        return Array.from(this.prembots.entries()).map(([userId, data]) => ({
            userId,
            connectedAt: data.connectedAt,
            stats: data.stats
        }));
    }
}

export default PrembotManager;
