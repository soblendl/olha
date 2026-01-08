import type { Plugin, PluginContext } from '../src/types/plugin.js';

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { styleText, isOwner } from '../lib/utils.js';

const plugin: Plugin = {
    commands: ['resetdb', 'cleardb'],

    async execute(ctx: PluginContext): Promise<void> {

        const { sender, dbService, reply } = ctx;

        // Verificar Owner
        const ownerNumber = '573115434166';
        if (!sender.includes(ownerNumber)) {
            await reply(styleText('⛔ Solo el owner puede usar este comando.'));
            return;
        }

        try {
            await reply(styleText('⚠️ *ADVERTENCIA*: Iniciando borrado completo de base de datos... ⚠️'));

            // 1. Crear backup automático antes de borrar
            const dbPath = path.join(__dirname, '..', 'database');
            const timestamp = Date.now();

            // Backup Users
            if (fs.existsSync(path.join(dbPath, 'users.json'))) {
                fs.copyFileSync(
                    path.join(dbPath, 'users.json'),
                    path.join(dbPath, `users_backup_${timestamp}.json`)
                );
            }

            // Backup Groups
            if (fs.existsSync(path.join(dbPath, 'groups.json'))) {
                fs.copyFileSync(
                    path.join(dbPath, 'groups.json'),
                    path.join(dbPath, `groups_backup_${timestamp}.json`)
                );
            }

            // 2. Resetear archivos JSON
            fs.writeFileSync(path.join(dbPath, 'users.json'), '[]');
            fs.writeFileSync(path.join(dbPath, 'groups.json'), '[]');

            // 3. Recargar la base de datos
            await (dbService as any).load();

            await reply(styleText(
                `✅ *Base de datos reseteada*\n\n` +
                `🗑️ Archivos limpiados.\n` +
                `📦 Backup automático creado: _${timestamp}_`
            ));

        } catch (error: unknown) {
            console.error('[AdminResetDB] Error:', error);
            await reply(styleText('ꕤ Error al resetear la base de datos.'));
        }
    }
};

export default plugin;