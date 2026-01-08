import type { Plugin, PluginContext } from '../src/types/plugin.js';

import { formatNumber, getCooldown, formatTime, getRandom, styleText } from '../lib/utils.js';

const JUNK = [
    { item: 'Bota Vieja', value: 10, emoji: '👢' },
    { item: 'Lata Oxidada', value: 15, emoji: '🥫' },
    { item: 'Alga', value: 5, emoji: '🌿' },
    { item: 'Piedra', value: 2, emoji: '🪨' },
    { item: 'Madera Podrida', value: 8, emoji: '🪵' }
];

const BASE_CATCHES: Record<string, { name: string; baseValue: number; emoji: string }[]> = {
    common: [
        { name: 'Pez Payaso', baseValue: 100, emoji: '🐠' },
        { name: 'Trucha', baseValue: 120, emoji: '🐟' },
        { name: 'Sardina', baseValue: 80, emoji: '🐟' },
        { name: 'Bagre', baseValue: 110, emoji: '🐟' }
    ],
    uncommon: [
        { name: 'Salmón', baseValue: 300, emoji: '🐟' },
        { name: 'Atún', baseValue: 400, emoji: '🐟' },
        { name: 'Pez Globo', baseValue: 350, emoji: '🐡' }
    ],
    rare: [
        { name: 'Pez Espada', baseValue: 1000, emoji: '🦈' },
        { name: 'Mantarraya', baseValue: 1200, emoji: '🥘' }, // Emoji approx
        { name: 'Calamar Gigante', baseValue: 1500, emoji: '🦑' }
    ],
    epic: [
        { name: 'Tiburón Blanco', baseValue: 5000, emoji: '🦈' },
        { name: 'Orca', baseValue: 6000, emoji: '🐋' }
    ],
    legendary: [
        { name: 'Kraken', baseValue: 25000, emoji: '🐙' },
        { name: 'Megalodón', baseValue: 30000, emoji: '🦈' }
    ],
    mythic: [
        { name: 'Leviatán', baseValue: 100000, emoji: '🐉' },
        { name: 'Nessie', baseValue: 150000, emoji: '🦕' }
    ]
};

const MODIFIERS = [
    { prefix: 'Gigante', mul: 1.5, emoji: '💪' },
    { prefix: 'Dorado', mul: 3.0, emoji: '✨' },
    { prefix: 'Radioactivo', mul: 5.0, emoji: '☢️' },
    { prefix: 'Ancestral', mul: 10.0, emoji: '🔮' }
];

const RARITY_COLORS: Record<string, string> = {
    'common': '⚪',
    'uncommon': '🟢',
    'rare': '🔵',
    'epic': '🟣',
    'legendario': '🟠',
    'mítico': '🔴'
};

const plugin: Plugin = {
    commands: ['fish', 'pescar', 'fishing', 'pesca'],

    async execute(ctx: PluginContext): Promise<void> {

        if (ctx.ctx.isGroup && !ctx.dbService.getGroup(ctx.ctx.chatId).settings.economy) {
        await ctx.ctx.reply(styleText('ꕤ El sistema de economía está desactivado en este grupo.'));
        }
        const COOLDOWN = 30 * 1000;
        const userData = ctx.userData;
        if (!userData.economy.lastFish) userData.economy.lastFish = 0;
        if (!userData.economy.fishCaught) userData.economy.fishCaught = 0;
        const cooldown = getCooldown(userData.economy.lastFish, COOLDOWN);
        if (cooldown > 0) {
        await ctx.ctx.reply(styleText(
        `🎣 El pez necesita tiempo para morder.\n> Vuelve en » ${formatTime(cooldown)}`
        ));
        }
        ctx.dbService.updateUser(ctx.ctx.sender, { 'economy.lastFish': Date.now() });
        const roll = Math.random() * 100;
        if (roll < 20) {
        const caught = getRandom(JUNK);
        await ctx.ctx.reply(styleText(
        `🎣 *Pescaste...*\n\n` +
        `${caught.emoji} ${caught.item}\n` +
        `💰 Valor » ¥${formatNumber(caught.value)}\n\n` +
        `> Mejor suerte la próxima vez`
        ));
        return;
        }
        let rarity;
        if (roll < 50) rarity = 'common';
        else if (roll < 75) rarity = 'uncommon';
        else if (roll < 90) rarity = 'rare';
        else if (roll < 98) rarity = 'epic';
        else if (roll < 99.8) rarity = 'legendary';
        else rarity = 'mythic';
        const baseFish = getRandom(BASE_CATCHES[rarity]);
        const modifierRoll = Math.random();
        let modifier = null;
        if (modifierRoll < 0.30) {
        modifier = getRandom(MODIFIERS);
        }
        const itemName = modifier ? `${modifier.prefix} ${baseFish.name}` : baseFish.name;
        const itemEmoji = modifier ? `${modifier.emoji}${baseFish.emoji}` : baseFish.emoji;
        let value = baseFish.baseValue;
        if (modifier) {
        value = Math.floor(value * modifier.mul);
        }
        ctx.dbService.updateUser(ctx.ctx.sender, {
        'economy.coins': userData.economy.coins + value,
        'economy.fishCaught': userData.economy.fishCaught + 1
        });
        await ctx.dbService.save();
        const rarityDisplayMap: Record<string, string> = {
        'common': 'Común',
        'uncommon': 'Poco Común',
        'rare': 'Raro',
        'epic': 'Épico',
        'legendary': 'Legendario',
        'mythic': 'Mítico'
        };
        const rarityDisplay = rarityDisplayMap[rarity as string];
        const rarityColor = RARITY_COLORS[rarity as string] || '⚪';
        await ctx.ctx.reply(styleText(
        `🎣 *¡ATRAPASTE ALGO!*\n\n` +
        `${itemEmoji} *${itemName}*\n` +
        `${rarityColor} Rareza: ${rarityDisplay}\n` +
        `💰 Valor: ¥${formatNumber(value)}\n\n` +
        `🐟 Peces atrapados: ${userData.economy.fishCaught + 1}\n` +
        `💰 Balance: ¥${formatNumber(userData.economy.coins + value)}`
        ));
    }
};

export default plugin;
