import type { Plugin, PluginContext } from '../src/types/plugin.js';
import { isAdmin } from '../lib/utils.js';


const plugin: Plugin = {
    commands: ['welcome'],
    
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

        if (!ctx.args[0] || !['on', 'off'].includes(ctx.args[0].toLowerCase())) {
            await ctx.reply('ꕤ Uso: */welcome* `<on/off>`');
            return;
        }

        const enable = ctx.args[0].toLowerCase() === 'on';
        const groupData = ctx.dbService.getGroup(ctx.chatId);
        groupData.settings.welcome = enable;
        ctx.dbService.markDirty();

        await ctx.reply(`ꕥ Bienvenidas ${enable ? 'activadas' : 'desactivadas'}.`);
    }
};

export default plugin;
