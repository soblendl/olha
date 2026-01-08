import type { Plugin, PluginContext } from '../src/types/plugin.js';
import { isAdmin, isBotAdmin, extractMentions } from '../lib/utils.js';


const plugin: Plugin = {
    commands: ['ban'],
    
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
            await ctx.reply('ꕤ Necesito ser administrador para banear usuarios.');
            return;
        }

        const mentions = extractMentions(ctx);
        if (mentions.length === 0) {
            await ctx.reply('ꕤ Debes mencionar al usuario a banear.');
            return;
        }

        const user = mentions[0];
        const groupData = ctx.dbService.getGroup(ctx.chatId);
        
        if (!groupData.banned) {
            groupData.banned = [];
        }

        if (groupData.banned.includes(user)) {
            await ctx.reply('ꕤ Ese usuario ya está baneado.');
            return;
        }

        groupData.banned.push(user);
        ctx.dbService.markDirty();

        try {
            await ctx.bot.sock.groupParticipantsUpdate(ctx.chatId, [user], 'remove');
            await ctx.reply(`ꕤ @${user.split('@')[0]} ha sido baneado del grupo.`, {
                mentions: [user]
            });
        } catch (error: unknown) {
            await ctx.reply('ꕤ Error al banear al usuario.');
        }
    }
};

export default plugin;
