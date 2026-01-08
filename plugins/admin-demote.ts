import type { Plugin, PluginContext } from '../src/types/plugin.js';
import { isAdmin, isBotAdmin, extractMentions } from '../lib/utils.js';


const plugin: Plugin = {
    commands: ['demote'],
    
    async execute(ctx: PluginContext): Promise<void> {
        if (!ctx.isGroup) {
            await ctx.reply('ꕤ Este comando solo funciona en grupos.');
            return;
        }

        const admin = await isAdmin(ctx.bot.sock, ctx.chatId, ctx.sender);
        if (!admin) {
            await ctx.reply('ꕤ Solo los administradores pueden usar este comando.');
            return;
        }

        const botAdmin = await isBotAdmin(ctx.bot.sock, ctx.chatId);
        if (!botAdmin) {
            await ctx.reply('ꕤ Necesito ser administrador para degradar usuarios.');
            return;
        }

        const mentions = extractMentions(ctx);
        if (mentions.length === 0) {
            await ctx.reply('ꕤ Debes mencionar al usuario a degradar.');
            return;
        }

        try {
            await ctx.bot.sock.groupParticipantsUpdate(ctx.chatId, mentions, 'demote');
            await ctx.reply(`ꕥ @${mentions[0].split('@')[0]} ya no es administrador.`, {
                mentions
            });
        } catch (error: unknown) {
            await ctx.reply('ꕤ Error al degradar al usuario.');
        }
    }
};

export default plugin;
