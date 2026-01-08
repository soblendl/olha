import type { Plugin, PluginContext } from '../src/types/plugin.js';

import { styleText } from '../lib/utils.js';

const plugin: Plugin = {
    commands: ['shop', 'tienda', 'store', 'buy', 'comprar', 'item', 'objeto'],

    async execute(ctx: PluginContext): Promise<void> {

        const { shopService, command, args } = ctx;
        if (['shop', 'tienda', 'store'].includes(command)) {
            const page = parseInt(ctx.args[0]) || 1;
            const shopData = shopService.getItems(page, 10);
            let text = `╭─────── ୨୧ ───────╮\n`;
            text += `│ *Soblend Shop*\n`;
            text += `│ ✎ \`Página ${shopData.currentPage}/${shopData.totalPages}\`\n`;
            text += `╰─────────────────╯\n\n`;

            text += ` ⟡ *STOCK (Renueva en 5m)*\n\n`;

            if (shopData.items.length === 0) {
                text += `> » No hay objetos en esta página.`;
            } else {
                for (const item of shopData.items) {
                    const price = item.price.toLocaleString('es-ES');
                    const stock = item.stock > 0 ? `${item.stock}` : `AGOTADO`;

                    text += `╭─── » *${item.name}*\n`;
                    text += `│ ✿ *ID* » \`${item.id}\`\n`;
                    text += `│ ✿ *Precio* » ${price}\n`;
                    text += `│ ✿ *Stock* » ${stock}\n`;
                    text += `│ ✿ _${item.desc.substring(0, 40)}${item.desc.length > 40 ? '...' : ''}_\n`;
                    text += `╰───────────────────\n\n`;
                }
            }

            text += ` ⟡ *CÓMO COMPRAR*\n`;
            text += `> Usa: *#buy <id> <cantidad>*\n`;
            text += `> Ej: *#buy pot_vida_1 5*\n`;
            text += `> Ver más: *#shop ${page + 1}*`;

            await ctx.ctx.reply(styleText(text));
        }
        if (['buy', 'comprar'].includes(command)) {
            const itemId = ctx.args[0];
            const quantity = parseInt(ctx.args[1]) || 1;

            if (!itemId) {
                await ctx.ctx.reply(styleText(`❌ Ingresa el ID del objeto a comprar.\n> Ejemplo: #buy pot_vida_1 5`));
            }
            if (quantity < 1) {
                await ctx.ctx.reply(styleText(`❌ Cantidad inválida.`));
            }

            const result = await shopService.buyItem(ctx.ctx.sender, itemId, quantity);

            if (result.success) {
                await ctx.ctx.reply(styleText(
                    `╭─────── ୨୧ ──────╮\n` +
                    `│ *COMPRA REALIZADA*\n` +
                    `╰─────────────────╯\n` +
                    `✿ *Objeto:* ${result.item.name}\n` +
                    `✿ *Cantidad:* x${quantity}\n` +
                    `✿ *Total:* ${Math.floor(result.item.price * quantity).toLocaleString()}\n` +
                    `✿ *Nuevo Saldo:* ${result.remainingBalance.toLocaleString()}`
                ));
            } else {
                await ctx.ctx.reply(styleText(`ꕤ ${result.error}`));
            }
        }
        if (['item', 'objeto'].includes(command)) {
            const itemId = ctx.args[0];
            if (!itemId) {
                await ctx.ctx.reply(styleText('ꕤ Especifica el ID del objeto para ver detalles.'));
            }
            const item = shopService.getItem(itemId);
            if (!item) {
                await ctx.ctx.reply(styleText('ꕤ Objeto no encontrado.'));
            }
            await ctx.ctx.reply(styleText(
                `ꕥ *${item.name}*\n\n` +
                `✿ *ID:* ${item.id}\n` +
                `✿ *Precio:* ${item.price.toLocaleString()}\n` +
                `✿ *Stock:* ${item.stock}\n` +
                `✿ *Descripción:* ${item.desc}`
            ));
        }
    }
};

export default plugin;
