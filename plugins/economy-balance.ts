import { formatNumber, formatNumberLarge, styleText } from '../lib/utils.js';
import type { Plugin, PluginContext } from '../src/types/plugin.js';

const plugin: Plugin = {
    commands: ['balance', 'bal', 'saldo'],

    async execute(ctx: PluginContext): Promise<void> {
        const userData = ctx.dbService.getUser(ctx.sender);
        const economy = userData.economy || { coins: 0, bank: 0 };

        await ctx.reply(styleText(
            `ꕥ *Balance de Usuario*\n\n` +
            `⟡ Billetera: *¥${formatNumberLarge(economy.coins || 0)}* coins\n` +
            `⟡ Banco: *¥${formatNumberLarge(economy.bank || 0)}* coins\n` +
            `⟡ Total: *¥${formatNumberLarge((economy.coins || 0) + (economy.bank || 0))}* coins`
        ));
    }
};

export default plugin;
