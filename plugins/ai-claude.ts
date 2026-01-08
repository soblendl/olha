import type { Plugin, PluginContext } from '../src/types/plugin.js';
import axios from 'axios';

import { styleText } from '../lib/utils.js';

const plugin: Plugin = {
    commands: ['claude'],

    async execute(ctx: PluginContext): Promise<void> {

        const { bot, chatId, args, text, reply } = ctx;

        if (!text) {
            await reply(styleText('ꕤ Por favor escribe algo para hablar con Claude.\nEjemplo: #claude Hola, ¿qué puedes hacer?'));
            return;
        }

        try {
            const apiUrl = `https://mayapi.ooguy.com/ai-claude?q=${encodeURIComponent(text)}&apikey=may-2c29b3db`;
            const response = await axios.get(apiUrl);
            const data = response.data;
            
            if (!data || !data.status || !data.result) {
                await reply(styleText('ꕤ No pude obtener una respuesta de Claude. Inténtalo más tarde.'));
                return;
            }

            await reply(styleText(data.result));
        } catch (error: unknown) {
            console.error('[Claude] Error:', error);
            await reply(styleText('ꕤ Error al obtener respuesta de Claude.'));
        }
    }
};

export default plugin;