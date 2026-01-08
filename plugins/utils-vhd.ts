import type { Plugin, PluginContext } from '../src/types/plugin.js';

import { styleText } from '../lib/utils.js';
import fs from 'node:fs';
import crypto from 'node:crypto';
import axios from 'axios';
import FormData from 'form-data';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const plugin: Plugin = {
    commands: ['videohd', 'vhd'],

    async execute(ctx: PluginContext): Promise<void> {

        const quotedMsg = (ctx as Error).message?.message?.extendedTextMessage?.contextInfo;
        const videoMsg = quotedMsg?.quotedMessage?.videoMessage || (ctx as Error).message?.message?.videoMessage;

        if (!videoMsg) {
        return ctx.reply(styleText(
        `ꕥ *Mejorador de Video HD*\n\n` +
        `> ⚠️ Por favor envía un video o cita un mensaje con video.`
        ));
        }

        const statusMsg = await ctx.reply(styleText(
        `ꕥ *Mejorador de Video HD*\n\n` +
        `> 📥 Descargando video...\n` +
        `> ⏳ Esto puede tardar varios minutos.`
        ));

        let inputPath;
        let outputPath;

        try {
        // Descargar el video
        const videoBuffer = await ctx.bot.downloadMediaMessage(
        quotedMsg ? { message: quotedMsg.quotedMessage } : ctx.message
        );

        // Guardar el video temporalmente
        inputPath = join(tmpdir(), `input_${Date.now()}.mp4`);
        fs.writeFileSync(inputPath, videoBuffer);

        // Actualizar estado
        await ctx.bot.sendMessage(ctx.chatId, {
        text: styleText(
        `ꕥ *Mejorador de Video HD*\n\n` +
        `> ✅ Video descargado\n` +
        `> 🔄 Mejorando calidad a 2K...\n` +
        `> ⏳ Procesando (puede tardar 3-5 minutos)`
        ),
        edit: statusMsg.key
        });

        // Mejorar el video
        const outputUrl = await upscaleVideo(inputPath);

        // Actualizar estado
        await ctx.bot.sendMessage(ctx.chatId, {
        text: styleText(
        `ꕥ *Mejorador de Video HD*\n\n` +
        `> ✅ Mejora completada\n` +
        `> 📥 Descargando video mejorado...`
        ),
        edit: statusMsg.key
        });

        // Descargar el video mejorado
        const response = await axios.get(outputUrl, { responseType: 'arraybuffer' });
        outputPath = join(tmpdir(), `output_${Date.now()}.mp4`);
        fs.writeFileSync(outputPath, response.data);

        // Enviar el video mejorado
        await ctx.bot.sendMessage(ctx.chatId, {
        video: fs.readFileSync(outputPath),
        caption: styleText(
        `ꕥ *Video Mejorado a 2K*\n\n` +
        `> ✨ Calidad mejorada exitosamente\n` +
        `> 🎬 Resolución: 2K`
        ),
        mimetype: 'video/mp4'
        });

        // Eliminar mensaje de estado
        await ctx.bot.sendMessage(ctx.chatId, {
        delete: statusMsg.key
        });

        } catch (error: unknown) {
        console.error('Error al mejorar video:', error);
        await ctx.bot.sendMessage(ctx.chatId, {
        text: styleText(
        `ꕥ *Mejorador de Video HD*\n\n` +
        `> ❌ Error: ${(error as Error).message}\n` +
        `> 💡 Intenta con un video más pequeño o inténtalo más tarde.`
        ),
        edit: statusMsg.key
        });
        } finally {
            // Clean up temp files
            if (inputPath && fs.existsSync(inputPath)) {
                fs.unlinkSync(inputPath);
            }
            if (outputPath && fs.existsSync(outputPath)) {
                fs.unlinkSync(outputPath);
            }
        }
    }
};

export default plugin;
