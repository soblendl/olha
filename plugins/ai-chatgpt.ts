import type { Plugin, PluginContext } from '../src/types/plugin.js';

import axios from 'axios';
import { styleText } from '../lib/utils.js';

const API_KEY = 'may-0fe5c62b';
const API_URL = 'https://api.soymaycol.icu/ai-chatgpt';

const plugin: Plugin = {
    commands: ['chatgpt', 'gpt', 'chat'],

    async execute(ctx: PluginContext): Promise<void> {

        const { args, reply } = ctx;

        const texto = args.join(' ');

        if (!texto) {
            await reply(styleText(
                `ꕤ *ChatGPT*\n\n` +
                `> Escribe algo para hablar con ChatGPT\n\n` +
                `*Uso:*\n` +
                `> /chatgpt ¿Cómo estás?\n` +
                `> /gpt Cuéntame un chiste`
            ));
            return;
        }

        try {
            await reply(styleText(`ꕤ *Pensando...*`));

            const response = await axios.get(API_URL, {
                params: {
                    q: texto,
                    apikey: API_KEY
                },
                timeout: 30000
            });

            const data = response.data;

            if (!data || !data.status || !data.result?.message) {
                await reply(styleText(`ꕤ *Error*\n\n> No se pudo obtener una respuesta.`));
                return;
            }

            const respuesta = data.result.message;

            await reply(styleText(
                `ꕤ *ChatGPT*\n\n` +
                `${respuesta}`
            ));

        } catch (error: any) {
            console.error('[ChatGPT] Error:', error);

            if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
                await reply(styleText(`ꕤ *Error*\n\n> La solicitud tardó demasiado. Intenta de nuevo.`));
                return;
            }

            await reply(styleText(`ꕤ *Error*\n\n> No se pudo conectar con ChatGPT.`));
        }
    }
};

export default plugin;