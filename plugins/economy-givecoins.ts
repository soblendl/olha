import type { Plugin, PluginContext } from '../src/types/plugin.js';
import { extractMentions } from '../lib/utils.js';


const plugin: Plugin = {
    commands: ['givecoins', 'darcoins'],

    async execute(ctx: PluginContext): Promise<void> {
        if (ctx.args.length < 2) {
            await ctx.reply('ꕤ Uso: #givecoins <@usuario> <cantidad>');
            return;
        }

        const mentions = extractMentions(ctx);
        if (mentions.length === 0) {
            await ctx.reply('ꕤ Debes mencionar a un usuario.');
            return;
        }

        const target = mentions[0];
        const amount = parseInt(ctx.args[1]);

        if (isNaN(amount) || amount <= 0) {
            await ctx.reply('ꕤ La cantidad debe ser un número mayor a 0.');
            return;
        }

        const senderData = ctx.dbService.getUser(ctx.sender);
        if (senderData.coins < amount) {
            await ctx.reply('ꕤ No tienes suficientes coins.');
            return;
        }

        const targetData = ctx.dbService.getUser(target);
        senderData.coins -= amount;
        targetData.coins += amount;
        ctx.dbService.markDirty();

        await ctx.reply(`ꕥ Transferiste ${amount} coins a @${target.split('@')[0]}.`, {
            mentions: [target]
        });
    }
};

export default plugin;