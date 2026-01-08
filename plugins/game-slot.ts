import type { Plugin, PluginContext } from '../src/types/plugin.js';

import { formatNumber, styleText } from '../lib/utils.js';

const plugin: Plugin = {
    commands: ['slot', 'slots', 'tragaperras'],

    async execute(ctx: PluginContext): Promise<void> {

        if (ctx.ctx.isGroup && !ctx.dbService.getGroup(ctx.ctx.chatId).settings.economy) {
        await ctx.ctx.reply(styleText('ꕤ El sistema de economía está desactivado en este grupo.'));
        }
        const userData = ctx.userData.economy;
        let amount = parseInt(ctx.ctx.args[0]);
        if (!amount || isNaN(amount) || amount <= 0) {
        await ctx.ctx.reply(styleText('ꕤ Uso: #slot <cantidad>\n> Ejemplo: * #slot* 100'));
        }
        if (amount > userData.coins) {
        await ctx.ctx.reply(styleText('ꕤ No tienes suficientes coins.'));
        }

        const emojis = ['🍇', '🍉', '🍊', '🍋', '🍌', '🍍', '🍒', '🍓'];
        const a = emojis[Math.floor(Math.random() * emojis.length)];
        const b = emojis[Math.floor(Math.random() * emojis.length)];
        const c = emojis[Math.floor(Math.random() * emojis.length)];
        let result = '';
        let winAmount = 0;
        let newBalance = userData.coins - amount;

        if (a === b && b === c) {
        winAmount = amount * 5;
        newBalance += winAmount;
        result = `ꕥ *JACKPOT!!!* \n\n> ➵Ganaste *${formatNumber(winAmount)}* coins (x5)`;
        } else if (a === b || b === c || a === c) {
        winAmount = Math.floor(amount * 1.5);
        newBalance += winAmount;
        result = `ꕥ *¡Ganaste!* \n\n> ✐ Ganaste *${formatNumber(winAmount)}* coins (x1.5)`;
        } else {
        result = `ꕤ *Perdiste* \n\n> ✐ Perdiste *${formatNumber(amount)}* coins`;
        }

        ctx.dbService.updateUser(ctx.ctx.sender, {
        'economy.coins': newBalance
        });
        await ctx.dbService.save();

        await ctx.ctx.reply(styleText(
        `ꕥ *SLOTS* 🎰\n\n` +
        `❐ | ${a} | ${b} | ${c} | 👈\n\n` +
        `${result}\n` +
        `> Nuevo balance: ${formatNumber(newBalance)} coins`
        ));
    }
};

export default plugin;
