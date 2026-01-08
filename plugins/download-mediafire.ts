import type { Plugin, PluginContext } from '../src/types/plugin.js';

import axios from 'axios';


const plugin: Plugin = {
    commands: ['mediafire', 'mf', 'mfdl'],
    
    async execute(ctx: PluginContext): Promise<void> {
        try {
            if (ctx.args.length === 0) {
                await ctx.reply(
                    `《✧》 *Uso incorrecto del comando*\n\n` +
                    `Ejemplo:\n` +
                    `✿ #mediafire https://www.mediafire.com/file/xxxxx`
                );
            return;
            }

            const url = ctx.args[0];
            if (!url.includes('mediafire.com')) {
                await ctx.reply('《✧》 Por favor ingresa un link válido de MediaFire.');
            return;
            }

            const apiUrl = `https://delirius-apiofc.vercel.app/download/mediafire?url=${encodeURIComponent(url)}`;
            const response = await axios.get(apiUrl, { timeout: 30000 });
            const data = response.data;

            if (!data || !data.data || !data.data[0]) {
                await ctx.reply('《✧》 No se pudo obtener información del enlace.');
            return;
            }

            const file = data.data[0];
            if (!file.link) {
                await ctx.reply('《✧》 No se pudo obtener el enlace de descarga.');
            return;
            }

            const caption = `╔═══《 MEDIAFIRE 》═══╗\n` +
                `║\n` +
                `║ ✦ *Nombre:* ${file.nama || 'Desconocido'}\n` +
                `║ ✦ *Peso:* ${file.size || 'N/A'}\n` +
                `║ ✦ *Tipo:* ${file.mime || 'N/A'}\n` +
                `║\n` +
                `╚═════════════════╝`;

            const fileResponse = await axios.get(file.link, {
                responseType: 'arraybuffer',
                timeout: 60000,
                maxContentLength: 100 * 1024 * 1024
            });

            const buffer = Buffer.from(fileResponse.data);

            if (file.mime?.includes('image')) {
                await ctx.replyWithImage(buffer, {
                    caption: caption,
                    fileName: file.nama || 'archivo'
                });
            } else if (file.mime?.includes('video')) {
                await ctx.replyWithVideo(buffer, {
                    caption: caption,
                    fileName: file.nama || 'video.mp4'
                });
            } else if (file.mime?.includes('audio')) {
                await ctx.replyWithAudio(buffer, {
                    caption: caption,
                    fileName: file.nama || 'audio.mp3'
                });
            } else {
                await ctx.replyWithDocument(buffer, {
                    caption: caption,
                    fileName: file.nama || 'archivo',
                    mimetype: file.mime || 'application/octet-stream'
                });
            }

        } catch (error: unknown) {
            console.error('Error en comando mediafire:', error);
            await ctx.reply(
                `《✧》 Error al procesar el enlace de MediaFire.\n\n💡 *Tip:* Asegúrate de que el enlace de MediaFire sea válido y público.`
            );
        }
    }
};

export default plugin;
