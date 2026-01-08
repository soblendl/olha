import { LocalDB } from '@imjxsx/localdb';
import path from 'path';
import { fileURLToPath } from 'url';
import WorkerManager from './WorkerManager.js';
import type { Worker } from 'worker_threads';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
interface EconomyData {
    coins: number;
    bank: number;
    lastDaily: number;
    lastWork: number;
    lastCrime: number;
    lastSlut: number;
    [key: string]: unknown;
}
interface GachaData {
    characters: string[];
    lastClaim: number;
    votes: Record<string, unknown>;
}
interface StatsData {
    messages: number;
    commands: number;
}
interface LevelData {
    xp: number;
    lvl: number;
    lastXp: number;
}
interface InventoryItem {
    id: string;
    count: number;
    acquiredAt: number;
    [key: string]: unknown;
}

interface UserData {
    id: string;
    economy: EconomyData;
    gacha: GachaData;
    stats: StatsData;
    level: LevelData;
    inventory: InventoryItem[];
    createdAt: number;
    monedas: number;
    antirobo: number;
    desbloqueo: number;
    $set?: Record<string, unknown>;
    [key: string]: unknown;
}

interface GroupSettings {
    welcome: boolean;
    goodbye: boolean;
    antilink: boolean;
    economy: boolean;
    nsfw: boolean;
    [key: string]: unknown;
}

interface GroupStats {
    messages: number;
}

interface GroupData {
    id: string;
    settings: GroupSettings;
    alerts: string[];
    stats: GroupStats;
    $set?: Record<string, unknown>;
    [key: string]: unknown;
}

interface Collection<T> {
    findOne(query: { id: string }): T | null;
    find(): T[];
    insertOne(doc: T): void;
    updateOne(query: { id: string }, update: { $set: Partial<T> } | Partial<T>): boolean;
    deleteOne(query: { id: string }): void;
    count?(): number;
}

interface LocalDBInstance {
    load(): Promise<void>;
    collection<T>(name: string): Collection<T>;
}

interface LocalDBFactory {
    db(name: string): LocalDBInstance;
}

// ============================================================
// DATABASE SERVICE CLASS
// ============================================================

class DatabaseService {
    private localDB: LocalDBInstance | null = null;
    private db: LocalDBInstance | null = null;
    private users: Collection<UserData> | null = null;
    private groups: Collection<GroupData> | null = null;
    private isDirty: boolean = false;
    private saveInterval: ReturnType<typeof setInterval> | null = null;
    private workerManager: WorkerManager;
    private dbWorker: Worker | null = null;

    constructor() {
        this.workerManager = new WorkerManager();
    }

    async load(): Promise<LocalDBInstance> {
        try {
            const dbPath = path.join(__dirname, '..', 'database');
            this.localDB = (new LocalDB(dbPath) as unknown as LocalDBFactory).db('bot');
            await this.localDB.load();
            this.users = this.localDB.collection<UserData>('users');
            this.groups = this.localDB.collection<GroupData>('groups');
            this.db = this.localDB;
            this.dbWorker = this.workerManager.getWorker('db', 'workers/dbWorker.js');
            console.log('𖤐 Base de datos cargada');
            this.startAutoSave();
            return this.db;
        } catch (error) {
            console.error('𖤐 Error cargando base de datos:', (error as Error).message);
            throw error;
        }
    }

    async save(): Promise<void> {
        if (!this.dbWorker || !this.users || !this.groups) return;

        try {
            const collections = {
                users: this.users.find(),
                groups: this.groups.find()
            };

            const dbPath = path.join(__dirname, '..', 'database');

            this.dbWorker.postMessage({
                type: 'save',
                id: Date.now(),
                data: {
                    dbPath,
                    collections
                }
            });

            this.isDirty = false;
        } catch (error) {
            console.error('𖤐 Error enviando datos al worker:', (error as Error).message);
        }
    }

    saveSync(): void {
        console.log('𖤐 Guardado síncrono no soportado por LocalDB (se confía en auto-save)');
    }

    private startAutoSave(): void {
        this.saveInterval = setInterval(async () => {
            if (this.isDirty) {
                await this.save();
            }
        }, 10000);
    }

    markDirty(): void {
        this.isDirty = true;
    }

    private applyNested(obj: Record<string, unknown>, key: string, val: unknown): void {
        if (key.includes('.')) {
            const parts = key.split('.');
            let current: Record<string, unknown> = obj;
            for (let i = 0; i < parts.length - 1; i++) {
                if (!current[parts[i]]) current[parts[i]] = {};
                current = current[parts[i]] as Record<string, unknown>;
            }
            current[parts[parts.length - 1]] = val;
        } else {
            obj[key] = val;
        }
    }

