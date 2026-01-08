import type { WAMessage, GroupMetadata, GroupParticipant } from 'baileys';
import type PrembotManager from '../../lib/PrembotManager.js';
import type { ShopService } from '../../lib/ShopService.js';
import type { LevelService } from '../../lib/LevelService.js';
import type TokenService from '../../lib/TokenService.js';
import type StreamManager from '../../lib/StreamManager.js';
import type QueueManager from '../../lib/QueueManager.js';
import type CacheManager from '../../lib/CacheManager.js';

export interface PluginContext {
    bot: {
        sendMessage(jid: string, content: unknown, options?: unknown): Promise<unknown>;
        sock: BotSocket;
        groupMetadata(jid: string): Promise<GroupMetadata>;
        groupParticipantsUpdate(jid: string, participants: string[], action: 'add' | 'remove' | 'promote' | 'demote'): Promise<unknown>;
        downloadMediaMessage(message: unknown): Promise<Buffer>;
        relayMessage(jid: string, message: unknown, options: unknown): Promise<unknown>;
        [key: string]: unknown;
    };
    msg: WAMessage;
    quoted?: WAMessage;
    sender: string;
    senderLid: string;
    senderPhone: string | null;
    chatId: string;
    isGroup: boolean;
    body: string;
    text: string;
    args: string[];
    command?: string;
    prefix: string;
    userData: UserData;
    mentionedJid: string[];
    from: {
        id: string;
        jid: string;
        name: string;
    };
    dbService: {
        getUser(userId: string, aliasId?: string | null): UserData;
        updateUser(userId: string, updates: Record<string, unknown>): boolean;
        getGroup(groupId: string): GroupData;
        updateGroup(groupId: string, updates: Record<string, unknown>): boolean;
        save(): Promise<void>;
        markDirty(): void;
        getUserCount(): number;
        getAllUsers(): UserData[];
        [key: string]: unknown;
    };
    gachaService: {
        characters: Character[];
        getById(id: string): Character | undefined;
        getUserCharacters(userId: string): Character[];
        transferCharacter(characterId: string, newOwner: string): { success: boolean; message?: string; character?: Character; previousOwner?: string };
        save(): Promise<void>;
        [key: string]: unknown;
    };
    streamManager: StreamManager;
    queueManager: QueueManager;
    cacheManager: {
        get<T>(key: string): T | undefined;
        set(key: string, value: unknown, ttl?: number): void;
        [key: string]: unknown;
    } | CacheManager;
    shopService: ShopService;
    levelService: LevelService;
    tokenService: TokenService;
    prembotManager: PrembotManager;
    pluginMarketplace: any;
    reply(text: string, options?: ReplyOptions): Promise<void | unknown>;
    replyWithAudio(url: string | Buffer, options?: MediaOptions): Promise<void | unknown>;
    replyWithVideo(url: string | Buffer, options?: MediaOptions): Promise<void | unknown>;
    replyWithImage(url: string | Buffer, options?: MediaOptions): Promise<void | unknown>;
    download(message?: WAMessage): Promise<Buffer>;
}
export interface BotSocket {
    sendMessage(jid: string, content: unknown, options?: unknown): Promise<unknown>;
    groupMetadata(jid: string): Promise<GroupMetadata>;
    groupParticipantsUpdate(jid: string, participants: string[], action: 'add' | 'remove' | 'promote' | 'demote'): Promise<unknown>;
    groupSettingUpdate(jid: string, setting: 'announcement' | 'not_announcement' | 'locked' | 'unlocked'): Promise<unknown>;
    profilePictureUrl(jid: string, type?: 'preview' | 'image'): Promise<string | undefined>;
    groupInviteCode(jid: string): Promise<string>;
    updateMediaMessage(message: unknown): Promise<unknown>;
    relayMessage(jid: string, message: unknown, options: unknown): Promise<unknown>;
    user?: { id?: string; lid?: string };
    [key: string]: unknown;
}
export interface ReplyOptions {
    quoted?: WAMessage;
    mentions?: string[];
    [key: string]: unknown;
}
export interface MediaOptions extends ReplyOptions {
    caption?: string;
    mimetype?: string;
}
export interface Character {
    id: string;
    name: string;
    gender?: string;
    source?: string;
    image?: string;
    rarity?: string;
    owner?: string;
    claimedAt?: number;
    transferredAt?: number;
    votes?: Record<string, number>;
    voteCount?: number;
    disabled?: boolean;
    value?: number;
}
export interface ProfileData {
    birthday?: string;
    gender?: string;
    [key: string]: unknown;
}

export interface UserData {
    id: string;
    economy: EconomyData;
    gacha?: GachaData;
    stats?: StatsData;
    level?: LevelData;
    inventory?: InventoryItem[];
    profile?: ProfileData;
    createdAt?: number;
    monedas?: number;
    antirobo?: number;
    desbloqueo?: number;
    [key: string]: unknown;
}
export interface GroupData {
    id: string;
    settings: {
        welcome: boolean;
        goodbye: boolean;
        antilink: boolean;
        economy: boolean;
        nsfw: boolean;
        [key: string]: unknown;
    };
    alerts: string[];
    stats: {
        messages: number;
    };
    [key: string]: unknown;
}
export interface EconomyData {
    coins: number;
    bank: number;
    lastDaily?: number;
    lastWork?: number;
    lastCrime?: number;
    lastSlut?: number;
    lastBeg?: number;
    lastFish?: number;
    lastSteal?: number;
    fishCaught?: number;
    dailyStreak?: number;
    [key: string]: unknown;
}
export interface GachaData {
    characters: Character[];
    lastClaim?: number;
    votes?: Record<string, number>;
    [key: string]: unknown;
}
export interface StatsData {
    messages?: number;
    commands?: number;
}
export interface LevelData {
    xp: number;
    lvl: number;
    lastXp?: number;
}
export interface InventoryItem {
    id: string;
    count: number;
    acquiredAt: number;
}
export interface Plugin {
    commands: string[];
    execute(ctx: PluginContext): Promise<void | unknown>;
    before?(ctx: PluginContext): Promise<boolean>;
    category?: string;
    description?: string;
    usage?: string;
}

export type { GroupMetadata, GroupParticipant, WAMessage };

declare global {
    var scsearch: Record<string, any>;
}