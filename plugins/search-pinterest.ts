import type { Plugin, PluginContext } from '../src/types/plugin.js';

import axios from 'axios'
import * as baileys from '@whiskeysockets/baileys'

const pinterestCommand = {
    name: 'pinterest',
    aliases: ['pin', 'pinsearch'],
    category: 'search',
    description: 'Busca y descarga imágenes de Pinterest',
    usage: '#pinterest [texto de búsqueda]',
    adminOnly: false,
    groupOnly: false,
    botAdminRequired: false,
    
    async execute(ctx: PluginContext) {
        const { bot: sock, msg, args } = ctx;
        const chatId = msg.key.remoteJid!
        const dev = 'DeltaByte'
        
        try {
            if (args.length === 0) {
                await sock.sendMessage(chatId, {
                    text: `《✧》 *Uso incorrecto del comando*\n\n` +
                        `Ejemplo:\n` +
                        `✿ #pinterest gatos\n` +
                        `✿ #pin aesthetic wallpaper\n` +
                        `✿ #pin naturaleza`
                });
                return;
            }
            
            const searchQuery = args.join(' ')
            
            const apiUrl = `https://pinscrapper.vercel.app/api/pinterest/search?q=${encodeURIComponent(searchQuery)}&limit=7`
            const response = await axios.get(apiUrl, {
                timeout: 20000
            })
            
            const data = response.data
            if (!data.success || !data.images || data.images.length === 0) {
                await sock.sendMessage(chatId, {
                    text: '《✧》 No se encontraron imágenes para tu búsqueda.\n\n' +
                        '💡 *Tip:* Intenta con otras palabras clave.'
                });
                return;
            }
            
            const images = data.images
            
            const cards = []
            for (let image of images) {
                try {
                    const imageMsg = await sock.sendMessage((sock as any).user?.id || '', {
                        image: { url: image.imageUrl }
                    }) as any 
                    
                    if (imageMsg?.message?.imageMessage) {
                        const card = {
                            body: baileys.proto.Message.InteractiveMessage.Body.fromObject({
                                text: `✿ ${image.description || 'Sin descripción'}`
                            }),
                            footer: baileys.proto.Message.InteractiveMessage.Footer.fromObject({
                                text: dev
                            }),
                            header: baileys.proto.Message.InteractiveMessage.Header.fromObject({
                                title: image.title || 'Pinterest',
                                hasMediaAttachment: true,
                                imageMessage: imageMsg.message.imageMessage
                            }),
                            nativeFlowMessage: baileys.proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
                                buttons: []
                            })
                        }
                        cards.push(card)
                    }
                } catch (cardError: unknown) {
                    console.error('Error creando tarjeta:', (cardError as Error).message)
                }
            }
            
            if (cards.length === 0) {
                await sock.sendMessage(chatId, {
                    text: "《✧》 No se pudieron procesar las imágenes encontradas."
                }, { quoted: msg })
                return;
            }
            
            try {
                const carouselMessage = baileys.generateWAMessageFromContent(chatId, {
                    viewOnceMessage: {
                        message: {
                            messageContextInfo: {
                                deviceListMetadata: {},
                                deviceListMetadataVersion: 2
                            },
                            interactiveMessage: baileys.proto.Message.InteractiveMessage.fromObject({
                                body: baileys.proto.Message.InteractiveMessage.Body.create({
                                    text: `📌 RESULTADOS DE: ${searchQuery}`
                                }),
                                footer: baileys.proto.Message.InteractiveMessage.Footer.create({
                                    text: dev
                                }),
                                header: baileys.proto.Message.InteractiveMessage.Header.create({
                                    hasMediaAttachment: false
                                }),
                                carouselMessage: baileys.proto.Message.InteractiveMessage.CarouselMessage.fromObject({
                                    cards: cards
                                })
                            })
                        }
                    }
                }, {
                    quoted: msg as any,
                    userJid: (sock as any).user?.id || ''
                })

                await sock.relayMessage(chatId, (carouselMessage as any).message, {
                    messageId: carouselMessage.key.id!
                })
            } catch (carouselError: unknown) {
                console.error('Error enviando carousel:', carouselError)
                for (let i = 0; i < images.length; i++) {
                    const image = images[i]
                    try {
                        const caption = `《✧》 *Pinterest* 📌\n\n` +
                            `✿ *Título:* ${image.title || 'Sin título'}\n` +
                            `✿ *Descripción:* ${image.description || 'Sin descripción'}\n\n` +
                            `_Imagen ${i + 1} de ${images.length}_`
                        
                        await sock.sendMessage(chatId, {
                            image: { url: image.imageUrl },
                            caption: caption
                        }, { quoted: msg })
                        
                        if (i < images.length - 1) {
                            await new Promise(resolve => setTimeout(resolve, 1500))
                        }
                    } catch (sendError: unknown) {
                        console.error(`Error enviando imagen ${i + 1}:`, sendError)
                    }
                }
            }
        } catch (error: unknown) {
            console.error('Error en comando pinterest:', error)
            await sock.sendMessage(chatId, {
                text: `《✧》 Error al buscar imágenes en Pinterest.\n\n💡 *Tip:* Verifica tu conexión e intenta con términos más específicos.`
            })
        }
    }
}

export default pinterestCommand
