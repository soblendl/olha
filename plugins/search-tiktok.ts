import type { Plugin, PluginContext } from '../src/types/plugin.js';

import axios from 'axios'
import * as baileys from '@whiskeysockets/baileys'

const tiktokSearchCommand = {
    name: 'tiktoksearch',
    aliases: ['tts', 'tiktoks'],
    category: 'search',
    description: 'Busca videos en TikTok',
    usage: '#tiktoksearch <texto>',
    adminOnly: false,
    groupOnly: false,
    botAdminRequired: false,

    async execute(ctx: PluginContext) {
        const { bot: sock, msg, args } = ctx;
        const chatId = msg.key.remoteJid!
        const dev = 'DeltaByte'
        
        if (args.length === 0) {
            await sock.sendMessage(chatId, {
                text: "《✧》 Por favor, ingrese un texto para buscar en TikTok.\n\n" +
                    "Ejemplo: #tiktoksearch gatos graciosos"
            }, { quoted: msg })
            return;
        }
        
        const text = args.join(' ')
        
        function shuffleArray(array: any[]) {
            for (let i = array.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [array[i], array[j]] = [array[j], array[i]]
            }
        }
        
        try {
            let { data } = await axios.get(
                `https://apis-starlights-team.koyeb.app/starlight/tiktoksearch?text=${encodeURIComponent(text)}`
            )
            
            if (!data || !data.data || data.data.length === 0) {
                await sock.sendMessage(chatId, {
                    text: "《✧》 No se encontraron resultados para: " + text
                }, { quoted: msg })
                return;
            }
            
            let searchResults = data.data
            shuffleArray(searchResults)
            let topResults = searchResults.splice(0, 7)
            
            const cards = []
            for (let result of topResults) {
                try {
                    const videoMsg = await sock.sendMessage((sock as any).user?.id || '', {
                        video: { url: result.nowm }
                    }) as any // Cast to any to access message
                    
                    if (videoMsg?.message?.videoMessage) {
                        const card = {
                            body: baileys.proto.Message.InteractiveMessage.Body.fromObject({ 
                                text: null 
                            }),
                            footer: baileys.proto.Message.InteractiveMessage.Footer.fromObject({ 
                                text: dev 
                            }),
                            header: baileys.proto.Message.InteractiveMessage.Header.fromObject({
                                title: result.title || 'Video de TikTok',
                                hasMediaAttachment: true,
                                videoMessage: videoMsg.message.videoMessage
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
                    text: "《✧》 No se pudieron procesar los videos encontrados."
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
                                    text: "📱 RESULTADO DE: " + text
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
                for (let i = 0; i < topResults.length; i++) {
                    const result = topResults[i]
                    try {
                        await sock.sendMessage(chatId, {
                            video: { url: result.nowm },
                            caption: `📹 *Video ${i + 1}/${topResults.length}*\n\n📝 ${result.title}\n\n${dev}`
                        }, { quoted: msg })
                        await new Promise(resolve => setTimeout(resolve, 1000))
                    } catch (e: unknown) {
                        console.error(`Error enviando video ${i + 1}:`, (e as Error).message)
                    }
                }
            }
        } catch (error: unknown) {
            console.error('Error en tiktoksearch:', error)
            await sock.sendMessage(chatId, {
                text: `《✧》 *OCURRIÓ UN ERROR:* ${(error as Error).message}`
            }, { quoted: msg })
        }
    }
}

export default tiktokSearchCommand
