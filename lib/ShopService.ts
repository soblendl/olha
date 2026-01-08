import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import DatabaseService from './DatabaseService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================
// TYPE DEFINITIONS
// ============================================================

interface ItemEffect {
    type?: string;
    stat?: string;
    amount?: number;
    value?: number;
    duration?: number;
    level?: number;
}

interface ShopItem {
    id: string;
    name: string;
    price: number;
    desc: string;
    category: string;
    effect: ItemEffect;
}

interface ShopItemWithStock extends ShopItem {
    stock: number;
}

interface PaginatedItems {
    items: ShopItemWithStock[];
    total: number;
    totalPages: number;
    currentPage: number;
}

interface InventorySlot {
    id: string;
    count: number;
    acquiredAt: number;
}

interface InventoryItemFull extends InventorySlot {
    name: string;
    desc: string;
    category: string;
}

interface BuyResult {
    success: boolean;
    error?: string;
    item?: ShopItem;
    remainingBalance?: number;
}

interface Categories {
    CONSUMABLE: string;
    TOOL: string;
    COLLECTIBLE: string;
    POWERUP: string;
    SPECIAL: string;
}

// ============================================================
// SHOP SERVICE CLASS
// ============================================================

export class ShopService {
    private dbService: DatabaseService;
    private items: Map<string, ShopItem>;
    private stock: Map<string, number>;
    private stockInterval: ReturnType<typeof setInterval> | null;
    public CATEGORIES: Categories;

    constructor(dbService: DatabaseService) {
        this.dbService = dbService;
        this.items = new Map();
        this.stock = new Map();
        this.stockInterval = null;
        this.CATEGORIES = {
            CONSUMABLE: 'Consumible',
            TOOL: 'Herramienta',
            COLLECTIBLE: 'Coleccionable',
            POWERUP: 'Potenciador',
            SPECIAL: 'Especial'
        };

        this.initializeItems();
        this.startStockRotation();
    }

    private initializeItems(): void {
        const add = (id: string, name: string, price: number, desc: string, category: string, effect: ItemEffect = {}): void => {
            this.items.set(id, { id, name, price, desc, category, effect });
        };

        // --- Consumibles ---
        const potions = ['Vida', 'Maná', 'Energía', 'Suerte', 'Rapidez'];
        const potionLevels = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];

        potions.forEach(type => {
            potionLevels.forEach((lvl, idx) => {
                const power = (idx + 1) * 10;
                add(
                    `pot_${type.toLowerCase()}_${idx + 1}`,
                    `Poción de ${type} ${lvl}`,
                    100 * (idx + 1),
                    `Restaura ${power}% de ${type.toLowerCase()}`,
                    this.CATEGORIES.CONSUMABLE,
                    { type: 'restore', stat: type.toLowerCase(), amount: power }
                );
            });
        });

        // Comida variada
        const foods = ['Manzana', 'Pan', 'Carne', 'Pescado', 'Pastel', 'Sushi', 'Pizza', 'Hamburguesa', 'Taco', 'Helado'];
        foods.forEach((food, idx) => {
            add(`food_${idx}`, food, 50 * (idx + 1), `Delicioso ${food}`, this.CATEGORIES.CONSUMABLE);
        });

        // --- Herramientas ---
        const materials = ['Madera', 'Piedra', 'Hierro', 'Oro', 'Diamante', 'Obsidiana', 'Esmeralda', 'Rubí', 'Zafiro', 'Netherite'];
        const tools = ['Pico', 'Hacha', 'Espada', 'Pala', 'Azada'];

        materials.forEach((mat, mIdx) => {
            tools.forEach((tool) => {
                add(
                    `tool_${mat.toLowerCase()}_${tool.toLowerCase()}`,
                    `${tool} de ${mat}`,
                    500 * (mIdx + 1),
                    `Herramienta de nivel ${mIdx + 1}`,
                    this.CATEGORIES.TOOL,
                    { type: 'tool', level: mIdx + 1 }
                );
            });
        });

        // --- Coleccionables ---
        for (let i = 1; i <= 50; i++) {
            add(`figura_${i}`, `Figura Coleccionable #${i}`, 1000 * i, `Figura rara número ${i}`, this.CATEGORIES.COLLECTIBLE);
        }

