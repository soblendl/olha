import type { Plugin, PluginContext } from '../src/types/plugin.js';
import { getMentions } from '../lib/utils.js';


const plugin: Plugin = {
    commands: ['giveallharem', 'giveall'],
    
    async execute(ctx: PluginContext): Promise<void> {
        const mentions = getMentions(body);
        if (mentions.length === 0) {
            await ctx.bot.sock.sendMessage(ctx.chatId, {
                text: 'ꕤ Debes mencionar al usuario.\nUso: #giveall @usuario'
            });
            return;
        }

        const target = mentions[0];
        const userData = global.db.users[ctx.sender];
        const characters = userData.gacha?.characters || [];

        if (characters.length === 0) {
            await ctx.bot.sock.sendMessage(ctx.chatId, {
                text: 'ꕤ No tienes personajes en tu harem.'
            });
            return;
        }

        if (!global.db.users[target]) {
            await ctx.bot.sock.sendMessage(ctx.chatId, {
                text: 'ꕤ Ese usuario no está registrado.'
            });
            return;
        }

        if (!global.db.users[target].gacha.characters) {
            global.db.users[target].gacha.characters = [];
        }

        const count = characters.length;
        global.db.users[target].gacha.characters.push(...characters);
        userData.gacha.characters = [];

        await ctx.bot.sock.sendMessage(ctx.chatId, {
            text: `ꕥ *Regalo Masivo*\n\n` +
                `Has regalado ${count} personajes a @${target.split('@')[0]}`,
            mentions: [target]
        });
    }
};

export default plugin;
