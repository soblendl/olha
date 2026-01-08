import type { Plugin, PluginContext } from '../src/types/plugin.js';

import fetch from "node-fetch";
import fs from "fs";
import path from "path";
import { styleText } from '../lib/utils.js';

const plugin: Plugin = {
    commands: ['sp', 'spotifydl', 'spot'],

    async execute(ctx: PluginContext): Promise<void> {

        const { bot, chatId, args, reply, msg } = ctx;
        const query = args.join(' ');

        if (!query) {
            await reply(styleText('ꕤ Ingresa el link o nombre de la canción.'));
            return;
        }

        try {
            const song = await searchSong(query);
            const fileName = `spotify_${Date.now()}.mp3`;
            const outputPath = path.resolve('./tmp', fileName);
            
            await downloadSong(song.url, outputPath);
            
            if (!fs.existsSync(outputPath)) {
                throw new Error('No se pudo guardar el archivo');
            }
            
            const caption = styleText(
                `*SPOTIFY DOWNLOAD* \n\n` +
                `> ᰔᩚ Título » ${song.title}\n` +
                `> ❀ Artista » ${song.artist}\n` +
                `> ⚝ Duración » ${song.duration || 'N/A'}\n\n` +
                `> ⤷ ゛Powered By DeltaByteˎˊ˗`
            );

            await bot.sock.sendMessage(chatId, {
                audio: { url: outputPath },
                mimetype: 'audio/mpeg',
                fileName: `${song.title}.mp3`,
                caption: caption
            }, { quoted: msg });
            
            fs.unlinkSync(outputPath);
        } catch (error: unknown) {
            console.error('[Spotify] Error:', error);
            await reply(styleText('ꕤ Error al descargar la canción.'));
        }
    }
};

export default plugin;