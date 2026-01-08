import type { Plugin, PluginContext } from '../src/types/plugin.js';
import axios from 'axios';
import { styleText } from '../lib/utils.js';

const plugin: Plugin = {
    commands: ['speak', 'tts', 'decir'],

    async execute(ctx: PluginContext): Promise<void> {
        const { text } = ctx;

        if (!text || !text.trim()) {
            await ctx.reply(styleText('ꕤ Escribe el texto que quieres convertir a voz.'));
            return;
        }

        try {
            await ctx.reply(styleText('ꕤ Generando audio...'));

            const response = await axios({
                method: 'GET',
                url: `https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM`,
                params: {
                    text: text.trim(),
                    voice_settings: JSON.stringify({
                        stability: 0.5,
                        similarity_boost: 0.5
                    })
                },
                responseType: 'arraybuffer'
            });

            const buffer = Buffer.from(response.data);
            await ctx.replyWithAudio(buffer);

        } catch (error: unknown) {
            console.error('[Speak] Error:', error);
            await ctx.reply(styleText('ꕤ Error al generar el audio.'));
        }
    }
};

export default plugin;