import type { Plugin, PluginContext } from '../src/types/plugin.js';

import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { styleText } from '../lib/utils.js';

const plugin: Plugin = {
    commands: ['update', 'reload'],

    async execute(ctx: PluginContext): Promise<void> {

        const { reply, sender } = ctx;

        // Verificar Owner
        const ownerNumber = '573115434166';
        if (!sender.includes(ownerNumber)) {
            await reply(styleText('⛔ Solo el owner puede usar este comando.'));
            return;
        }

        try {
            await reply(styleText('ꕥ Iniciando recarga de sistema... 🔄'));

            // Limpiar mapas actuales
            (global as any).commandMap.clear();
            (global as any).beforeHandlers = [];

            // Leer directorio de plugins
            const pluginFiles = fs.readdirSync(__dirname).filter(file => file.endsWith('.js'));
            let successCount = 0;
            let failCount = 0;

            for (const file of pluginFiles) {
                try {
                    // Cache busting: añadir query param con timestamp
                    const filePath = pathToFileURL(path.join(__dirname, file)).href + '?update=' + Date.now();
                    const plugin = await import(filePath);
                    const pluginExport = plugin.default;

                    if (pluginExport && pluginExport.commands) {
                        // Re-registrar before handlers
                        if (pluginExport.before && typeof pluginExport.before === 'function') {
                            (global as any).beforeHandlers.push({
                                plugin: file,
                                handler: pluginExport.before
                            });
                        }

                        // Re-registrar comandos
                        for (const cmd of pluginExport.commands) {
                            (global as any).commandMap.set(cmd, {
                                execute: pluginExport.execute,
                                plugin: file
                            });
                        }
                        successCount++;
                    }
                } catch (err: unknown) {
                    console.error(`Error recargando ${file}:`, err);
                    failCount++;
                }
            }

            await reply(styleText(
                `✅ *Sistema Actualizado*\n\n` +
                `📦 Plugins recargados: ${successCount}\n` +
                `❌ Fallos: ${failCount}\n` +
                `⚙️ Comandos activos: ${(global as any).commandMap.size}`
            ));

        } catch (error: unknown) {
            console.error('[AdminUpdate] Error:', error);
            await reply(styleText('ꕤ Error al actualizar el sistema.'));
        }
    }
};

export default plugin;