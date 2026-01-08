import type { Plugin, PluginContext } from '../src/types/plugin.js';

import { styleText } from '../lib/utils.js';

const plugin: Plugin = {
    commands: ['inventory', 'inv', 'bag', 'use', 'usar'],

    async execute(ctx: PluginContext): Promise<void> {

        const { shopService, command, args, dbService } = ctx;

        // --- Ver Inventario ---
        if (['inventory', 'inv', 'bag'].includes(command)) {
            const inventory = shopService.getInventory(ctx.ctx.sender);

            if (inventory.length === 0) {
                await ctx.ctx.reply(styleText(`🎒 *Tu inventario está vacío.*\n> Ve a la #shop para comprar cosas.`));
            }

            let text = `🎒 *INVENTARIO DE ${ctx.from.name.toUpperCase()}*\n\n`;

            // Agrupar por categoría visualmente? No, lista simple por ahora
            for (const item of inventory) {
                if (item.count > 0) {
                    text += `▪️ *${item.name}* (x${item.count})\n`;
                    text += `> ID: ${item.id}\n`;
                }
            }

            text += `\n> Usa *#use <id>* para usar un objeto.`;
            await ctx.ctx.reply(styleText(text));
        }

        // --- Usar Objeto ---
        if (['use', 'usar'].includes(command)) {
            const itemId = ctx.args[0];
            if (!itemId) {
                await ctx.ctx.reply(styleText('ꕤ Especifica el ID del objeto a usar.'));
            }
            // TODO: Implement item usage logic
            await ctx.ctx.reply(styleText('ꕤ Funcionalidad en desarrollo.'));
        }
    }
};

export default plugin;
