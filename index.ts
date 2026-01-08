import { Bot, LocalAuth } from '@imjxsx/wapi';
import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import DatabaseService from './lib/DatabaseService.js';
import GachaService from './lib/GachaService.js';
import StreamManager from './lib/StreamManager.js';
import QueueManager from './lib/QueueManager.js';
import CacheManager from './lib/CacheManager.js';
import TokenService from './lib/TokenService.js';
import PrembotManager from './lib/PrembotManager.js';
import { ShopService } from './lib/ShopService.js';
import { LevelService } from './lib/LevelService.js';
import { MessageHandler } from './lib/MessageHandler.js';
import { WelcomeHandler } from './lib/WelcomeHandler.js';
import { setupCommandWorker } from './workers/commandWorker.js';
import type { WAMessage } from 'baileys';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================
// TYPE DEFINITIONS
// ============================================================

interface Account {
    jid: string;
    pn: string;
    name: string;
}

interface Plugin {
    commands: string[];
    execute: (ctx: unknown) => Promise<void>;
    before?: (ctx: unknown) => Promise<boolean>;
}

interface PluginHandler {
    execute: (ctx: unknown) => Promise<void>;
    plugin: string;
}

interface BeforeHandler {
    plugin: string;
    handler: (ctx: unknown) => Promise<boolean>;
}

interface BotType {
    ws: {
        ev: {
            on(event: string, handler: (...args: unknown[]) => void): void;
        };
        sendMessage(jid: string, content: unknown, options?: unknown): Promise<unknown>;
    };
    on(event: string, handler: (...args: unknown[]) => void): void;
    login(method: 'qr' | 'pairing'): Promise<void>;
}

declare global {
    var db: unknown;
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
}
process.on('uncaughtException', (err: Error) => {
    console.error('🔥 Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason: unknown, promise: Promise<unknown>) => {
    console.error('🔥 Unhandled Rejection at:', promise, 'reason:', reason);
});
const dbService = new DatabaseService();
const gachaService = new GachaService();
const streamManager = new StreamManager();
const queueManager = new QueueManager();
const cacheManager = new CacheManager();
const tokenService = new TokenService();
const prembotManager = new PrembotManager(tokenService);
const shopService = new ShopService(dbService);
const levelService = new LevelService(dbService);
global.db = await dbService.load();
global.dbService = dbService;
global.gachaService = gachaService;
global.streamManager = streamManager;
global.queueManager = queueManager;
global.cacheManager = cacheManager;
global.tokenService = tokenService;
global.prembotManager = prembotManager;
global.shopService = shopService;
global.levelService = levelService;
global.commandMap = new Map();
global.beforeHandlers = [];
const messageHandler = new MessageHandler(dbService, gachaService, streamManager, queueManager, cacheManager, shopService, levelService);
const welcomeHandler = new WelcomeHandler(dbService);
global.messageHandler = messageHandler;
await gachaService.load();
await tokenService.load();
const UUID = '1f1332f4-7c2a-4b88-b4ca-bd56d07ed713';
const auth = new LocalAuth(UUID, 'sessions');
const account: Account = { jid: '', pn: '', name: '' };
const OWNER_JID = '573115434166@s.whatsapp.net';
const PREFIX = '#';
const bot = new Bot(UUID, auth, account) as unknown as BotType;
const pluginsDir = path.join(__dirname, 'plugins');
const pluginFiles = fs.readdirSync(pluginsDir).filter((file: string) => file.endsWith('.ts') || file.endsWith('.js'));
console.log(`ꕤ Cargando ${pluginFiles.length} plugins...`);
for (const file of pluginFiles) {
    try {
        const filePath = pathToFileURL(path.join(pluginsDir, file)).href;
        const plugin = await import(filePath);
        const pluginExport: Plugin = plugin.default;
        if (pluginExport && pluginExport.commands) {
            if (pluginExport.before && typeof pluginExport.before === 'function') {
                global.beforeHandlers.push({
                    plugin: file,
                    handler: pluginExport.before
                });
            }
            for (const cmd of pluginExport.commands) {
                global.commandMap.set(cmd, {
                    execute: pluginExport.execute,
                    plugin: file
                });
            }
            console.log(`ꕥ Plugin cargado: ${file}`);
        }
    } catch (error) {
        console.error(`ꕤ Error cargando plugin ${file}:`, (error as Error).message);
    }
}
console.log('📌 Registrando event handlers...');
bot.on('qr', async (qr: string) => {
    console.log('\n✨ Escanea este código QR con WhatsApp ✨\n');
    const qrString = await QRCode.toString(qr, { type: 'terminal', small: true });
    console.log(qrString);
});
bot.on('open', (accountInfo: Account) => {
    console.log('🎉 EVENTO OPEN DISPARADO!');
    console.log('✅ Conexión exitosa!');
    console.log(`📱 Bot conectado: ${accountInfo.name || 'Kaoruko Waguri'}`);
    bot.ws.ev.on('messages.upsert', ({ messages, type }: { messages: WAMessage[]; type: string }) => {
        for (const m of messages) {
            messageHandler.handleMessage(bot as unknown as Parameters<typeof messageHandler.handleMessage>[0], m).catch((err: Error) => {
                console.error('Error processing message:', err);
            });
        }
    });
    bot.ws.ev.on('group-participants.update', (event: unknown) => {
        welcomeHandler.handle(bot.ws as unknown as Parameters<typeof welcomeHandler.handle>[0], event as Parameters<typeof welcomeHandler.handle>[1]).catch((err: Error) => {
            console.error('Error in welcome handler:', err);
        });
    });
});
bot.on('close', (reason: unknown) => {
    console.log('⚠️ Conexión cerrada:', reason);
});
bot.on('error', (err: Error) => {
    console.error('❌ Error del bot:', err);
});
const gracefulShutdown = async (signal: string): Promise<void> => {
    console.log(`\n${signal} recibido. Cerrando gracefully...`);
    await dbService.gracefulShutdown();
    await gachaService.gracefulShutdown();
    await tokenService.gracefulShutdown();
    process.exit(0);
};
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
console.log('🚀 Iniciando bot con @imjxsx/wapi...');
await bot.login('qr');
const services = {
    dbService,
    gachaService,
    streamManager,
    queueManager,
    cacheManager,
    tokenService,
    prembotManager,
    shopService,
    levelService
};

setupCommandWorker(bot as unknown as Parameters<typeof setupCommandWorker>[0], services as unknown as Parameters<typeof setupCommandWorker>[1]);