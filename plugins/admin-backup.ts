import type { Plugin, PluginContext } from '../src/types/plugin.js';

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { styleText } from '../lib/utils.js';

const plugin: Plugin = {
    commands: ['backup', 'dbbackup'],
    async execute(ctx: PluginContext): Promise<void> {
        const { reply, sender, dbService } = ctx;
        const ownerNumber = '573115434166';
        if (!sender.includes(ownerNumber)) {
            await reply(styleText('⛔ Solo el owner puede usar este comando.'));
        }
        try {
            await reply(styleText('ꕥ Generando backup de base de datos... 📦'));
            await dbService.save();
            const dbPath = path.join(__dirname, '..', 'database');
            const files = ['users.json', 'groups.json', 'gacha.json', 'tokens.json'];
            let sentCount = 0;
            for (const file of files) {
                const filePath = path.join(dbPath, file);
                if (fs.existsSync(filePath)) {
                    const fileContent = fs.readFileSync(filePath);
                    await ctx.bot.sendMessage(ctx.chatId, {
                        document: fileContent,
                        mimetype: 'application/json',
                        fileName: `BACKUP_${Date.now()}_${file}`,
                        caption: styleText(`ꕥ *Backup:* ${file}`)
                    }, { quoted: ctx.msg });
                    sentCount++;
                }
            }
            if (sentCount === 0) {
                await reply(styleText('⚠️ No se encontraron archivos de base de datos para enviar.'));
            } else {
                await reply(styleText(`✅ Backup completado (${sentCount} archivos).`));
            }

        } catch (error: unknown) {
            console.error('Error en backup:', error);
            await reply(styleText('❌ Error al generar el backup.'));
        }
    }
};

export default plugin;