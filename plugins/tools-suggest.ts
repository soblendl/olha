import type { Plugin, PluginContext } from '../src/types/plugin.js';
import { styleText } from '../lib/utils.js';

const plugin: Plugin = {
    commands: ['suggest', 'sugerencia'],

    async execute(ctx: PluginContext): Promise<void> {
        const { text, sender, bot } = ctx;
        const OWNER_JID = '573115434166@s.whatsapp.net';

        if (!text || !text.trim()) {
            await ctx.reply(styleText('ꕤ Por favor escribe tu sugerencia.\nEjemplo: #suggest Agregar más juegos'));
            return;
        }

        try {
            const suggestion = text.trim();
            const message = `📝 *Nueva Sugerencia*\n\n` +
                `De: @${sender.split('@')[0]}\n\n` +
                `Sugerencia: ${suggestion}`;

            await bot.sock.sendMessage(OWNER_JID, {
                text: styleText(message),
                mentions: [sender]
            });

            await ctx.reply(styleText('ꕤ ¡Gracias! Tu sugerencia ha sido enviada al administrador.'));

        } catch (error: unknown) {
            console.error('[Suggest] Error:', error);
            await ctx.reply(styleText('ꕤ Error al enviar la sugerencia.'));
        }
    }
};

export default plugin;