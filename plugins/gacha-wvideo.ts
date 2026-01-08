import type { Plugin, PluginContext } from '../src/types/plugin.js';

const plugin: Plugin = {
    commands: ['wvideo'],
    
    async execute(ctx: PluginContext): Promise<void> {
        if (ctx.args.length === 0) {
            await ctx.bot.sock.sendMessage(ctx.chatId, {
                text: 'ꕤ Debes especificar el nombre del personaje.\nUso: #wvideo <personaje>'
            });
            return;
        }

        await ctx.bot.sock.sendMessage(ctx.chatId, {
            text: `🎥 *Video de Waifu*\n\n` +
                `Este comando requiere integración con APIs de videos.\n` +
                `Por ahora está en modo de demostración.`
        });
            return;
    }
};

export default plugin;
