import DatabaseService from './DatabaseService.js';

// ============================================================
// TYPE DEFINITIONS
// ============================================================

interface LevelData {
    xp: number;
    lvl: number;
    lastXp: number;
}

interface LevelUpResult {
    leveledUp: boolean;
    currentLevel: number;
    currentXp: number;
    nextLevelXp: number;
}

interface RankInfo {
    level: number;
    xp: number;
    required: number;
    progress: number;
}

// ============================================================
// LEVEL SERVICE CLASS
// ============================================================

export class LevelService {
    private dbService: DatabaseService;
    private baseXp: number;
    private multiplier: number;

    constructor(dbService: DatabaseService) {
        this.dbService = dbService;
        this.baseXp = 100;
        this.multiplier = 1.5;
    }

    getXpForNextLevel(level: number): number {
        return Math.floor(this.baseXp * Math.pow(level, this.multiplier));
    }

    async addXp(userId: string, amount: number): Promise<LevelUpResult> {
        const user = await this.dbService.getUser(userId);

        // Initialize if doesn't exist (on-the-fly migration)
        if (!user.level) {
            user.level = { xp: 0, lvl: 1, lastXp: 0 };
        }

        user.level.xp += amount;

        let leveledUp = false;
        let nextLevelXp = this.getXpForNextLevel(user.level.lvl);

        while (user.level.xp >= nextLevelXp) {
            user.level.xp -= nextLevelXp;
            user.level.lvl++;
            leveledUp = true;
            nextLevelXp = this.getXpForNextLevel(user.level.lvl);
        }

        await this.dbService.updateUser(userId, { level: user.level });

        return {
            leveledUp,
            currentLevel: user.level.lvl,
            currentXp: user.level.xp,
            nextLevelXp
        };
    }

    getLevel(userId: string): LevelData {
        const user = this.dbService.getUser(userId);
        if (!user.level) return { xp: 0, lvl: 1, lastXp: 0 };
        return user.level;
    }

    getRank(userId: string): RankInfo {
        const user = this.dbService.getUser(userId);
        const level = user.level || { xp: 0, lvl: 1, lastXp: 0 };
        const nextXp = this.getXpForNextLevel(level.lvl);

        return {
            level: level.lvl,
            xp: level.xp,
            required: nextXp,
            progress: Math.floor((level.xp / nextXp) * 100)
        };
    }
}
