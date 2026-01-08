import type { Plugin, PluginContext } from '../src/types/plugin.js';

const plugin: Plugin = {
    commands: ['wimage'],
    
    async execute(ctx: PluginContext): Promise<void> {
        if (ctx.args.length === 0) {
            await ctx.bot.sock.sendMessage(ctx.chatId, {
                text: 'ꕤ Debes especificar el nombre del personaje.\nUso: #wimage <personaje>'
            });
            return;
        }

        await ctx.bot.sock.sendMessage(ctx.chatId, {
            text: `📸 *Imagen de Waifu*\n\n` +
                `Este comando requiere integración con APIs de imágenes.\n` +
                `Por ahora está en modo de demostración.`
        });
            return;
    }
};

export default plugin;
