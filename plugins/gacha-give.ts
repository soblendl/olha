import type { Plugin, PluginContext } from '../src/types/plugin.js';
import { extractMentions } from '../lib/utils.js';


const plugin: Plugin = {
    commands: ['regalar', 'give'],
    
    async execute(ctx: PluginContext): Promise<void> {
        const mentions = extractMentions(ctx);
        const args = ctx.args;

        if (mentions.length === 0 || args.length < 1) {
            await ctx.reply('ꕤ Uso: #give <id_personaje> @usuario\no\n#give @usuario <id_personaje>');
            return;
        }

        const target = mentions[0];
        const characterId = args.find(arg => !arg.includes('@'));

        if (!characterId) {
            await ctx.reply('ꕤ Debes proporcionar el ID del personaje.');
            return;
        }

        const gachaService = ctx.gachaService;
        const character = gachaService.getById(characterId);

        if (!character) {
            await ctx.reply(`ꕤ No se encontró ningún personaje con el ID: *${characterId}*`);
            return;
        }

        if (character.user !== ctx.sender) {
            await ctx.reply('ꕤ Este personaje no te pertenece.');
            return;
        }

        const targetUser = ctx.dbService.getUser(target);

        try {
            const { character: transferredChar, previousOwner } = gachaService.transferCharacter(characterId, target);

            if (!targetUser.gacha.characters) {
                targetUser.gacha.characters = [];
            }
            targetUser.gacha.characters.push({
                id: transferredChar.id,
                name: transferredChar.name,
                claimedAt: Date.now()
            });

            const userData = ctx.userData;
            const charIndex = userData.gacha.characters.findIndex(c => c.id === characterId);
            if (charIndex !== -1) {
                userData.gacha.characters.splice(charIndex, 1);
            }

            ctx.dbService.markDirty();

            await ctx.reply(
                `ꕥ *Regalo Enviado*\n\n` +
                `Has regalado a *${transferredChar.name}* (ID: ${transferredChar.id}) a @${target.split('@')[0]}`,
                { mentions: [target] }
            );
        } catch (error: unknown) {
            await ctx.reply(`ꕤ Error: ${(error as Error).message}`);
        }
    }
};

export default plugin;
