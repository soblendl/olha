import type { Plugin, PluginContext } from '../src/types/plugin.js';

const plugin: Plugin = {
    commands: ['delwaifu', 'delchar'],
    
    async execute(ctx: PluginContext): Promise<void> {
        if (ctx.args.length === 0) {
            await ctx.bot.sock.sendMessage(ctx.chatId, {
                text: 'ꕤ Debes especificar el nombre del personaje.\nUso: #delwaifu <personaje>'
            });
            return;
        }

        const charName = ctx.args.join(' ');
        const userData = global.db.users[ctx.sender];
        const characters = userData.gacha?.characters || [];

        const charIndex = characters.findIndex(c => 
            c.name.toLowerCase() === charName.toLowerCase()
        );

        if (charIndex === -1) {
            await ctx.bot.sock.sendMessage(ctx.chatId, {
                text: 'ꕤ No tienes ese personaje en tu harem.'
            });
            return;
        }

        const character = characters[charIndex];
        characters.splice(charIndex, 1);

        await ctx.bot.sock.sendMessage(ctx.chatId, {
            text: `ꕥ Has eliminado a ${character.name} de tu harem.`
        });
            return;
    }
};

export default plugin;
