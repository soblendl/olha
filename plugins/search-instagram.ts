import type { Plugin, PluginContext } from '../src/types/plugin.js';

import axios from 'axios'

const instagramSearchCommand = {
    name: 'instagramsearch',
    aliases: ['igsearch', 'insearch'],
    category: 'search',
    description: 'Busca videos en Instagram',
    usage: '#instagramsearch [texto]',
    adminOnly: false,
    groupOnly: false,
    botAdminRequired: false,

    async execute(ctx: PluginContext) {
        const { bot, msg, args } = ctx;
        const chatId = msg.key.remoteJid!
        
        if (args.length === 0) {
            await bot.sendMessage(chatId, {
                text: `《✧》 *Uso incorrecto del comando*\n\n` +
                    `Ejemplo:\n` +
                    `✿ #instagramsearch naturaleza\n` +
                    `✿ #igsearch viajes`
            });
            return;
        }

        const query = args.join(' ')
        
        await bot.sendMessage(chatId, {
            text: `_Esta función está en desarrollo_`
        })
    }
}

export default instagramSearchCommand
