import type { Plugin, PluginContext } from '../src/types/plugin.js';
import { styleText, formatNumber } from '../lib/utils.js';

const activeRiddle = new Map<string, { respuesta: string; pista: string; timestamp: number }>();

const adivinanzas = [
    { pregunta: "Blanco por dentro, verde por fuera. Si quieres que te lo diga, espera.", respuesta: "pera", pista: "Es una fruta" },
    { pregunta: "Oro parece, plata no es.", respuesta: "platano", pista: "Es una fruta amarilla" },
    { pregunta: "Tiene agujas y no sabe coser, tiene números y no sabe leer.", respuesta: "reloj", pista: "Sirve para medir el tiempo" },
    { pregunta: "Blanco por dentro, amarillo por fuera, si quieres que te lo diga, espera.", respuesta: "huevo", pista: "Lo comes en el desayuno" },
    { pregunta: "Pequeño como un ratón, cuida la casa como un león.", respuesta: "gato", pista: "Animal doméstico" },
    { pregunta: "Camina sin pies, corre sin piernas, tiene corazón y no lo siente.", respuesta: "río", pista: "Fluye por la montaña" },
    { pregunta: "Cuanto más le quitas, más grande es.", respuesta: "agujero", pista: "Está en la pared o en la ropa" },
    { pregunta: "Tiene dientes y no come, tiene cabeza y no piensa.", respuesta: "ajo", pista: "Se usa para cocinar" },
    { pregunta: "No tiene boca, pero cuenta una historia.", respuesta: "libro", pista: "Lo lees" },
    { pregunta: "Tiene ojos y no ve, tiene agua y no la bebe.", respuesta: "papa", pista: "Se frie o se cuece" },
    { pregunta: "Es redondo y se parte con un cuchillo, pero no es una manzana.", respuesta: "naranja", pista: "Fruta cítrica" },
    { pregunta: "Tiene escamas y no es pez, tiene corona y no es rey.", respuesta: "piña", pista: "Fruta tropical" },
    { pregunta: "Es blanco como la nieve y se derrite con el calor.", respuesta: "hielo", pista: "Lo usas para enfriar" },
    { pregunta: "Tiene ruedas y no es coche, lleva paquetes y no es cartero.", respuesta: "carretilla", pista: "Se usa en la construcción" },
    { pregunta: "Es chiquito y da mucha luz, se come en la noche y no es bombilla.", respuesta: "fuego", pista: "Se usa para calentar" },
    { pregunta: "Tiene orejas y no oye, tiene cola y no es perro.", respuesta: "rabo", pista: "Parte del animal" },
    { pregunta: "Es blanco y se rompe sin manos.", respuesta: "huevo", pista: "Viene de la gallina" },
    { pregunta: "Tiene llaves y no abre, tiene notas y no estudia.", respuesta: "piano", pista: "Instrumento musical" },
    { pregunta: "Es negro cuando está limpio y blanco cuando está sucio.", respuesta: "pizarra", pista: "Está en las aulas" },
    { pregunta: "Tiene patas y no camina, tiene espalda y no se sienta.", respuesta: "silla", pista: "Lo usas para sentarte" },
    { pregunta: "Es chico y tiene cabeza, sin tener cuerpo.", respuesta: "ajo", pista: "Se pela antes de usar" },
    { pregunta: "Tiene caballo y no cabalga, tiene rey y no gobierna.", respuesta: "ajedrez", pista: "Juego de mesa" },
    { pregunta: "Es redondo y tiene agujero, pero no es dona.", respuesta: "aro", pista: "Se usa en el deporte" },
    { pregunta: "Tiene agua y no se moja, tiene sol y no quema.", respuesta: "mar", pita: "Es muy grande" },
    { pregunta: "Es chiquito y tiene bigotes, caza ratones y no es hombre.", respuesta: "gato", pista: "Animal felino" },
    { pregunta: "Tiene ojos y no llora, tiene cabeza y no piensa.", respuesta: "patata", pista: "Se cocina de muchas formas" },
    { pregunta: "Es verde y se pone rojo cuando está maduro.", respuesta: "tomate", pista: "Fruta que se usa como verdura" },
    { pregunta: "Tiene alas y no vuela, tiene reloj y no da la hora.", respuesta: "pollo", pista: "Ave de corral" },
    { pregunta: "Es blanco y se parte, tiene yema y clara.", respuesta: "huevo", pista: "Lo rompes para comer" },
    { pregunta: "Es largo y amarillo, se pela y se come.", respuesta: "plátano", pista: "Fruta tropical" },
    { pregunta: "Tiene dientes y no muerde, tiene boca y no habla.", respuesta: "cebolla", pista: "Hace llorar al pelar" },
    { pregunta: "Es redondo y dorado, se parte y tiene relleno.", respuesta: "empanada", pista: "Comida típica" },
    { pregunta: "Tiene cabeza y no piensa, tiene brazos y no abraza.", respuesta: "camisa", pista: "Ropa" },
    { pregunta: "Es chico y negro, se usa para escribir.", respuesta: "lápiz", pista: "Utensilio escolar" },
    { pregunta: "Tiene ojos y no ve, tiene agua y no la bebe.", respuesta: "papa", pista: "Se hace puré" },
    { pregunta: "Es blanco y se derrite, se usa para enfriar.", respuesta: "hielo", pista: "Viene del agua" },
    { pregunta: "Tiene ruedas y no es coche, lleva carga y no es camión.", respuesta: "carretilla", pista: "Se empuja" },
    { pregunta: "Es chiquito y da luz, se enciende y se apaga.", respuesta: "vela", pista: "Se usa en cumpleaños" },
    { pregunta: "Tiene cabeza y no piensa, tiene espalda y no se sienta.", respuesta: "silla", pista: "Mueble" },
    { pregunta: "Es negro y se usa para borrar.", respuesta: "borrador", pista: "Utensilio escolar" },
    { pregunta: "Tiene llaves y no abre, tiene música y no canta.", respuesta: "piano", pista: "Instrumento de cuerdas" },
    { pregunta: "Es blanco y se rompe, tiene cáscara.", respuesta: "huevo", pista: "Viene del gallinero" },
    { pregunta: "Tiene patas y no camina, tiene mesa y no come.", respuesta: "mesa", pista: "Mueble" },
    { pregunta: "Es chico y negro, se usa para escribir.", respuesta: "bolígrafo", pista: "Escribes con él" },
    { pregunta: "Tiene ojos y no ve, tiene agua y no la bebe.", respuesta: "papa", pista: "Se fríe" },
    { pregunta: "Es redondo y se parte, tiene pulpa.", respuesta: "naranja", pista: "Fruta jugosa" },
    { pregunta: "Tiene escamas y no es pez, tiene corona y no es rey.", respuesta: "piña", pista: "Fruta tropical" },
    { pregunta: "Es blanco y se derrite, se usa para enfriar.", respuesta: "hielo", pista: "Estado del agua" },
    { pregunta: "Tiene ruedas y no es coche, lleva carga y no es camión.", respuesta: "carretilla", pista: "Herramienta" },
    { pregunta: "Es chiquito y da luz, se enciende y se apaga.", respuesta: "vela", pista: "Se usa en ceremonias" },
    { pregunta: "Tiene cabeza y no piensa, tiene brazos y no abraza.", respuesta: "camisa", pista: "Ropa de torso" },
    { pregunta: "Es negro y se usa para borrar.", respuesta: "goma", pista: "Borra lápiz" },
    { pregunta: "Tiene llaves y no abre, tiene música y no canta.", respuesta: "teclado", pista: "Instrumento electrónico" },
    { pregunta: "Es blanco y se rompe, tiene cáscara.", respuesta: "huevo", pista: "Alimento" },
    { pregunta: "Tiene patas y no camina, tiene mesa y no come.", respuesta: "mesa", pista: "Superficie plana" },
    { pregunta: "Es chico y negro, se usa para escribir.", respuesta: "pluma", pista: "Antiguamente de ave" },
    { pregunta: "Tiene ojos y no ve, tiene agua y no la bebe.", respuesta: "papa", pista: "Se cuece" },
    { pregunta: "Es redondo y se parte, tiene pulpa.", respuesta: "limón", pista: "Fruta ácida" },
    { pregunta: "Tiene escamas y no es pez, tiene corona y no es rey.", respuesta: "piña", pista: "Fruta dulce" },
    { pregunta: "Es blanco y se derrite, se usa para enfriar.", respuesta: "hielo", pista: "Se hace en el congelador" },
    { pregunta: "Tiene ruedas y no es coche, lleva carga y no es camión.", respuesta: "carretilla", pista: "Se usa en obra" },
    { pregunta: "Es chiquito y da luz, se enciende y se apaga.", respuesta: "fósforo", pista: "Se usa para encender fuego" },
    { pregunta: "Tiene cabeza y no piensa, tiene brazos y no abraza.", respuesta: "camisa", pista: "Se lleva puesta" },
    { pregunta: "Es negro y se usa para borrar.", respuesta: "borrador", pista: "Utensilio" },
    { pregunta: "Tiene llaves y no abre, tiene música y no canta.", respuesta: "armonica", pista: "Instrumento de bolsillo" },
    { pregunta: "Es blanco y se rompe, tiene cáscara.", respuesta: "huevo", pista: "Se come en desayuno" },
    { pregunta: "Tiene patas y no camina, tiene mesa y no come.", respuesta: "mesa", pista: "Se come encima" },
    { pregunta: "Es chico y negro, se usa para escribir.", respuesta: "portaminas", pista: "Lleva mina" },
    { pregunta: "Tiene ojos y no ve, tiene agua y no la bebe.", respuesta: "papa", pista: "Se hace chips" },
    { pregunta: "Es redondo y se parte, tiene pulpa.", respuesta: "toronja", pista: "Fruta amarga" },
    { pregunta: "Tiene escamas y no es pez, tiene corona y no es rey.", respuesta: "piña", pista: "Se pela con cuchillo" },
    { pregunta: "Es blanco y se derrite, se usa para enfriar.", respuesta: "hielo", pista: "Se pone en tragos" },
    { pregunta: "Tiene ruedas y no es coche, lleva carga y no es camión.", respuesta: "carretilla", pista: "Se empuja con manos" },
    { pregunta: "Es chiquito y da luz, se enciende y se apaga.", respuesta: "linterna", pista: "Lleva pilas" },
    { pregunta: "Tiene cabeza y no piensa, tiene brazos y no abraza.", respuesta: "camisa", pista: "Se plancha" },
    { pregunta: "Es negro y se usa para borrar.", respuesta: "tinta", pista: "Se usa para imprimir" },
    { pregunta: "Tiene llaves y no abre, tiene música y no canta.", respuesta: "flauta", pista: "Instrumento de viento" },
    { pregunta: "Es blanco y se rompe, tiene cáscara.", respuesta: "huevo", pista: "Se casca" },
    { pregunta: "Tiene patas y no camina, tiene mesa y no come.", respuesta: "escritorio", pista: "Se estudia encima" },
    { pregunta: "Es chico y negro, se usa para escribir.", respuesta: "marcador", pista: "Escribe en pizarra" },
    { pregunta: "Tiene ojos y no ve, tiene agua y no la bebe.", respuesta: "papa", pista: "Se cultiva en tierra" },
    { pregunta: "Es redondo y se parte, tiene pulpa.", respuesta: "sandía", pista: "Fruta de verano" },
    { pregunta: "Tiene escamas y no es pez, tiene corona y no es rey.", respuesta: "piña", pista: "Fruta tropical" },
    { pregunta: "Es blanco y se derrite, se usa para enfriar.", respuesta: "nieve", pista: "Cae del cielo" },
    { pregunta: "Tiene ruedas y no es coche, lleva carga y no es camión.", respuesta: "carretilla", pista: "Se usa en jardín" },
    { pregunta: "Es chiquito y da luz, se enciende y se apaga.", respuesta: "bombilla", pista: "Está en el techo" },
    { pregunta: "Tiene cabeza y no piensa, tiene brazos y no abraza.", respuesta: "abrigo", pista: "Se usa en invierno" },
    { pregunta: "Es negro y se usa para borrar.", respuesta: "tinta", pista: "Se usa en impresora" },
    { pregunta: "Tiene llaves y no abre, tiene música y no canta.", respuesta: "guitarra", pista: "Tiene cuerdas" },
    { pregunta: "Es blanco y se rompe, tiene cáscara.", respuesta: "huevo", pista: "Se come frito" },
    { pregunta: "Tiene patas y no camina, tiene mesa y no come.", respuesta: "banco", pista: "Se sienta" },
    { pregunta: "Es chico y negro, se usa para escribir.", respuesta: "lapicero", pista: "Escribe en papel" },
    { pregunta: "Tiene ojos y no ve, tiene agua y no la bebe.", respuesta: "papa", pista: "Se pela" },
    { pregunta: "Es redondo y se parte, tiene pulpa.", respuesta: "manzana", pista: "Fruta roja o verde" },
    { pregunta: "Tiene escamas y no es pez, tiene corona y no es rey.", respuesta: "piña", pista: "Fruta de piña" },
    { pregunta: "Es blanco y se derrite, se usa para enfriar.", respuesta: "helado", pista: "Se come en verano" },
    { pregunta: "Tiene ruedas y no es coche, lleva carga y no es camión.", respuesta: "carretilla", pista: "Se usa en almacén" },
    { pregunta: "Es chiquito y da luz, se enciende y se apaga.", respuesta: "candil", pista: "Antigua lámpara" },
    { pregunta: "Tiene cabeza y no piensa, tiene brazos y no abraza.", respuesta: "chaqueta", pista: "Ropa de torso" },
    { pregunta: "Es negro y se usa para borrar.", respuesta: "carbón", pista: "Se usa para dibujar" },
    { pregunta: "Tiene llaves y no abre, tiene música y no canta.", respuesta: "piano", pista: "Instrumento de teclado" },
    { pregunta: "Es blanco y se rompe, tiene cáscara.", respuesta: "huevo", pista: "Se hierve" },
    { pregunta: "Tiene patas y no camina, tiene mesa y no come.", respuesta: "tabla", pista: "Se corta encima" },
    { pregunta: "Es chico y negro, se usa para escribir.", respuesta: "bolígrafo", pista: "Escribe con tinta" },
    { pregunta: "Tiene ojos y no ve, tiene agua y no la bebe.", respuesta: "papa", pista: "Se hace puré" },
    { pregunta: "Es redondo y se parte, tiene pulpa.", respuesta: "melón", pista: "Fruta dulce" },
    { pregunta: "Tiene escamas y no es pez, tiene corona y no es rey.", respuesta: "piña", pista: "Fruta tropical" },
    { pregunta: "Es blanco y se derrite, se usa para enfriar.", respuesta: "granizado", pista: "Bebida fría" },
    { pregunta: "Tiene ruedas y no es coche, lleva carga y no es camión.", respuesta: "carretilla", pista: "Se usa en campo" },
    { pregunta: "Es chiquito y da luz, se enciende y se apaga.", respuesta: "luz", pista: "Se paga cada mes" },
    { pregunta: "Tiene cabeza y no piensa, tiene brazos y no abraza.", respuesta: "suéter", pista: "Ropa de lana" },
    { pregunta: "Es negro y se usa para borrar.", respuesta: "tinta", pista: "Se usa en escritura" },
    { pregunta: "Tiene llaves y no abre, tiene música y no canta.", respuesta: "saxofón", pista: "Instrumento de metal" },
    { pregunta: "Es blanco y se rompe, tiene cáscara.", respuesta: "huevo", pista: "Se come en tortilla" },
    { pregunta: "Tiene patas y no camina, tiene mesa y no come.", respuesta: "escritorio", pista: "Se trabaja encima" },
    { pregunta: "Es chico y negro, se usa para escribir.", respuesta: "rotulador", pista: "Escribe en papel" },
    { pregunta: "Tiene ojos y no ve, tiene agua y no la bebe.", respuesta: "papa", pista: "Se cultiva" },
    { pregunta: "Es redondo y se parte, tiene pulpa.", respuesta: "uva", pista: "Fruta en racimo" },
    { pregunta: "Tiene escamas y no es pez, tiene corona y no es rey.", respuesta: "piña", pista: "Fruta con espinas" },
    { pregunta: "Es blanco y se derrite, se usa para enfriar.", respuesta: "copo", pista: "De nieve" },
    { pregunta: "Tiene ruedas y no es coche, lleva carga y no es camión.", respuesta: "carretilla", pista: "Se usa en obra" },
    { pregunta: "Es chiquito y da luz, se enciende y se apaga.", respuesta: "intermitente", pista: "Está en el auto" },
    { pregunta: "Tiene cabeza y no piensa, tiene brazos y no abraza.", respuesta: "abrigo", pista: "Se abrocha" },
    { pregunta: "Es negro y se usa para borrar.", respuesta: "borrador", pista: "Se usa en colegio" },
    { pregunta: "Tiene llaves y no abre, tiene música y no canta.", respuesta: "armonica", pista: "Se sopla" },
    { pregunta: "Es blanco y se rompe, tiene cáscara.", respuesta: "huevo", pista: "Se come en desayuno" },
    { pregunta: "Tiene patas y no camina, tiene mesa y no come.", respuesta: "banco", pista: "Se sienta" },
    { pregunta: "Es chico y negro, se usa para escribir.", respuesta: "marcador", pista: "Escribe en cartel" },
    { pregunta: "Tiene ojos y no ve, tiene agua y no la bebe.", respuesta: "papa", pista: "Se hornea" },
    { pregunta: "Es redondo y se parte, tiene pulpa.", respuesta: "ciruela", pista: "Fruta morada" },
    { pregunta: "Tiene escamas y no es pez, tiene corona y no es rey.", respuesta: "piña", pista: "Fruta tropical" },
    { pregunta: "Es blanco y se derrite, se usa para enfriar.", respuesta: "cubito", pista: "Se pone en trago" },
    { pregunta: "Tiene ruedas y no es coche, lleva carga y no es camión.", respuesta: "carretilla", pista: "Se usa en almacén" },
    { pregunta: "Es chiquito y da luz, se enciende y se apaga.", respuesta: "led", pista: "Tipo de luz" },
    { pregunta: "Tiene cabeza y no piensa, tiene brazos y no abraza.", respuesta: "camisa", pista: "Se plancha" },
    { pregunta: "Es negro y se usa para borrar.", respuesta: "tinta", pista: "Se usa en impresora" },
    { pregunta: "Tiene llaves y no abre, tiene música y no canta.", respuesta: "violin", pista: "Instrumento de cuerdas" },
    { pregunta: "Es blanco y se rompe, tiene cáscara.", respuesta: "huevo", pista: "Se come en omelette" },
    { pregunta: "Tiene patas y no camina, tiene mesa y no come.", respuesta: "taburete", pista: "Se sienta" },
    { pregunta: "Es chico y negro, se usa para escribir.", respuesta: "estilográfica", pista: "Pluma elegante" },
    { pregunta: "Tiene ojos y no ve, tiene agua y no la bebe.", respuesta: "papa", pista: "Se fríe" },
    { pregunta: "Es redondo y se parte, tiene pulpa.", respuesta: "durazno", pista: "Fruta peluda" },
    { pregunta: "Tiene escamas y no es pez, tiene corona y no es rey.", respuesta: "piña", pista: "Fruta dulce" },
    { pregunta: "Es blanco y se derrite, se usa para enfriar.", respuesta: "yogur", pista: "Se come frío" },
    { pregunta: "Tiene ruedas y no es coche, lleva carga y no es camión.", respuesta: "carretilla", pista: "Se usa en jardín" },
    { pregunta: "Es chiquito y da luz, se enciende y se apaga.", respuesta: "foco", pista: "Está en el techo" },
    { pregunta: "Tiene cabeza y no piensa, tiene brazos y no abraza.", respuesta: "chaqueta", pista: "Se cuelga" },
    { pregunta: "Es negro y se usa para borrar.", respuesta: "carbón", pista: "Se usa para dibujar" },
    { pregunta: "Tiene llaves y no abre, tiene música y no canta.", respuesta: "piano", pista: "Se toca con dedos" },
    { pregunta: "Es blanco y se rompe, tiene cáscara.", respuesta: "huevo", pista: "Se hierve" },
    { pregunta: "Tiene patas y no camina, tiene mesa y no come.", respuesta: "escritorio", pista: "Se trabaja" },
    { pregunta: "Es chico y negro, se usa para escribir.", respuesta: "lapicero", pista: "Escribe tinta" },
    { pregunta: "Tiene ojos y no ve, tiene agua y no la bebe.", respuesta: "papa", pista: "Se pela" },
    { pregunta: "Es redondo y se parte, tiene pulpa.", respuesta: "pera", pista: "Fruta jugosa" },
    { pregunta: "Tiene escamas y no es pez, tiene corona y no es rey.", respuesta: "piña", pista: "Fruta tropical" },
    { pregunta: "Es blanco y se derrite, se usa para enfriar.", respuesta: "mantecado", pista: "Helado español" },
    { pregunta: "Tiene ruedas y no es coche, lleva carga y no es camión.", respuesta: "carretilla", pista: "Se usa en campo" },
    { pregunta: "Es chiquito y da luz, se enciende y se apaga.", respuesta: "candil", pista: "Lámpara antigua" },
    { pregunta: "Tiene cabeza y no piensa, tiene brazos y no abraza.", respuesta: "suéter", pista: "Ropa de lana" },
    { pregunta: "Es negro y se usa para borrar.", respuesta: "tinta", pista: "Se usa en escritura" },
    { pregunta: "Tiene llaves y no abre, tiene música y no canta.", respuesta: "organillo", pista: "Instrumento de calle" },
    { pregunta: "Es blanco y se rompe, tiene cáscara.", respuesta: "huevo", pista: "Se come en tortilla" },
    { pregunta: "Tiene patas y no camina, tiene mesa y no come.", respuesta: "banco", pista: "Se sienta" },
    { pregunta: "Es chico y negro, se usa para escribir.", respuesta: "bolígrafo", pista: "Escribe con tinta" },
    { pregunta: "Tiene ojos y no ve, tiene agua y no la bebe.", respuesta: "papa", pista: "Se hornea" },
    { pregunta: "Es redondo y se parte, tiene pulpa.", respuesta: "granada", pista: "Fruta con semillas" },
    { pregunta: "Tiene escamas y no es pez, tiene corona y no es rey.", respuesta: "piña", pista: "Fruta con espinas" },
    { pregunta: "Es blanco y se derrite, se usa para enfriar.", respuesta: "sorbete", pista: "Postre frío" },
    { pregunta: "Tiene ruedas y no es coche, lleva carga y no es camión.", respuesta: "carretilla", pista: "Se usa en obra" },
    { pregunta: "Es chiquito y da luz, se enciende y se apaga.", respuesta: "lámpara", pista: "Da luz" },
    { pregunta: "Tiene cabeza y no piensa, tiene brazos y no abraza.", respuesta: "abrigo", pista: "Se abrocha" },
    { pregunta: "Es negro y se usa para borrar.", respuesta: "borrador", pista: "Borra lápiz" },
];

