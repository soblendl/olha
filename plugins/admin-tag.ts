import type { Plugin, PluginContext } from '../src/types/plugin.js';
import { isAdmin } from '../lib/utils.js';


const plugin: Plugin = {
    commands: ['tag'],
    
    async execute(ctx: PluginContext): Promise<void> {
        if (!ctx.isGroup) {
            await ctx.reply('ꕤ Este comando solo funciona en grupos.');
            return;
        }

        const admin = await isAdmin(ctx.bot.sock, ctx.chatId, ctx.from.id);
        if (!admin) {
            await ctx.reply('ꕤ Solo los administradores pueden usar este comando.');
            return;
        }

        const text = ctx.args.join(' ') || 'Atención a todos!';

        try {
            const groupMetadata = await ctx.bot.sock.groupMetadata(ctx.chatId);
            const participants = groupMetadata.participants.map(p => p.id);

            await ctx.reply(`ꕥ *Anuncio*\n\n${text}`, {
                mentions: participants
            });
        } catch (error: unknown) {
            await ctx.reply('ꕤ Error al enviar el anuncio.');
        }
    }
};

export default plugin;
