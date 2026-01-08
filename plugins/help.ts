import fs from 'fs';
import type { Plugin, PluginContext } from '../src/types/plugin.js';

const plugin: Plugin = {
    commands: ['help', 'menu'],

    async execute(ctx: PluginContext): Promise<void> {
        const senderNumber = ctx.sender.split('@')[0];
        const username = ctx.from?.name || senderNumber;

        // Detect if it's a prembot and load custom config
        const tokenService = ctx.tokenService;
        const userId = ctx.senderPhone ? `${ctx.senderPhone}@s.whatsapp.net` : ctx.sender;
        const prembotConfig = tokenService?.getPrembotConfig?.(userId) as { customName?: string; customImage?: string } | null;
        const botName = prembotConfig?.customName || 'Hatsune Miku';

        let menuImage = './images/menu.jpg';
        if (prembotConfig?.customImage && fs.existsSync(prembotConfig.customImage)) {
            menuImage = prembotConfig.customImage;
        }

        const userCount = ctx.dbService?.getUserCount?.() || 0;

        const helpText = `╭─────── ୨୧ ───────╮
│  Bot Name › *${botName}*
│  Hola, *${username}*
│  ¿Listo para empezar?
╰─── ⚐ DeltaByte ─────╯
│ ✦ Canal    › whatsapp.com/channel/0029VbB9SA10rGiQvM2DMi2p
│ ✦ Usuarios › *${userCount}*
│ ✦ v3.0     › Usuario: ${username}
╰────────────────╯

 ⊹ *Economía⊹ ࣪ ˖*
✎ \`G𝖺𝗇𝖺 𝗆𝗈𝗇𝖾𝖽𝖺𝗌, 𝖺𝗉𝗎𝖾𝗌𝗍𝖺 𝗒 𝗃𝗎é𝗀𝖺𝗍𝖾𝗅𝖺\`
✿ *::* *#economy* \`<on/off>\`
> » Desactiva o activa el sistema de economía.
✿ *::* *#balance* • *#bal*
> » Ver tus coins.
✿ *::* *#coinflip* • *#cf* \`<cantidad>\` \`<cara/cruz>\`
> » Apuesta cara o cruz.
✿ *::* *#crime*
> » Haz un robo y gana dinero.
✿ *::* *#daily*
> » Reclama tu recompensa diaria.
✿ *::* *#deposit* • *#d* \`<cantidad>\`
> » Guarda tus coins.
✿ *::* *#economyboard* • *#baltop*
> » Mira el top de usuarios con más monedas.
✿ *::* *#givecoins* • *#pay* \`<@user>\`
> » Regala coins a un usuario.
✿ *::* *#roulette* • *#rt* \`<red/black>\` \`<cantidad>\`
> » Gira la ruleta y gana coins.
✿ *::* *#slut*
> » Trabaja dudosamente para ganar coins.
✿ *::* *#steal* \`<@user>\`
> » Roba coins a un usuario.
✿ *::* *#slot* \`<cantidad>\`
> » Apuesta en la tragaperras (x5 Jackpot).
✿ *::* *#withdraw* • *#wd* \`<cantidad|all>\`
> » Retira una cantidad de coins.
✿ *::* *#work* • *#w*
> » Trabaja y gana coins.
✿ *::* *#beg* • *#pedir*
> » Pide dinero en la calle.
✿ *::* *#fish* • *#pescar*
> » Pesca y gana coins (sistema de rarezas).
✿ *::* *#einfo* \`<@user>\`
> » Mira las estadísticas de economía de alguien.
✿ *::* *#season*
> » Mira la temporada actual del pase de batalla.
✿ *::* *#shop* • *#tienda* \`<pag>\`
> » Abre la tienda de Soblend.
✿ *::* *#buy* • *#comprar* \`<id> <ant>\`
> » Compra objetos de la tienda.
✿ *::* *#inventory* • *#inv*
> » Mira tus objetos comprados.
✿ *::* *#use* • *#usar* \`<id>\`
> » Usa un objeto de tu inventario.
✿ *::* *#level* • *#rank*
> » Mira tu nivel y XP actual.
✿ *::* *#blackjack* • *#bj* \`<apuesta>\`
> » Juega al 21 contra la casa.
*⊱⋅ ────── ⊹ ────── ⋅⊰*

 ⊹ *Gacha⊹ ࣪ ˖*
✎ \`C𝗈𝗅𝖾𝖼𝖼𝗂𝗈𝗇𝖺 𝗐𝖺𝗂𝖿𝗎𝗌 𝖾 𝗂𝗇𝗍𝖾𝗋𝖼𝖺𝗆𝖻𝗂𝖺𝗅𝗈𝗌\`
✿ *::* *#claim* • *#c*
> » Reclama una waifu aleatoria.
✿ *::* *#harem* • *#miswaifu*
> » Mira las waifus que tienes.
*⊱⋅ ────── ⊹ ────── ⋅⊰*

 ⊹ *Descargas⊹ ࣪ ˖*
✎ \`D𝖾𝗌𝖼𝖺𝗋𝗀𝖺 𝖼𝗈𝗇𝗍𝖾𝗇𝗂𝖽𝗈 𝖽𝖾 𝗉𝗅𝖺𝗍𝖺𝖿𝗈𝗋𝗆𝖺𝗌\`
✿ *::* *#ig* \`<link>\`
> » Descarga un video de Instagram.
✿ *::* *#tiktok* \`<link>\`
> » Descarga un video de TikTok.
✿ *::* *#play* \`<query/url>\`
> » Descarga música o video de YouTube.
*⊱⋅ ────── ⊹ ────── ⋅⊰*

 ⊹ *Administración⊹ ࣪ ˖*
✎ \`A𝖽𝗆𝗂𝗇𝗂𝗌𝗍𝗋𝖺 𝗍𝗎 𝗀𝗋𝗎𝗉𝗈 𝗒/𝗈 𝖼𝗈𝗆𝗎𝗇𝗂𝖽𝖺𝖽\`
⟡ *::* *#kick* \`<@user>\`
> » Expulsa a alguien del grupo.
✿ *::* *#ban* \`<@user>\`
> » Banea a alguien del grupo.
✿ *::* *#antilink* \`<on/off>\`
> » Activa el antilink (elimina enlaces de todos).
✿ *::* *#welcome* \`<on/off>\`
> » Activa/desactiva mensajes de bienvenida.
✿ *::* *#goodbye* \`<on/off>\`
> » Activa/desactiva mensajes de despedida.
*⊱⋅ ────── ⊹ ────── ⋅⊰*

> Usa *#help* para ver la lista completa de comandos.`;

        try {
            try {
                await ctx.bot.sendMessage(ctx.chatId, {
                    text: helpText,
                    contextInfo: {
                        externalAdReply: {
                            title: "Hatsune Miku",
                            body: "Developed By Soblend Development Studio",
                            thumbnail: "https://files.catbox.moe/o6v8ne.jpg",
                            mediaType: 1,
                            sourceUrl: "https://bright-light.pages.dev",
                            renderLargerThumbnail: true
                        }
                    }
                });
            } catch (error: unknown) {
                console.error('[DEBUG] Error sending help with metadata:', error);
                ctx.reply(helpText);
            }
        } catch (error: unknown) {
            console.error('[DEBUG] Error sending help with metadata:', error);
            ctx.reply(helpText);
        }
    }
};

export default plugin;
