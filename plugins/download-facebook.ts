import type { Plugin, PluginContext } from '../src/types/plugin.js';

import { igdl } from 'ruhend-scraper';


const plugin: Plugin = {
    commands: ['facebook', 'fb', 'fbdl'],
    
    async execute(ctx: PluginContext): Promise<void> {
        try {
            if (ctx.args.length === 0) {
                await ctx.reply(
                    `《✧》 *Uso incorrecto del comando*\n\n` +
                    `Ejemplo:\n` +
                    `✿ #facebook https://www.facebook.com/watch?v=xxxxx\n` +
                    `✿ #fb https://fb.watch/xxxxx`
                );
            return;
            }

            const url = ctx.args[0];
            if (!url.includes('facebook.com') && !url.includes('fb.watch')) {
                await ctx.reply('《✧》 Por favor ingresa un link válido de Facebook.');
            return;
            }

            const response = await igdl(url);
            const result = response.data;

            if (!result || result.length === 0) {
                await ctx.reply(
                    '《✧》 No se encontraron resultados.\n\n💡 *Tip:* El video puede ser privado o el enlace es incorrecto.'
                );
            return;
            }

            const data = result.find(i => i.resolution === '720p (HD)') ||
                result.find(i => i.resolution === '360p (SD)') ||
                result[0];

            if (!data || !data.url) {
                await ctx.reply('《✧》 No se encontró una resolución adecuada.');
            return;
            }

            await ctx.replyWithVideo(data.url, {
                caption: `《✧》 *Facebook Downloader*\n\n` +
                    `✿ *Resolución:* ${data.resolution || 'Desconocida'}\n` +
                    `✿ *Link original:* ${url}`,
                fileName: 'facebook_video.mp4'
            });

        } catch (error: unknown) {
            console.error('Error en comando facebook:', error);
            await ctx.reply(
                `《✧》 Error al descargar video de Facebook.\n\n💡 *Tip:* Asegúrate de que el video sea público y el enlace esté correcto.`
            );
        }
    }
};

export default plugin;