const plugin: Plugin = {
    commands: ['adivinanza', 'riddle', 'adivina'],

    async execute(ctx: PluginContext): Promise<void> {
        const { chatId, sender, reply, dbService, args } = ctx;

        if (activeRiddle.has(chatId)) {
            const riddle = activeRiddle.get(chatId)!;
            const respuesta = args.join(' ').toLowerCase().trim()
                .normalize("NFD").replace(/[\u0300-\u036f]/g, "");

            if (!respuesta) {
                await reply(styleText(
                    `ꕤ *Ya hay una adivinanza activa*\n\n` +
                    `> Pista: *${riddle.pista}*\n\n` +
                    `_Responde con: /adivinanza <tu respuesta>_`
                ));
                return;
            }

            const respuestaCorrecta = riddle.respuesta
                .normalize("NFD").replace(/[\u0300-\u036f]/g, "");

            if (respuesta.includes(respuestaCorrecta) || respuestaCorrecta.includes(respuesta)) {
                const reward = Math.floor(Math.random() * 1001) + 1000;
                const userData = dbService.getUser(sender);

                dbService.updateUser(sender, {
                    'economy.coins': (userData.economy?.coins || 0) + reward
                });

                activeRiddle.delete(chatId);

                await reply(styleText(
                    `ꕥ *¡Correcto!*\n\n` +
                    `> Respuesta » *${riddle.respuesta.charAt(0).toUpperCase() + riddle.respuesta.slice(1)}*\n` +
                    `> Ganaste » *¥${formatNumber(reward)}* coins\n\n` +
                    `_¡Usa /adivinanza para otra!_`
                ));
            } else {
                await reply(styleText(
                    `ꕤ *Incorrecto*\n\n` +
                    `> Pista: *${riddle.pista}*\n\n` +
                    `_Sigue intentando..._`
                ));
            }
            return;
        }

        const adivinanza = adivinanzas[Math.floor(Math.random() * adivinanzas.length)];

        activeRiddle.set(chatId, {
            respuesta: adivinanza.respuesta,
            pista: adivinanza.pista,
            timestamp: Date.now()
        });

        setTimeout(() => {
            if (activeRiddle.has(chatId)) {
                activeRiddle.delete(chatId);
            }
        }, 30000); // ⏱️ Ahora solo 30 segundos

        await reply(styleText(
            `ꕥ *ADIVINANZA*\n\n` +
            `> *${adivinanza.pregunta}*\n\n` +
            `> Pista » *${adivinanza.pista}*\n` +
            `> Premio » *¥1,000 - ¥2,000* coins\n` +
            `> Tiempo » *30 segundos*\n\n` +
            `_Responde con: /adivinanza <respuesta>_`
        ));
    }
};

export default plugin;