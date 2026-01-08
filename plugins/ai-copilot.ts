import type { Plugin, PluginContext } from '../src/types/plugin.js';
import axios from 'axios';

import { styleText } from '../lib/utils.js';

const plugin: Plugin = {
    commands: ['copilot'],

    async execute(ctx: PluginContext): Promise<void> {

        const { bot, chatId, args, text, reply } = ctx;

        if (!text) {
            await reply(styleText('ꕤ Por favor escribe algo para hablar con Copilot.\nEjemplo: #copilot Hola, ¿cómo estás?'));
            return;
        }

        try {
            const apiUrl = `https://api.stellarwa.xyz/ai/copilot?text=${encodeURIComponent(text)}&key=stellar-20J4F8hk`;
            const response = await axios.get(apiUrl);
            const data = response.data;
            
            if (!data || !data.status || !data.response) {
                await reply(styleText('ꕤ No pude obtener una respuesta de Copilot. Inténtalo más tarde.'));
                return;
            }

            await reply(styleText(data.response));
        } catch (error: unknown) {
            console.error('[Copilot] Error:', error);
            await reply(styleText('ꕤ Error al obtener respuesta de Copilot.'));
        }
    }
};

export default plugin;