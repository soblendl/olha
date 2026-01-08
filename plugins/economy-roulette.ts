import type { Plugin, PluginContext } from '../src/types/plugin.js';

import { formatNumber } from '../lib/utils.js';


const plugin: Plugin = {
    commands: ['roulette', 'rt'],
    
    async execute(ctx: PluginContext): Promise<void> {
        if (ctx.isGroup && !ctx.dbService.getGroup(ctx.chatId).settings.economy) {
            await ctx.reply('ꕤ El sistema de economía está desactivado en este grupo.');
            return;
        }

        const userData = ctx.userData.economy;
        
        if (!ctx.args[0] || !ctx.args[1]) {
            await ctx.reply('ꕤ Uso incorrecto.\nUso: #roulette <red/black> <cantidad>');
            return;
        }

        const choice = ctx.args[0].toLowerCase();
        const amount = parseInt(ctx.args[1]);

        if (!['red', 'black'].includes(choice)) {
            await ctx.reply('ꕤ Debes elegir: red o black');
            return;
        }

        if (isNaN(amount) || amount <= 0) {
            await ctx.reply('ꕤ Cantidad inválida.');
            return;
        }

        if (amount > userData.coins) {
            await ctx.reply('ꕤ No tienes suficientes coins.');
            return;
        }

        const result = Math.random() < 0.5 ? 'red' : 'black';
        const won = result === choice;

        if (won) {
            const winAmount = Math.floor(amount * 1.8);
            userData.coins += winAmount;
            ctx.dbService.markDirty();
            await ctx.reply(
                `ꕥ *¡Ganaste!*\n\n` +
                `Salió: ${result} ${result === 'red' ? '🔴' : '⚫'}\n` +
                `Ganancia: +${formatNumber(winAmount)} coins\n` +
                `Balance: ${formatNumber(userData.coins)} coins`
            );
        } else {
            userData.coins -= amount;
            ctx.dbService.markDirty();
            await ctx.reply(
                `ꕥ *Perdiste*\n\n` +
                `Salió: ${result} ${result === 'red' ? '🔴' : '⚫'}\n` +
                `Pérdida: -${formatNumber(amount)} coins\n` +
                `Balance: ${formatNumber(userData.coins)} coins`
            );
        }
    }
};

export default plugin;