    getUser(userId: string, aliasId: string | null = null): UserData {
        if (!this.users) throw new Error('Database not loaded');

        let user = this.users.findOne({ id: userId });

        // Check for migration from alias (LID) to main ID (Phone)
        if (!user && aliasId) {
            let aliasUser = this.users.findOne({ id: aliasId });

            if (!aliasUser && aliasId.includes('@lid')) {
                const lidAsSwa = aliasId.replace('@lid', '@s.whatsapp.net');
                aliasUser = this.users.findOne({ id: lidAsSwa });
            }

            if (aliasUser) {
                console.log(`✨ Migrating user data from ${aliasUser.id} to ${userId}`);
                this.users.deleteOne({ id: aliasUser.id });

                user = { ...aliasUser, id: userId };

                if (user.$set) {
                    console.log(`🔧 Fixing corrupted data for ${userId}`);
                    for (const [key, val] of Object.entries(user.$set)) {
                        this.applyNested(user as Record<string, unknown>, key, val);
                    }
                    delete user.$set;
                }

                this.users.insertOne(user);
                this.markDirty();
                return user;
            }
        }

        if (!user) {
            user = {
                id: userId,
                economy: {
                    coins: 0,
                    bank: 0,
                    lastDaily: 0,
                    lastWork: 0,
                    lastCrime: 0,
                    lastSlut: 0
                },
                gacha: {
                    characters: [],
                    lastClaim: 0,
                    votes: {}
                },
                stats: {
                    messages: 0,
                    commands: 0
                },
                level: {
                    xp: 0,
                    lvl: 1,
                    lastXp: 0
                },
                inventory: [],
                createdAt: Date.now(),
                monedas: 0,
                antirobo: 0,
                desbloqueo: 0
            };
            this.users.insertOne(user);
            this.markDirty();
        } else {
            if (user.$set) {
                console.log(`🔧 Fixing corrupted data for existing user ${userId}`);
                for (const [key, val] of Object.entries(user.$set)) {
                    this.applyNested(user as Record<string, unknown>, key, val);
                }
                delete user.$set;
                this.users.updateOne({ id: userId }, user);
                this.markDirty();
            }
        }
        return user;
    }

    updateUser(userId: string, updates: Record<string, unknown>): boolean {
        if (!this.users) throw new Error('Database not loaded');

        const user = this.getUser(userId);

        for (const [key, value] of Object.entries(updates)) {
            this.applyNested(user as Record<string, unknown>, key, value);
        }

        const result = this.users.updateOne(
            { id: userId },
            { $set: user }
        );

        if (result) {
            this.markDirty();
            console.log(`✅ User ${userId} updated. New Balance: ${user.economy?.coins}`);
        } else {
            console.log(`⚠️ Failed to update user ${userId}`);
        }
        return result;
    }

    getUserCount(): number {
        if (!this.users) return 0;
        return this.users.count ? this.users.count() : this.users.find().length;
    }

    getAllUsers(): UserData[] {
        if (!this.users) return [];
        return this.users.find();
    }

    getGroup(groupId: string): GroupData {
        if (!this.groups) throw new Error('Database not loaded');

        let group = this.groups.findOne({ id: groupId });

        if (!group) {
            group = {
                id: groupId,
                settings: {
                    welcome: false,
                    goodbye: false,
                    antilink: false,
                    economy: true,
                    nsfw: false
                },
                alerts: [],
                stats: {
                    messages: 0
                }
            };
            this.groups.insertOne(group);
            this.markDirty();
        } else {
            let changed = false;
            if (group.settings.goodbye === undefined) {
                group.settings.goodbye = false;
                changed = true;
            }

            if (changed) {
                this.groups.updateOne({ id: groupId }, { $set: group });
                this.markDirty();
            }
        }
        return group;
    }

    updateGroup(groupId: string, updates: Record<string, unknown>): boolean {
        if (!this.groups) throw new Error('Database not loaded');

        const group = this.getGroup(groupId);

        for (const [key, value] of Object.entries(updates)) {
            this.applyNested(group as Record<string, unknown>, key, value);
        }

        const result = this.groups.updateOne(
            { id: groupId },
            { $set: group }
        );

        if (result) {
            this.markDirty();
        } else {
            console.log(`⚠️ Failed to update group ${groupId}`);
        }
        return result;
    }

    async gracefulShutdown(): Promise<void> {
        console.log('𖤐 Cerrando bot...');
        if (this.saveInterval) {
            clearInterval(this.saveInterval);
        }
        await this.save();
        console.log('𖤐 Base de datos guardada');
    }
}

export default DatabaseService;
