import type { Plugin, PluginContext } from '../src/types/plugin.js';

import wiki from 'wikijs'

const fandomCommand = {
    name: 'fandom',
    aliases: ['wikif'],
    category: 'search',
    description: 'Busca información en Fandom.com',
    usage: '#fandom [término]',
    adminOnly: false,
    groupOnly: false,
    botAdminRequired: false,

    async execute(ctx: PluginContext) {
        const { bot, msg, args } = ctx;
        const chatId = msg.key.remoteJid!;
        
        if (args.length === 0) {
            await bot.sendMessage(chatId, {
                text: `《✧》 *Uso incorrecto del comando*\n\n` +
                    `*Ejemplos:*\n` +
                    `✿ #fandom Naruto\n` +
                    `✿ #wikif Minecraft\n` +
                    `✿ #fandom League of Legends`
            });
            return;
        }

        const query = args.join(' ')
        
        try {
            const page = await wiki({ apiUrl: 'https://community.fandom.com/api.php' }).page(query)
            const summary = await page.summary()
            const images = await page.images()
            
            const image = images.find((img: string) => img.endsWith('.jpg') || img.endsWith('.png') || img.endsWith('.jpeg'))
            
            const extract = summary.length > 1500 ? summary.slice(0, 1500) + '...' : summary
            
            const caption = `《✧》 *Fandom Wiki*\n\n` +
                `📚 *Título:* ${(page as any).raw.title}\n\n` +
                `${extract}\n\n` +
                `─────────────────\n` +
                `_Información de Fandom_`

            if (image) {
                await bot.sendMessage(chatId, {
                    image: { url: image },
                    caption: caption
                })
            } else {
                await bot.sendMessage(chatId, {
                    text: caption
                })
            }
            
        } catch (error: unknown) {
            console.error('Error en comando fandom:', error)
            await bot.sendMessage(chatId, { 
                text: `《✧》 No se encontró información para: "${query}"\n\n` +
                    `💡 *Tip:* Intenta con términos en inglés o verifica la ortografía.`
            })
        }
    }
}

export default fandomCommand
