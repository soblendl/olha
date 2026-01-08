import type { Plugin, PluginContext } from '../src/types/plugin.js';

import { formatNumber } from '../lib/utils.js';


const plugin: Plugin = {
    commands: ['withdraw', 'wd'],
    
    async execute(ctx: PluginContext): Promise<void> {
        if (ctx.isGroup && !ctx.dbService.getGroup(ctx.chatId).settings.economy) {
            await ctx.reply('ꕤ El sistema de economía está desactivado en este grupo.');
            return;
        }

        const userData = ctx.userData.economy;
        
        if (!ctx.args[0]) {
            await ctx.reply('ꕤ Debes especificar una cantidad.\nUso: #withdraw <cantidad>');
            return;
        }

        const amount = ctx.args[0].toLowerCase() === 'all' ? userData.bank : parseInt(ctx.args[0]);

        if (isNaN(amount) || amount <= 0) {
            await ctx.reply('ꕤ Cantidad inválida.');
            return;
        }

        if (amount > userData.bank) {
            await ctx.reply('ꕤ No tienes suficientes coins en el banco.');
            return;
        }

        userData.bank -= amount;
        userData.coins += amount;
        ctx.dbService.markDirty();

        await ctx.reply(
            `ꕥ *Retiro Exitoso*\n\n` +
            `Retiraste: *${formatNumber(amount)}* coins\n` +
            `ꕤ Coins: *${formatNumber(userData.coins)}*\n` +
            `ꕥ Banco: *${formatNumber(userData.bank)}*`
        );
    }
};

export default plugin;
