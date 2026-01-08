import type { WASocket, WAMessage, GroupMetadata, GroupParticipant } from 'baileys';

export interface Bot {
    ws: WASocket;
    sock?: WASocket;
    login(method: 'qr' | 'pairing'): Promise<void>;
    on(event: string, handler: (...args: unknown[]) => void): void;
}
export interface ReplyOptions {
    quoted?: WAMessage;
    mentions?: string[];
}
export interface MediaOptions extends ReplyOptions {
    caption?: string;
    mimetype?: string;
}
export interface Context {
    sender: string;
    chatId: string;
    isGroup: boolean;
    body: string;
    text: string;
    args: string[];
    command: string;
    pushName: string;
    message: WAMessage;
    reply(text: string, options?: ReplyOptions): Promise<void>;
    replyWithImage(url: string | Buffer, options?: MediaOptions): Promise<void>;
    replyWithVideo(url: string | Buffer, options?: MediaOptions): Promise<void>;
    replyWithAudio(url: string | Buffer, options?: MediaOptions): Promise<void>;
    download(message?: WAMessage): Promise<Buffer>;
    sendMessage(jid: string, content: unknown, options?: ReplyOptions): Promise<void>;
    groupMetadata(jid: string): Promise<GroupMetadata>;
    groupParticipantsUpdate(jid: string, participants: string[], action: 'add' | 'remove' | 'promote' | 'demote'): Promise<void>;
    dbService: DatabaseService;
    gachaService: GachaService;
    streamManager: StreamManager;
    queueManager: QueueManager;
    cacheManager: CacheManager;
    shopService: ShopService;
    levelService: LevelService;
}
export interface Plugin {
    commands: string[];
    execute(ctx: Context): Promise<void>;
    before?(ctx: Context): Promise<boolean>;
}
export interface PluginHandler {
    execute: (ctx: Context) => Promise<void>;
    plugin: string;
}
export interface BeforeHandler {
    plugin: string;
    handler: (ctx: Context) => Promise<boolean>;
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
    dailyStreak?: number;
}
export interface LevelData {
    xp: number;
    level: number;
}
export interface InventoryItem {
    id: string;
    name: string;
    quantity: number;
    type: string;
}
export interface GachaData {
    characters: string[];
    pity: number;
    lastPull?: number;
}
export interface UserData {
    id: string;
    name?: string;
    economy: EconomyData;
    level: LevelData;
    inventory: InventoryItem[];
    gacha?: GachaData;
    warns?: number;
    banned?: boolean;
    premium?: boolean;
    premiumExpiry?: number;
}
export interface GroupSettings {
    welcome: boolean;
    goodbye: boolean;
    antilink: boolean;
    welcomeMessage?: string;
    goodbyeMessage?: string;
    muted?: boolean;
}
export interface GroupData {
    id: string;
    settings: GroupSettings;
    warns: Record<string, number>;
    banned: string[];
}
export interface DatabaseService {
    load(): Promise<Database>;
    save(): Promise<void>;
    getUser(userId: string): UserData;
    setUser(userId: string, data: Partial<UserData>): void;
    getGroup(groupId: string): GroupData;
    setGroup(groupId: string, data: Partial<GroupData>): void;
    gracefulShutdown(): Promise<void>;
}
export interface GachaService {
    load(): Promise<void>;
    pull(userId: string, banner?: string): Promise<GachaPullResult>;
    getInventory(userId: string): string[];
    gracefulShutdown(): Promise<void>;
}
export interface GachaPullResult {
    character: Character;
    rarity: string;
    isNew: boolean;
    pity: number;
}
export interface Character {
    id: string;
    name: string;
    rarity: string;
    image?: string;
    description?: string;
}
export interface StreamManager {
}
export interface QueueManager {
    add<T>(task: () => Promise<T>): Promise<T>;
}
export interface CacheManager {
    get<T>(key: string): T | undefined;
    set<T>(key: string, value: T, ttl?: number): void;
    delete(key: string): void;
    clear(): void;
}
export interface ShopService {
    getItems(): ShopItem[];
    buyItem(userId: string, itemId: string): Promise<BuyResult>;
    sellItem(userId: string, itemId: string, quantity: number): Promise<SellResult>;
}
export interface ShopItem {
    id: string;
    name: string;
    price: number;
    description: string;
    type: string;
}
export interface BuyResult {
    success: boolean;
    message: string;
    item?: ShopItem;
}

export interface SellResult {
    success: boolean;
    message: string;
    coins?: number;
}
export interface LevelService {
    addXp(userId: string, amount: number): Promise<LevelUpResult | null>;
    getLevel(userId: string): LevelData;
}
export interface LevelUpResult {
    newLevel: number;
    previousLevel: number;
}
export interface TokenService {
    load(): Promise<void>;
    generateToken(botId: string): string;
    validateToken(token: string): boolean;
    gracefulShutdown(): Promise<void>;
}
export interface PrembotManager {
    create(userId: string, token: string): Promise<void>;
    delete(userId: string): Promise<void>;
    list(): string[];
}
export interface Database {
    users: Record<string, UserData>;
    groups: Record<string, GroupData>;
}
export type MessageType = 'text' | 'image' | 'video' | 'audio' | 'sticker' | 'document';
export interface RateLimitEntry {
    count: number;
    lastReset: number;
}