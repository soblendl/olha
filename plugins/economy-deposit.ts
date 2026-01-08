import type { Plugin, PluginContext } from '../src/types/plugin.js';
import { formatNumber } from '../lib/utils.js';


const plugin: Plugin = {
    commands: ['deposit', 'dep', 'depositar'],

    async execute(ctx: PluginContext): Promise<void> {
        if (ctx.args.length === 0) {
            await ctx.reply('ꕤ Uso: #deposit <cantidad|all>');
            return;
        }

        const userData = ctx.dbService.getUser(ctx.sender);

        let amount;
        if (ctx.args[0].toLowerCase() === 'all') {
            amount = userData.coins;
        } else {
            amount = parseInt(ctx.args[0]);
        }

        if (isNaN(amount) || amount <= 0) {
            await ctx.reply('ꕤ La cantidad debe ser un número mayor a 0.');
            return;
        }

        if (userData.coins < amount) {
            await ctx.reply('ꕤ No tienes suficientes coins en tu billetera.');
            return;
        }

        userData.coins -= amount;
        userData.bank = (userData.bank || 0) + amount;
        ctx.dbService.markDirty();

        await ctx.reply(`ꕥ Depositaste *${amount}* coins en el banco.`);
    }
};

export default plugin;