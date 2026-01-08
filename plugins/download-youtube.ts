import type { Plugin, PluginContext } from '../src/types/plugin.js';
import axios from 'axios';


const plugin: Plugin = {
    commands: ['youtube', 'yt'],

    async execute(ctx: PluginContext): Promise<void> {
        try {
            if (ctx.args.length === 0) {
                await ctx.reply(
                    `《✧》 *Uso incorrecto del comando*\n\n` +
                    `Ejemplo:\n` +
                    `✿ #youtube https://youtu.be/xxxxx\n` +
                    `✿ #yt https://www.youtube.com/watch?v=xxxxx`
                );
            return;
            }

            const url = ctx.args[0];
            if (!url.includes('youtube.com') && !url.includes('youtu.be')) {
                await ctx.reply('《✧》 Por favor ingresa un link válido de YouTube.');
            return;
            }

            await ctx.reply(
                `Usa:\n` +
                `• #ytmp3 ${url} para audio\n` +
                `• #ytmp4 ${url} para video`
            );

        } catch (error: unknown) {
            console.error('Error en comando youtube:', error);
            await ctx.reply(`《✧》 Error al procesar el enlace de YouTube.`);
        }
    }
};

export default plugin;