import type { Plugin, PluginContext } from '../src/types/plugin.js';


const plugin: Plugin = {
    commands: ['tiktok', 'ttk', 'tt'],
    
    async execute(ctx: PluginContext): Promise<void> {
        const { bot, chatId, args, msg } = ctx;
        const sock = bot.sock;
        
        const links = (msg as any).message?.conversation?.match(/https?:\/\/(www|vt|vm|t)?\.?tiktok\.com\/\S+/g) || 
                      (msg as any).message?.extendedTextMessage?.text?.match(/https?:\/\/(www|vt|vm|t)?\.?tiktok\.com\/\S+/g) || 
                      args.filter(arg => /https?:\/\/(www|vt|vm|t)?\.?tiktok\.com\/\S+/.test(arg));
        
        if (!links || links.length === 0) {
            await sock.sendMessage(chatId, {
                text: `《✧》 *Uso incorrecto del comando*\n\n` +
                    `*Ejemplos:*\n` +
                    `✿ #tiktok https://www.tiktok.com/@user/video/xxx`
            });
            return;
        }

        for (const link of links) {
            try {
                const response = await fetch(`https://www.tikwm.com/api?url=${link}`);
                const result = await response.json() as { data: any };
                const data = result.data;

                if (!data || (!data.play && !data.images?.length)) {
                    await sock.sendMessage(chatId, {
                        text: `ꕤ No se pudo obtener información del enlace '${link}'`
                    });
                    continue;
                }

                if (data.images?.length) {
                    // Es un carrusel de imágenes
                    for (let index = 0; index < data.images.length; index++) {
                        const imageUrl = data.images[index];
                        const caption = index === 0 ? 
                            `ꕥ *TikTok Download*\n\n✿ *Título:* ${data.title || 'Sin título'}\n\n_Powered By DeltaByte_` : 
                            null;
                        
                        await sock.sendMessage(chatId, {
                            image: { url: imageUrl },
                            caption: caption || undefined
                        });
                    }
                } else if (data.play) {
                    // Es un video
                    const caption = `ꕥ *TikTok Download*\n\n` +
                        `✿ *Título:* ${data.title || 'Sin título'}\n\n` +
                        `_Powered By DeltaByte_`;

                    await sock.sendMessage(chatId, {
                        video: { url: data.play },
                        caption: caption,
                        mimetype: 'video/mp4'
                    });
                }

            } catch (error: unknown) {
                console.error('Error procesando enlace de TikTok:', error);
                await sock.sendMessage(chatId, {
                    text: `ꕤ Error al procesar el enlace: ${link}\n\n> *Tip:* Asegúrate de que el video sea público.`
                });
            }
        }
    }
};

export default plugin;