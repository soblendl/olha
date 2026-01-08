import type { Plugin, PluginContext } from '../src/types/plugin.js';

import { styleText, formatNumber } from '../lib/utils.js';

const activeTrivia = new Map();

const triviaQuestions = [
    {
        pregunta: "¿Cuál es el planeta más grande del sistema solar?",
        opciones: ["Júpiter", "Saturno", "Tierra", "Marte"],
        respuesta: "jupiter"
    },
    {
        pregunta: "¿Quién pintó la Mona Lisa?",
        opciones: ["Leonardo da Vinci", "Pablo Picasso", "Vincent van Gogh", "Miguel Ángel"],
        respuesta: "leonardo"
    },
    {
        pregunta: "¿Cuál es el elemento químico con símbolo O?",
        opciones: ["Oxígeno", "Oro", "Osmio", "Oganesón"],
        respuesta: "oxigeno"
    },
    {
        pregunta: "¿En qué año llegó el hombre a la luna?",
        opciones: ["1969", "1970", "1965", "1972"],
        respuesta: "1969"
    },
    {
        pregunta: "¿Cuál es el río más largo del mundo?",
        opciones: ["Amazonas", "Nilo", "Yangtsé", "Misisipi"],
        respuesta: "amazonas"
    }
];

const plugin: Plugin = {
    commands: ['trivia', 'quiz'],

    async execute(ctx: PluginContext): Promise<void> {

        const { chatId, sender, reply, dbService, args } = ctx;

        // Verificar si ya hay una trivia activa
        if (activeTrivia.has(chatId)) {
            const trivia = activeTrivia.get(chatId);
            const respuesta = args.join(' ').toLowerCase().trim();

            if (!respuesta) {
                await reply(styleText(
                    `ꕤ *Ya hay una trivia activa*\n\n` +
                    `> Responde con: */trivia* <tu respuesta>`
                ));
                return;
            }

            // Verificar respuesta
            const esCorrecta = trivia.respuestas.some((r: string) =>
                respuesta.includes(r.toLowerCase())
            );

            if (esCorrecta) {
                const reward = Math.floor(Math.random() * 1001) + 1000; // 1000-2000
                const userData = dbService.getUser(sender);

                dbService.updateUser(sender, {
                    'economy.coins': (userData.economy?.coins || 0) + reward
                });

                activeTrivia.delete(chatId);

                await reply(styleText(
                    `ꕥ *¡CORRECTO!*\n\n` +
                    `> Respuesta » *${trivia.respuestaOriginal}*\n` +
                    `> Ganaste »  *¥${formatNumber(reward)}* coins\n\n` +
                    `_¡Usa /trivia para otra pregunta!_`
                ));
            } else {
                await reply(styleText(
                    `ꕤ *Incorrecto*\n\n` +
                    `> Sigue intentando o espera a que expire.`
                ));
            }
            return;
        }

        // Crear nueva trivia
        const preguntaData = triviaQuestions[Math.floor(Math.random() * triviaQuestions.length)];

        // Mezclar opciones
        const opcionesMezcladas = [...preguntaData.opciones].sort(() => Math.random() - 0.5);

        activeTrivia.set(chatId, {
            respuestas: [preguntaData.respuesta, preguntaData.opciones.find(o => o.toLowerCase().includes(preguntaData.respuesta))].filter(Boolean),
            respuestaOriginal: preguntaData.opciones.find(o => o.toLowerCase().includes(preguntaData.respuesta)) || preguntaData.respuesta,
            timestamp: Date.now()
        });

        // Auto-eliminar después de 60 segundos
        setTimeout(() => {
            if (activeTrivia.has(chatId)) {
                activeTrivia.delete(chatId);
            }
        }, 60000);

        const letras = ['A', 'B', 'C', 'D'];
        let opcionesTexto = opcionesMezcladas.map((op: any, i: number) => `> ${letras[i]}. ${op}`).join('\n');

        await reply(styleText(
            `🧠 *TRIVIA*\n\n` +
            `❓ *${preguntaData.pregunta}*\n\n` +
            `${opcionesTexto}\n\n` +
            `💰 Premio: *¥1,000 - ¥2,000* coins\n` +
            `⏱️ Tienes 60 segundos\n\n` +
            `_Responde con: /trivia <respuesta>_`
        ));
    }
};

export default plugin;
