import type DatabaseService from '../lib/DatabaseService.js';
import type GachaService from '../lib/GachaService.js';
import type StreamManager from '../lib/StreamManager.js';
import type QueueManager from '../lib/QueueManager.js';
import type CacheManager from '../lib/CacheManager.js';
import type TokenService from '../lib/TokenService.js';
import type PrembotManager from '../lib/PrembotManager.js';
import type { ShopService } from '../lib/ShopService.js';
import type { LevelService } from '../lib/LevelService.js';
import type { MessageHandler } from '../lib/MessageHandler.js';
import type { UserData, GroupData } from './plugin.js';

interface PluginHandler {
    execute: (ctx: unknown) => Promise<void>;
    plugin: string;
}

interface BeforeHandler {
    plugin: string;
    handler: (ctx: unknown) => Promise<boolean>;
}

interface DatabaseType {
    users: Record<string, UserData>;
    groups: Record<string, GroupData>;
    [key: string]: unknown;
}

declare global {
    var db: DatabaseType;
    var dbService: DatabaseService;
    var gachaService: GachaService;
    var streamManager: StreamManager;
    var queueManager: QueueManager;
    var cacheManager: CacheManager;
    var tokenService: TokenService;
    var prembotManager: PrembotManager;
    var shopService: ShopService;
    var levelService: LevelService;
    var commandMap: Map<string, PluginHandler>;
    var beforeHandlers: BeforeHandler[];
    var messageHandler: MessageHandler;
    var botOwner: string;
    var scsearch: Record<string, unknown>;
}

export {};