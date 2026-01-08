import { LocalDB } from '@imjxsx/localdb';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================
// TYPE DEFINITIONS
// ============================================================

interface Character {
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
}

interface CharactersByGender {
    male: Character[];
    female: Character[];
    other: Character[];
    [key: string]: Character[];
}

interface ClaimResult {
    success: boolean;
    message?: string;
    character?: Character;
}

interface ReleaseResult {
    success: boolean;
    message?: string;
}

interface TransferResult {
    success: boolean;
    message?: string;
    character?: Character;
    previousOwner?: string;
}

interface GachaJsonData {
    characters?: Character[];
}

interface Collection<T> {
    find(): T[];
    findOne?(query: { id: string }): T | null;
    insertOne(doc: T): void;
    updateOne(query: { id: string }, update: Record<string, unknown>): void;
}

interface LocalDBInstance {
    load(): Promise<void>;
    save(): Promise<void>;
    collection<T>(name: string): Collection<T>;
}

interface LocalDBFactory {
    db(name: string): LocalDBInstance;
}

// ============================================================
// GACHA SERVICE CLASS
// ============================================================

class GachaService {
    private localDB: LocalDBInstance | null = null;
    private charactersCollection: Collection<{ id: string; owner?: string; claimedAt?: number; transferredAt?: number; votes?: Record<string, number>; voteCount?: number }> | null = null;
    private characters: Character[] = [];
    private charactersByGender: CharactersByGender = { male: [], female: [], other: [] };
    private charactersBySource: Record<string, Character[]> = {};
    private isDirty: boolean = false;
    private saveInterval: ReturnType<typeof setInterval> | null = null;

    async load(): Promise<void> {
        const dbPath = path.join(__dirname, '..', 'database');
        const gachaJsonPath = path.join(dbPath, 'gacha.json');
        const jsonData: GachaJsonData = JSON.parse(fs.readFileSync(gachaJsonPath, 'utf8'));
        const catalogCharacters = jsonData.characters || [];

        this.localDB = (new LocalDB(dbPath) as unknown as LocalDBFactory).db('gacha');
        await this.localDB.load();
        this.charactersCollection = this.localDB.collection('characters');
        const dbCharacters = this.charactersCollection.find();
        const dbMap = new Map(dbCharacters.map(c => [c.id, c]));

        this.characters = catalogCharacters.map(char => {
            const saved = dbMap.get(char.id);
            if (!saved) {
                this.charactersCollection!.insertOne({ id: char.id });
                return { ...char };
            }
            return {
                ...char,
                owner: saved.owner,
                claimedAt: saved.claimedAt,
                transferredAt: saved.transferredAt,
                votes: saved.votes,
                voteCount: saved.voteCount
            };
        });

        for (const old of dbCharacters) {
            if (!catalogCharacters.find(c => c.id === old.id)) {
                this.characters.push({
                    id: old.id,
                    name: (old as unknown as Character).name || old.id,
                    disabled: true,
                    owner: old.owner,
                    claimedAt: old.claimedAt
                });
            }
        }

        this.indexCharacters();
        this.startAutoSave();
    }

    private indexCharacters(): void {
        this.charactersByGender = { male: [], female: [], other: [] };
        this.charactersBySource = {};

        for (const char of this.characters) {
            const gender = char.gender?.toLowerCase() || 'other';
            if (this.charactersByGender[gender]) {
                this.charactersByGender[gender].push(char);
            }
            const source = char.source || 'Unknown';
            if (!this.charactersBySource[source]) {
                this.charactersBySource[source] = [];
            }
            this.charactersBySource[source].push(char);
        }
    }

    getRandom(): Character | null {
        const available = this.characters.filter(c => !c.owner && !c.disabled);
        if (!available.length) return null;
        return available[Math.floor(Math.random() * available.length)];
    }

    getById(id: string): Character | undefined {
        return this.characters.find(c => c.id === id);
    }

    getUserCharacters(userId: string): Character[] {
        return this.characters.filter(c => c.owner === userId);
    }

    claim(userId: string, characterId: string): ClaimResult {
        const char = this.getById(characterId);
        if (!char || char.disabled) return { success: false, message: 'Personaje no disponible' };
        if (char.owner) return { success: false, message: 'Este personaje ya tiene dueño' };

        char.owner = userId;
        char.claimedAt = Date.now();
        this.charactersCollection?.updateOne(
            { id: characterId },
            { $set: { owner: userId, claimedAt: char.claimedAt } }
        );
        this.markDirty();
        return { success: true, character: char };
    }

    release(userId: string, characterId: string): ReleaseResult {
        const char = this.getById(characterId);
        if (!char || char.owner !== userId) {
            return { success: false, message: 'No eres el dueño' };
        }

        delete char.owner;
        delete char.claimedAt;
        this.charactersCollection?.updateOne(
            { id: characterId },
            { $unset: { owner: '', claimedAt: '' } }
        );
        this.markDirty();
        return { success: true };
    }

    transferCharacter(characterId: string, newOwner: string): TransferResult {
        const char = this.getById(characterId);
        if (!char) return { success: false, message: 'Personaje no encontrado' };

        const previousOwner = char.owner;
        char.owner = newOwner;
        char.transferredAt = Date.now();
        this.charactersCollection?.updateOne(
            { id: characterId },
            { $set: { owner: newOwner, transferredAt: char.transferredAt } }
        );
        this.markDirty();
        return { success: true, character: char, previousOwner };
    }

    private markDirty(): void {
        this.isDirty = true;
    }

    async save(): Promise<void> {
        if (!this.isDirty || !this.localDB) return;
        await this.localDB.save();
        this.isDirty = false;
    }

    private startAutoSave(): void {
        this.saveInterval = setInterval(() => this.save(), 10000);
    }

    async gracefulShutdown(): Promise<void> {
        if (this.saveInterval) clearInterval(this.saveInterval);
        await this.save();
    }
}

export default GachaService;
