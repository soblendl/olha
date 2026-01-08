import type { Plugin, PluginContext } from '../src/types/plugin.js';

import { formatTime, getCooldown, styleText } from '../lib/utils.js';

const plugin: Plugin = {
    commands: ['wcow', 'waifu-cooldown'],

    async execute(ctx: PluginContext): Promise<void> {

        const userData = ctx.userData;
        const gachaService = ctx.gachaService;

        // Cooldowns
        const ROLL_COOLDOWN = 10 * 60 * 1000; // 10 minutos para rw
        const CLAIM_COOLDOWN = 30 * 60 * 1000; // Sin cooldown para claim

        const lastRoll = userData.gacha?.lastRoll || 0;
        const rollCooldown = getCooldown(lastRoll, ROLL_COOLDOWN);

        let message = `ꕥ *INFORMACIÓN DE WAIFUS*\n\n`;
        message += `━━━━━━━━━━━━━━━━━━━\n`;
        message += `✦ *ROLL WAIFU (RW)*\n`;

        if (rollCooldown > 0) {
        message += `✦ Cooldown activo\n`;
        message += `> Tiempo restante » *${formatTime(rollCooldown)}*\n`;
        } else {
        message += `✦ Disponible para usar\n`;
        }

        message += `\n━━━━━━━━━━━━━━━━━━━\n`;
        message += `✦ *CLAIM*\n`;
        message += `✦ Disponible (sin cooldown)\n\n`;

        // Mostrar waifus actuales
        const userWaifus = gachaService.getUserCharacters(ctx.sender);
        message += `━━━━━━━━━━━━━━━━━━━\n`;
        message += `✦ *TUS WAIFUS*\n`;
        message += `> Total » ${userWaifus.length}\n\n`;

        if (userWaifus.length > 0) {
        message += `_Tus 5 últimas waifus:_\n`;
        userWaifus.slice(-5).forEach((w: any, i: number) => {
        message += `${i + 1}. ${w.name} (${w.source || 'Desconocido'})\n`;
        });
        } else {
        message += `_No tienes waifus aún_`;
        }

        await ctx.reply(styleText(message));
    }
};

export default plugin;
