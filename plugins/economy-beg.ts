import type { Plugin, PluginContext } from '../src/types/plugin.js';

import { formatNumber, getCooldown, formatTime, getRandom, styleText } from '../lib/utils.js';

const plugin: Plugin = {
    commands: ['beg', 'pedir', 'mendigar', 'limosna'],

    async execute(ctx: PluginContext): Promise<void> {

        if (ctx.ctx.isGroup && !ctx.dbService.getGroup(ctx.ctx.chatId).settings.economy) {
            await ctx.ctx.reply(styleText('ꕤ El sistema de economía está desactivado en este grupo.'));
        }

        const COOLDOWN = 45 * 1000;
        const BASE_REWARD = Math.floor(Math.random() * 800) + 200;
        const userData = ctx.userData;

        if (!userData.economy.lastBeg) userData.economy.lastBeg = 0;

        const cooldown = getCooldown(userData.economy.lastBeg, COOLDOWN);
        if (cooldown > 0) {
            await ctx.ctx.reply(styleText(
                `ꕤ Ya pediste dinero hace poco.\nVuelve en: ${formatTime(cooldown)}`
            ));
        }

        ctx.dbService.updateUser(ctx.ctx.sender, { 'economy.lastBeg': Date.now() });

        const success = Math.random() > 0.25;

        if (success) {
            const result = getRandom(BEG_SUCCESS);
            const reward = Math.floor(BASE_REWARD * result.multi);

            ctx.dbService.updateUser(ctx.ctx.sender, {
                'economy.coins': userData.economy.coins + reward
            });
            await ctx.dbService.save();

            await ctx.ctx.reply(styleText(
                `${result.emoji} ${result.text} *¥${formatNumber(reward)}* coins!\n` +
                `💰 Balance: ¥${formatNumber(userData.economy.coins + reward)}`
            ));
        } else {
            const result = getRandom(BEG_FAIL);
            await ctx.ctx.reply(styleText(`${result.emoji} ${result.text}`));
        }
    }
};

export default plugin;
