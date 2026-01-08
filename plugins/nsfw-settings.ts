import type { Plugin, PluginContext } from '../src/types/plugin.js';
import { isAdmin } from '../lib/utils.js';


const plugin: Plugin = {
    commands: ['porn'],
    
    async execute(ctx: PluginContext): Promise<void> {
        if (!ctx.isGroup) {
            await ctx.bot.sock.sendMessage(ctx.chatId, { text: 'ꕤ Este comando solo funciona en grupos.' });
            return;
        }

        const admin = await isAdmin(ctx.bot.sock, ctx.chatId, ctx.sender);
        if (!admin) {
            await ctx.bot.sock.sendMessage(ctx.chatId, { text: 'ꕤ Solo los administradores pueden usar este comando.' });
            return;
        }

        if (!ctx.args[0] || !['on', 'off'].includes(ctx.args[0].toLowerCase())) {
            await ctx.bot.sock.sendMessage(ctx.chatId, { text: 'ꕤ Uso: #porn <on/off>' });
            return;
        }

        const enable = ctx.args[0].toLowerCase() === 'on';
        (global.db as any).groups[ctx.chatId].settings.porn = enable;

        await ctx.bot.sock.sendMessage(ctx.chatId, {
            text: `ꕤ Comandos NSFW ${enable ? 'activados' : 'desactivados'}.`
        });
            return;
    }
};

export default plugin;
