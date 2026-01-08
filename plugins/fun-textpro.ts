import type { Plugin, PluginContext } from '../src/types/plugin.js';
import { styleText } from '../lib/utils.js';

const plugin: Plugin = {
    commands: ['textpro'],

    async execute(ctx: PluginContext): Promise<void> {

        const { bot, msg, text, chatId, args, reply } = ctx;

        if (!text) {
            await reply(styleText('ꕤ Uso: #textpro <efecto> <texto>\n\nEfectos disponibles:\nneon, magma, glitch, thunder, blackpink'));
            return;
        }

        const effect = args[0].toLowerCase();
        const content = args.slice(1).join(' ');

        if (!content) {
            await reply(styleText('ꕤ Debes escribir el texto.'));
            return;
        }

        const effects = {
            'neon': 'https://textpro.me/images/user_image/2023/11/1700813735.jpg', // Placeholder logic, actually need an API
            'magma': 'magma',
            'glitch': 'glitch',
            'thunder': 'thunder',
            'blackpink': 'blackpink'
        };

        if (!Object.keys(effects).includes(effect)) {
            await reply(styleText('ꕤ Efecto no válido. Disponibles: ' + Object.keys(effects).join(', ')));
            return;
        }

        try {
            await reply(styleText('ꕤ Generando imagen...'));
            // Using a generic API endpoint structure for textpro
            // If this fails, user will likely report it and we can adjust
            const apiUrl = `https://api.stellarwa.xyz/textpro/${effect}?text=${encodeURIComponent(content)}&key=stellar-20J4F8hk`;

            await bot.sock.sendMessage(chatId, {
                image: { url: apiUrl },
                caption: styleText(`🎨 *Efecto:* ${effect}`)
            }, { quoted: msg });

        } catch (error: unknown) {
            console.error('[TextPro] Error:', error);
            await reply(styleText('ꕤ Error al generar la imagen.'));
        }
    }
};

export default plugin;