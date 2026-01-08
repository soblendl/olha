import type { Plugin, PluginContext } from '../src/types/plugin.js';
import { getCooldown, formatTime } from '../lib/utils.js';


const plugin: Plugin = {
    commands: ['claim', 'c'],
    
    async execute(ctx: PluginContext): Promise<void> {
        const COOLDOWN = 3 * 60 * 60 * 1000;
        const userData = ctx.userData;
        const gachaService = ctx.gachaService;
        const cooldown = getCooldown(userData.gacha.lastClaim, COOLDOWN);

        if (cooldown > 0) {
            await ctx.ctx.reply(
                `ꕤ Ya reclamaste un personaje recientemente.\nVuelve en: ${formatTime(cooldown)}`
            );
        }

        const character = gachaService.getRandom();
        
        if (!character) {
            await ctx.ctx.reply('ꕤ No hay personajes disponibles en este momento.');
            return;
        }

        userData.gacha.lastClaim = Date.now();
        
        if (!userData.gacha.characters) {
            userData.gacha.characters = [];
        }
        
        userData.gacha.characters.push({
            id: character.id,
            name: character.name,
            claimedAt: Date.now()
        });

        try {
            gachaService.claimCharacter(character.id, ctx.ctx.sender);
        } catch (error: unknown) {
            console.error('Error reclamando personaje:', (error as Error).message);
        }

        ctx.dbService.markDirty();

        const rarity = Math.floor(parseInt(character.value) / 400);
        const stars = 'ꕤ'.repeat(Math.min(rarity, 5));

        let message = `ꕥ *¡Nuevo Personaje!*\n\n`;
        message += `ꕤ ${character.name}\n`;
        message += `ꕤ ${character.source || 'Desconocido'}\n`;
        message += `${stars} Valor: ${character.value}\n`;
        message += `🆔 ID: ${character.id}\n\n`;
        message += `¡Ha sido añadido a tu harem!`;

        if (character.img && character.img.length > 0) {
            try {
                await ctx.replyWithImage(character.img[0], { caption: message });
            } catch {
                await ctx.ctx.reply(message);
            return;
            }
        } else {
            await ctx.ctx.reply(message);
            return;
        }
    }
};

export default plugin;
