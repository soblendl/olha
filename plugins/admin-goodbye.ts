import type { Plugin, PluginContext } from '../src/types/plugin.js';
import { styleText, isAdmin } from '../lib/utils.js';

const plugin: Plugin = {
    commands: ['goodbye'],

    async execute(ctx: PluginContext): Promise<void> {

        if (!ctx.ctx.isGroup) {
            await ctx.ctx.reply(styleText('ꕤ Este comando solo funciona en grupos.'));
        }

        const admin = await isAdmin(ctx.bot, ctx.ctx.chatId, ctx.senderLid || ctx.ctx.sender);
        if (!admin) {
            await ctx.ctx.reply(styleText('ꕤ Solo los administradores pueden usar este comando.'));
        }

        if (!ctx.ctx.args[0] || !['on', 'off'].includes(ctx.ctx.args[0].toLowerCase())) {
            await ctx.ctx.reply(styleText('ꕤ Uso: */goodbye* `<on/off>`'));
        }

        try {
            const enable = ctx.ctx.args[0].toLowerCase() === 'on';
            const result = ctx.dbService.updateGroup(ctx.ctx.chatId, { 'settings.goodbye': enable });

            if (result) {
                await ctx.ctx.reply(styleText(`ꕥ Despedidas ${enable ? 'activadas ✅' : 'desactivadas ❌'}.`));
            } else {
                throw new Error('Database update failed');
            }
        } catch (error: unknown) {
            console.error('[AdminGoodbye] Error:', error);
            await ctx.ctx.reply(styleText('ꕤ Error al ejecutar el comando.'));
        }
    }
};

export default plugin;
