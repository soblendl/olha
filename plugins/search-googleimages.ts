import type { Plugin, PluginContext } from '../src/types/plugin.js';

import axios from 'axios'
import * as cheerio from 'cheerio'

class GoogleImageScraper {
    private baseUrl: string;
    private headers: Record<string, string>;
    private timeout: number;

    constructor() {
        this.baseUrl = 'https://www.google.com/search'
        this.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
        this.timeout = 15000
    }

    async search(query: string) {
        try {
            const params = new URLSearchParams({
                q: query,
                tbm: 'isch',
                safe: 'off',
                hl: 'en'
            })

            const searchUrl = `${this.baseUrl}?${params.toString()}`
            const response = await axios.get(searchUrl, {
                headers: this.headers,
                timeout: this.timeout
            })

            const html = response.data
            const $ = cheerio.load(html)
            const images: { url: string; title: string }[] = []

            $('img[data-src]').each((i: number, el: any) => {
                const src = $(el).attr('data-src')
                if (src && src.startsWith('http') && !src.includes('google.com/xjs')) {
                    images.push({
                        url: src,
                        title: $(el).attr('alt') || ''
                    })
                }
            })

            return {
                success: true,
                images: images.slice(0, 5)
            }
        } catch (error: unknown) {
            return {
                success: false,
                error: (error as Error).message
            }
        }
    }
}

const googleimageCommand = {
    name: 'googleimages',
    aliases: ['gimages', 'gimg'],
    category: 'search',
    description: 'Busca imágenes en Google',
    usage: '#googleimages [búsqueda]',
    adminOnly: false,
    groupOnly: false,
    botAdminRequired: false,

    async execute(ctx: PluginContext) {
        const { bot, msg, args } = ctx;
        const chatId = msg.key.remoteJid!
        
        try {
            if (args.length === 0) {
                await bot.sendMessage(chatId, {
                    text: '《✧》 *Uso incorrecto del comando*\n\n' +
                        '📌 Ejemplos:\n' +
                        '✿ #googleimages gato\n' +
                        '✿ #gimages paisaje montaña\n' +
                        '✿ #gimg anime'
                })
                return;
            }

            const query = args.join(' ')
            
            const scraper = new GoogleImageScraper()
            const result = await scraper.search(query)

            if (!result.success || !result.images || result.images.length === 0) {
                await bot.sendMessage(chatId, {
                    text: `《✧》 😔 No se encontraron imágenes para: *${query}*\n\n💡 Intenta con otros términos`
                })
                return;
            }

            const randomImage = result.images[Math.floor(Math.random() * result.images.length)]

            await bot.sendMessage(chatId, {
                image: { url: randomImage.url },
                caption: `《✧》 🖼️ *Resultado de búsqueda*\n\n📝 Búsqueda: *${query}*`
            }, { quoted: msg })

        } catch (error: unknown) {
            console.error('Error en googleimages:', error)
            await bot.sendMessage(chatId, {
                text: `《✧》 ❌ Error al buscar imágenes\n\n💡 Intenta de nuevo más tarde`
            })
        }
    }
}

export default googleimageCommand
