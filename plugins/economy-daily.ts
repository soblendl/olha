import { formatNumber, getCooldown, formatTime, styleText } from '../lib/utils.js';
import type { Plugin, PluginContext } from '../src/types/plugin.js';

const plugin: Plugin = {
    commands: ['daily', 'diario'],

    async execute(ctx: PluginContext): Promise<void> {
        if (ctx.ctx.isGroup) {
            const groupData = ctx.dbService.getGroup(ctx.ctx.chatId) as { settings: { economy: boolean } };
            if (!groupData.settings.economy) {
                await ctx.ctx.reply(styleText('ꕤ El sistema de economía está desactivado en este grupo.')) as undefined;
            }
        }

        const userData = ctx.dbService.getUser(ctx.ctx.sender);
        const now = Date.now();
        const COOLDOWN = 24 * 60 * 60 * 1000;
        const lastDaily = userData.economy?.lastDaily || 0;
        const cooldown = getCooldown(lastDaily, COOLDOWN);

        if (cooldown > 0) {
            await ctx.ctx.reply(styleText(`ꕤ Ya reclamaste tu recompensa diaria.\nVuelve en: *${formatTime(cooldown)}*`)) as undefined;
        }

        const timeSinceLast = now - lastDaily;
        const streakTimeLimit = 48 * 60 * 60 * 1000;
        let streak = (userData.economy.dailyStreak || 0);

        if (timeSinceLast < streakTimeLimit && lastDaily !== 0) {
            streak += 1;
        } else {
            streak = 1;
        }

        const reward = streak * 10000;

        ctx.dbService.updateUser(ctx.ctx.sender, {
            'economy.coins': (userData.economy?.coins || 0) + reward,
            'economy.lastDaily': now,
            'economy.dailyStreak': streak
        });

        await ctx.dbService.save();

        let message = `ꕥ *RECOMPENSA DIARIA*\n\n`;
        message += `> Día » ¥${streak}\n`;
        message += `> Recompensa » *¥${formatNumber(reward)}* coins\n`;

        if (streak > 1) {
            message += `\n_¡Mantén la racha para ganar más!_`;
        } else if (lastDaily !== 0) {
            message += `\n_¡Perdiste tu racha! Vuelve mañana para continuar._`;
        }

        await ctx.ctx.reply(styleText(message));
    }
};

export default plugin;
