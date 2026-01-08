import type { Plugin, PluginContext } from '../src/types/plugin.js';

const plugin: Plugin = {
    commands: ['marketplace', 'market', 'tienda'],
    category: 'plugins',
    description: 'Explorar el marketplace de plugins',
    usage: '#marketplace [search|buy|publish]',

    async execute(ctx: PluginContext): Promise<void> {
        const [action, ...params] = ctx.args;

        if (!action || action === 'browse') {
            const plugins = await ctx.pluginMarketplace.searchPlugins('', 'downloads');
            
            if (plugins.length === 0) {
                await ctx.reply('📦 El marketplace aún está vacío.\nUsa #marketplace publish para publicar el primer plugin!');
            return;
            }

            let message = '🛒 *MARKETPLACE DE PLUGINS*\n\n';
            
            plugins.slice(0, 5).forEach((plugin: any, index: number) => {
                message += `${index + 1}. *${plugin.name}*\n`;
                message += `   ${plugin.description}\n`;
                message += `   💰 ${plugin.price} monedas | ⬇️ ${plugin.downloads} | ⭐ ${plugin.rating}\n\n`;
            });

            message += `\nComandos:\n`;
            message += `#marketplace search <término>\n`;
            message += `#marketplace buy <ID>\n`;
            message += `#marketplace publish`;

            await ctx.reply(message);
            return;
        }

        if (action === 'search') {
            const query = params.join(' ');
            if (!query) {
                await ctx.reply('⚠️ Uso: #marketplace search <término>');
            return;
            }

            const plugins = await ctx.pluginMarketplace.searchPlugins(query, 'downloads');
            
            if (plugins.length === 0) {
                await ctx.reply(`❌ No se encontraron plugins para "${query}"`);
            return;
            }

            let message = `🔍 Resultados para "${query}":\n\n`;
            
            plugins.forEach((plugin: any, index: number) => {
                message += `${index + 1}. *${plugin.name}*\n`;
                message += `   ${plugin.description}\n`;
                message += `   💰 ${plugin.price} | ⭐ ${plugin.rating}\n\n`;
            });

            await ctx.reply(message);
            return;
        }

        if (action === 'buy') {
            const pluginId = params[0];
            if (!pluginId) {
                await ctx.reply('⚠️ Uso: #marketplace buy <ID>');
            return;
            }

            try {
                const result = await ctx.pluginMarketplace.purchasePlugin(ctx.sender, pluginId);
                await ctx.reply(`✅ ${(result as any).message}\n\nEl plugin está ahora disponible en tu bot.`);
            } catch (error: unknown) {
                await ctx.reply(`❌ ${(error as Error).message}`);
            }
            return;
        }

        if (action === 'publish') {
            await ctx.reply(
                '📝 *Publicar Plugin*\n\n' +
                'Para publicar un plugin, proporciona:\n' +
                '1. Nombre\n2. Descripción\n3. Precio (en monedas)\n4. Código del plugin\n\n' +
                'Contacta al administrador del bot para más información.'
            );
            return;
        }

        if (action === 'my') {
            const userPlugins = await ctx.pluginMarketplace.getUserPlugins(ctx.sender);
            
            let message = '📦 *MIS PLUGINS*\n\n';
            message += `💰 Ingresos totales: ${userPlugins.totalRevenue}\n\n`;
            
            if (userPlugins.purchased.length > 0) {
                message += `✅ Comprados (${userPlugins.purchased.length}):\n`;
                userPlugins.purchased.forEach((p: any) => {
                    message += `  • ${p.name}\n`;
                });
                message += '\n';
            }

            if (userPlugins.published.length > 0) {
                message += `📝 Publicados (${userPlugins.published.length}):\n`;
                userPlugins.published.forEach((p: any) => {
                    message += `  • ${p.name} (${p.downloads} descargas)\n`;
                });
            }

            if (userPlugins.purchased.length === 0 && userPlugins.published.length === 0) {
                message += 'No tienes plugins aún.\nExplora el marketplace con #marketplace';
            }

            await ctx.reply(message);
            return;
        }

        await ctx.reply('Uso: #marketplace [browse|search|buy|publish|my]');
    }
};

export default plugin;
