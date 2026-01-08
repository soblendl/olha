import type { Plugin, PluginContext } from '../src/types/plugin.js';
import { extractMentions } from '../lib/utils.js';


const plugin: Plugin = {
    commands: ['dar'],
    
    async execute(ctx: PluginContext): Promise<void> {
        const mentions = extractMentions(ctx);
        const args = ctx.args;

        if (mentions.length === 0 || args.length < 1) {
            await ctx.reply('✘ Debes mencionar a un usuario.\n\nEjemplo:\n*#dar @usuario id123*');
            return;
        }

        let target = mentions[0];
        const characterId = args.find(arg => !arg.includes('@'));

        if (!characterId) {
            await ctx.reply('✘ Debes proporcionar el ID del personaje.\n\nEjemplo:\n*#dar @usuario id123*');
            return;
        }

        try {
            const gachaService = ctx.gachaService;
            const character = gachaService.getById(characterId);

            if (!character) {
                await ctx.reply(`✘ No se encontró ningún personaje con el ID: *${characterId}*`);
            return;
            }

            const previousOwner = character.user;
            const { character: transferredChar } = gachaService.transferCharacter(characterId, target);

            const targetUser = ctx.dbService.getUser(target);
            if (!targetUser.gacha.characters) {
                targetUser.gacha.characters = [];
            }
            targetUser.gacha.characters.push({
                id: transferredChar.id,
                name: transferredChar.name,
                claimedAt: Date.now()
            });

            ctx.dbService.markDirty();

            let confirmMessage = `✧ *${character.name}* (ID: ${character.id}) ha sido entregado a @${target.split('@')[0]} exitosamente.`;
            if (previousOwner && previousOwner !== ctx.sender) {
                confirmMessage += `\n\n⚠️ Nota: El personaje pertenecía a @${previousOwner.split('@')[0]}`;
            }

            await ctx.reply(confirmMessage, {
                mentions: [target, previousOwner].filter(Boolean)
            });
        } catch (error: unknown) {
            await ctx.reply(`✘ Error al dar el personaje: ${(error as Error).message}`);
        }
    }
};

export default plugin;
