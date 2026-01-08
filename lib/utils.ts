import { groupMetadataCache } from './GroupMetadataCache.js';
import type { GroupMetadata, GroupParticipant } from 'baileys';

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

export const sleep = (ms: number): Promise<void> =>
    new Promise(resolve => setTimeout(resolve, ms));

export const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('es-ES').format(num);
};

interface NumberSuffix {
    val: number;
    suffix: string;
}

export const formatNumberLarge = (num: number): string => {
    const suffixes: NumberSuffix[] = [
        { val: 1e33, suffix: 'Dc' },
        { val: 1e30, suffix: 'No' },
        { val: 1e27, suffix: 'Oc' },
        { val: 1e24, suffix: 'Sp' },
        { val: 1e21, suffix: 'Sx' },
        { val: 1e18, suffix: 'Qi' },
        { val: 1e15, suffix: 'Qa' },
        { val: 1e12, suffix: 'T' },
        { val: 1e9, suffix: 'B' },
        { val: 1e6, suffix: 'M' },
        { val: 1e3, suffix: 'K' }
    ];

    for (const { val, suffix } of suffixes) {
        if (num >= val) {
            const formatted = (num / val).toFixed(1);
            return (formatted.endsWith('.0') ? Math.floor(num / val) : formatted) + suffix;
        }
    }

    return num.toString();
};

export const getMentions = (text: string): string[] => {
    const matches = text.match(/@(\d+)/g);
    if (!matches) return [];
    return matches.map(m => m.slice(1) + '@s.whatsapp.net');
};

// ============================================================
// ADMIN CHECK FUNCTIONS
// ============================================================

interface BotLike {
    ws?: {
        user?: { id?: string; lid?: string };
        groupMetadata(jid: string): Promise<GroupMetadata>;
    };
    sock?: {
        user?: { id?: string; lid?: string };
        groupMetadata(jid: string): Promise<GroupMetadata>;
    };
    user?: { id?: string; lid?: string };
    groupMetadata?(jid: string): Promise<GroupMetadata>;
}

export const isAdmin = async (bot: BotLike, chatId: string, userId: string): Promise<boolean> => {
    try {
        const sock = bot.ws || bot.sock || bot;

        let groupMetadata: GroupMetadata | undefined;
        try {
            groupMetadata = await groupMetadataCache.get(sock as BotLike, chatId);
        } catch {
            groupMetadata = await (sock as { groupMetadata(jid: string): Promise<GroupMetadata> }).groupMetadata(chatId);
        }

        if (!groupMetadata || !groupMetadata.participants) {
            return false;
        }

        const userNumber = userId.split('@')[0].split(':')[0];

        const participant = groupMetadata.participants.find((p: GroupParticipant) => {
            const participantNumber = p.id.split('@')[0].split(':')[0];
            return participantNumber === userNumber;
        });

        if (!participant) return false;

        return participant.admin === 'admin' || participant.admin === 'superadmin';
    } catch (error) {
        console.error(`[isAdmin] Error:`, (error as Error).message);
        return false;
    }
};

export const isBotAdmin = async (bot: BotLike, chatId: string): Promise<boolean> => {
    try {
        const sock = bot.ws || bot.sock || bot;

        let groupMetadata: GroupMetadata | undefined;
        try {
            groupMetadata = await groupMetadataCache.get(sock as BotLike, chatId);
        } catch {
            groupMetadata = await (sock as { groupMetadata(jid: string): Promise<GroupMetadata> }).groupMetadata(chatId);
        }

        if (!groupMetadata || !groupMetadata.participants) return false;

        const user = (sock as { user?: { id?: string; lid?: string } }).user;
        const botLid = user?.lid?.split(':')[0]?.split('@')[0];
        const botId = user?.id?.split(':')[0]?.split('@')[0];

        const participant = groupMetadata.participants.find((p: GroupParticipant) => {
            const pId = p.id.split(':')[0].split('@')[0];
            return (botLid && pId === botLid) || (botId && pId === botId);
        });

        if (!participant) return false;

        return participant.admin === 'admin' || participant.admin === 'superadmin';
    } catch (error) {
        console.error(`[isBotAdmin] Error:`, (error as Error).message);
        return false;
    }
};

// ============================================================
// HELPER FUNCTIONS
// ============================================================

export const getBuffer = async (url: string): Promise<Buffer> => {
    const response = await fetch(url);
    return Buffer.from(await response.arrayBuffer());
};

export const getRandom = <T>(list: T[]): T => {
    return list[Math.floor(Math.random() * list.length)];
};

export const getGroupAdmins = (participants: GroupParticipant[]): string[] => {
    return participants.filter(p => p.admin).map(p => p.id);
};

export const formatTime = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
};

export const getCooldown = (lastTime: number, cooldownMs: number): number => {
    const now = Date.now();
    const timeLeft = lastTime + cooldownMs - now;
    return timeLeft > 0 ? timeLeft : 0;
};

interface ContextLike {
    message?: {
        extendedTextMessage?: {
            contextInfo?: {
                mentionedJid?: string[];
            };
        };
    };
    body?: string;
    text?: string;
}

export const extractMentions = (ctx: ContextLike): string[] => {
    const mentioned = ctx.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    if (mentioned.length > 0) return mentioned;

    const matches = (ctx.body || ctx.text || '').match(/@(\d+)/g);
    if (!matches) return [];
    return matches.map(m => m.slice(1) + '@s.whatsapp.net');
};

const owners: string[] = [
    '573115434166@s.whatsapp.net',
    '526631079388@s.whatsapp.net',
    '573114910796@s.whatsapp.net'
];

export const isOwner = (userId: string, specificOwner?: string): boolean => {
    if (specificOwner) return userId === specificOwner;
    return owners.includes(userId);
};

export const formatCoins = (amount: number): string => {
    return amount.toLocaleString('es-ES');
};

export const getRandomInt = (min: number, max: number): number => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

export const getName = async (bot: BotLike, chatId: string, userId: string): Promise<string> => {
    try {
        const sock = bot.sock || bot;
        if (chatId.endsWith('@g.us')) {
            const groupMetadata = await groupMetadataCache.get(sock as BotLike, chatId);
            const participant = groupMetadata.participants.find((p: GroupParticipant) => p.id === userId);
            // Could return participant name if available
        }
        return userId.split('@')[0];
    } catch {
        return userId.split('@')[0];
    }
};

export const styleText = (text: string): string => {
    return text
        .replace(/a/g, 'ᥲ')
        .replace(/e/g, 'ꫀ')
        .replace(/t/g, 't')
        .replace(/u/g, 'ᥙ')
        .replace(/x/g, 'ꪎ')
        .replace(/y/g, 'ᥡ');
};