        // --- Potenciadores ---
        for (let i = 1; i <= 30; i++) {
            add(
                `xp_boost_${i}`,
                `Potenciador de XP x${(1 + i * 0.1).toFixed(1)}`,
                2000 * i,
                `Multiplica tu XP por ${(1 + i * 0.1).toFixed(1)} durante 30m`,
                this.CATEGORIES.POWERUP,
                { type: 'multiplier', stat: 'xp', value: 1 + i * 0.1, duration: 1800 }
            );
        }

        // --- Especiales ---
        const specials = [
            { name: 'Ticket Gacha', price: 5000 },
            { name: 'Pase VIP (1d)', price: 10000 },
            { name: 'Pase VIP (7d)', price: 50000 },
            { name: 'Cambio de Nombre', price: 2000 },
            { name: 'Reset Stats', price: 50000 },
            { name: 'Caja Misteriosa', price: 1500 },
            { name: 'Llave Maestra', price: 8000 },
            { name: 'Piedra Filosofal', price: 100000 },
            { name: 'Anillo Unico', price: 500000 },
            { name: 'Estrella Fugaz', price: 25000 }
        ];

        specials.forEach((s, idx) => {
            add(`special_${idx}`, s.name, s.price, 'Objeto especial muy raro', this.CATEGORIES.SPECIAL);
        });

        console.log(`🛒 ShopService: ${this.items.size} ítems cargados.`);
    }

    private startStockRotation(): void {
        this.rotateStock();

        this.stockInterval = setInterval(() => {
            this.rotateStock();
        }, 5 * 60 * 1000);
    }

    private rotateStock(): void {
        this.stock.clear();
        console.log('🔄 Rotando stock de la tienda...');

        for (const [id] of this.items) {
            if (Math.random() > 0.3) {
                const quantity = Math.floor(Math.random() * 50) + 1;
                this.stock.set(id, quantity);
            }
        }
    }

    getItems(page: number = 1, limit: number = 10, category: string | null = null): PaginatedItems {
        let allItems = Array.from(this.items.values());

        if (category) {
            allItems = allItems.filter(i => i.category === category);
        }

        const start = (page - 1) * limit;
        const end = start + limit;
        const pageItems = allItems.slice(start, end);

        return {
            items: pageItems.map(i => ({
                ...i,
                stock: this.stock.get(i.id) || 0
            })),
            total: allItems.length,
            totalPages: Math.ceil(allItems.length / limit),
            currentPage: page
        };
    }

    getItem(id: string): ShopItemWithStock | null {
        const item = this.items.get(id);
        if (!item) return null;
        return {
            ...item,
            stock: this.stock.get(id) || 0
        };
    }

    async buyItem(userId: string, itemId: string, quantity: number = 1): Promise<BuyResult> {
        const item = this.items.get(itemId);
        if (!item) return { success: false, error: 'Item no encontrado' };

        const currentStock = this.stock.get(itemId) || 0;
        if (currentStock < quantity) return { success: false, error: `Stock insuficiente (Disponible: ${currentStock})` };

        const user = await this.dbService.getUser(userId);
        const totalCost = item.price * quantity;

        if ((user.economy?.coins || 0) < totalCost) {
            return { success: false, error: `Fondos insuficientes. Necesitas ${totalCost} coins.` };
        }

        // Process purchase
        await this.dbService.updateUser(userId, {
            'economy.coins': user.economy.coins - totalCost
        });

        // Add to inventory
        if (!user.inventory) user.inventory = [];

        const inventory = user.inventory as InventorySlot[];
        const existingItemIndex = inventory.findIndex((i: InventorySlot) => i.id === itemId);

        if (existingItemIndex >= 0) {
            inventory[existingItemIndex].count += quantity;
        } else {
            inventory.push({ id: itemId, count: quantity, acquiredAt: Date.now() });
        }

        await this.dbService.updateUser(userId, { inventory });

        // Reduce stock
        this.stock.set(itemId, currentStock - quantity);

        return { success: true, item, remainingBalance: user.economy.coins - totalCost };
    }

    getInventory(userId: string): InventoryItemFull[] {
        const user = this.dbService.getUser(userId);
        if (!user.inventory) return [];

        const inventory = user.inventory as InventorySlot[];
        return inventory.map((slot: InventorySlot) => {
            const itemDef = this.items.get(slot.id);
            return {
                ...slot,
                name: itemDef ? itemDef.name : 'Item Desconocido',
                desc: itemDef ? itemDef.desc : '',
                category: itemDef ? itemDef.category : 'Otros'
            };
        });
    }

    gracefulShutdown(): void {
        if (this.stockInterval) clearInterval(this.stockInterval);
    }
}
