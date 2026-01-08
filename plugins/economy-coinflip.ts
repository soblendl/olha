import type { Plugin, PluginContext } from '../src/types/plugin.js';
import { formatNumber } from '../lib/utils.js';


const plugin: Plugin = {
    commands: ['coinflip', 'cf'],

    async execute(ctx: PluginContext): Promise<void> {
        if (ctx.args.length < 2) {
            await ctx.reply('ꕤ Uso: */coinflip* `<cantidad>` `<cara/cruz>`');
            return;
        }

        const amount = parseInt(ctx.args[0]);
        const choice = ctx.args[1].toLowerCase();

        if (isNaN(amount) || amount <= 0) {
            await ctx.reply('ꕤ La cantidad debe ser un número mayor a 0.');
            return;
        }

        if (!['cara', 'cruz'].includes(choice)) {
            await ctx.reply('ꕤ Debes elegir cara o cruz.');
            return;
        }

        const userData = ctx.dbService.getUser(ctx.sender);
        if (userData.coins < amount) {
            await ctx.reply('ꕤ No tienes suficientes coins.');
            return;
        }

        const result = Math.random() < 0.5 ? 'cara' : 'cruz';
        const won = result === choice;

        if (won) {
            userData.coins += amount;
            ctx.dbService.markDirty();
            await ctx.reply(`ꕥ ¡Salió *${result}*! Ganaste *${amount}* coins.`);
        } else {
            userData.coins -= amount;
            ctx.dbService.markDirty();
            await ctx.reply(`ꕤ Salió *${result}*. Perdiste *${amount}* coins.`);
        }
    }
};

export default plugin;