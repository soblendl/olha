import type { Plugin, PluginContext } from '../src/types/plugin.js';
import { styleText } from '../lib/utils.js';
import fs from 'fs';
import path from 'path';

const plugin: Plugin = {
    commands: ['setnamesubbot', 'setimagesubbot', 'configbot', 'miconfig'],
    async execute(ctx: PluginContext): Promise<void> {
        const tokenService = ctx.tokenService;
        const command = ctx.command;
        const userId = ctx.senderPhone ? `${ctx.senderPhone}@s.whatsapp.net` : ctx.sender;
        const prembot = tokenService?.getPrembot(userId);
        if (!prembot) {
            await ctx.reply(styleText(
                `ꕤ *Error*\n\n` +
                `> Este comando solo está disponible para Prembots.\n` +
                `> Usa *#prembot buy* para obtener uno.`
            ));
            return;
        }
        if (command === 'setnamesubbot') {
            const name = ctx.args.join(' ').trim();
            if (!name) {
                await ctx.reply(styleText(
                    `ꕥ *Establecer Nombre del Bot*\n\n` +
                    `*Uso:* #setnamesubbot <nombre>\n\n` +
                    `*Ejemplo:*\n` +
                    `> #setnamesubbot MiBot Premium\n\n` +
                    `> _El nombre aparecerá en el menú /help_`
                ));
                return;
            }
            if (name.length > 50) {
                await ctx.reply(styleText(`ꕤ El nombre es muy largo (máx. 50 caracteres)`));
                return;
            }
            const result = tokenService.setPrembotName(userId, name);
            if (result.success) {
                await ctx.reply(styleText(
                    `ꕥ *Nombre Establecido*\n\n` +
                    `> Tu bot ahora se llamará: *${name}*\n\n` +
                    `> _Usa #help para verificar el cambio_`
                ));
            } else {
                await ctx.reply(styleText(`ꕤ ${result.error}`));
            }
            return;
        }
        if (command === 'setimagesubbot') {
            const msg = ctx.msg;
            let imageMessage = null;
            const extendedMsg = msg.message?.extendedTextMessage;
            const quotedMsg = extendedMsg?.contextInfo?.quotedMessage;
            if (msg.message?.imageMessage) {
                imageMessage = msg.message.imageMessage;
            }
            else if (quotedMsg?.imageMessage) {
                imageMessage = quotedMsg.imageMessage;
            }
            if (!imageMessage) {
                await ctx.reply(styleText(
                    `ꕥ *Establecer Imagen del Menú*\n\n` +
                    `*Uso:*\n` +
                    `> Enviar imagen con #setimagesubbot\n` +
                    `> O citar una imagen con #setimagesubbot\n\n` +
                    `> _La imagen aparecerá en el menú /help_`
                ));
                return;
            }
            try {
                const prembotDir = path.join(process.cwd(), 'prembots', userId.split('@')[0]);
                if (!fs.existsSync(prembotDir)) {
                    fs.mkdirSync(prembotDir, { recursive: true });
                }
                const imagePath = path.join(prembotDir, 'menu.jpg');
                const buffer = await ctx.download(msg); 
                fs.writeFileSync(imagePath, buffer);
                const result = tokenService.setPrembotImage(userId, imagePath);
                if (result.success) {
                    await ctx.reply(styleText(
                        `ꕤ *Imagen del Menú Establecida*\n\n` +
                        `> La imagen se ha guardado correctamente.\n\n` +
                        `> _Usa #help para verificar el cambio_`
                    ));
                } else {
                    await ctx.reply(styleText(`ꕤ ${result.error}`));
                }
            } catch (error: unknown) {
                console.error('[Prembot Config] Error:', error);
                await ctx.reply(styleText(`ꕤ Error al guardar la imagen: ${(error as Error).message}`));
            }
            return;
        }
        if (command === 'configbot' || command === 'miconfig') {
            const config = tokenService.getPrembotConfig(userId);
            await ctx.reply(styleText(
                `ꕥ *Configuración de tu Prembot*\n\n` +
                `✿ *Nombre:* ${config?.customName || 'Por defecto'}\n` +
                `✿ *Imagen:* ${config?.customImage ? 'Personalizada' : 'Por defecto'}\n\n` +
                `> Usa *#setnamesubbot* para cambiar el nombre\n` +
                `> Usa *#setimagesubbot* para cambiar la imagen`
            ));
            return;
        }
    }
};

export default plugin;