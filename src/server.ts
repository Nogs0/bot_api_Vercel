import { PrismaClient } from '@prisma/client';
import fastfy from 'fastify';
import { z } from 'zod';

const app = fastfy();

const prisma = new PrismaClient();

app.get('/drivers', async () => {
    const drivers = await prisma.driver.findMany();

    return { drivers };
})

app.post('/drivers/create', async (request, reply) => {
    const createDriverSchema = z.object({
        name: z.string(),
        phone_number: z.string(),
        online: z.boolean()
    });
    const { name, phone_number, online } = createDriverSchema.parse(request.body);

    await prisma.driver.create({
        data: {
            name,
            phone_number,
            online
        }
    })
    return reply
        .code(201)
        .header("Content-type", "application/json;charset=utf-8")
        .send({ "message": "success" });
})

app.post('/drivers/update', async (request, reply) => {

    const appJson = z.object(
        {
            appPackageName: z.string(),
            messengerPackageName: z.string(),
            query: z.object({
                sender: z.string(),
                message: z.string(),
                isGroup: z.boolean(),
                groupParticipant: z.string(),
                ruleId: z.number(),
                isTestMessage: z.boolean()
            })
        }
    );

    const { query } = appJson.parse(request.body);

    let driver = await prisma.driver.findFirstOrThrow({
        where: {
            phone_number: query.groupParticipant
        },
    });

    let messageToReturn = "Motorista não cadastrado!";
    if (driver) {

        driver.online = query.message.toUpperCase().trim() == "ONLINE";

        driver = await prisma.driver.update({
            where: {
                id: driver.id
            },
            data: {
                online: driver.online
            },
        })

        messageToReturn = `Motorista ${driver.name} está ${driver.online ? "online 🟢" : "offline 🔴"}!`;
    }

    return reply
        .code(200)
        .header("Content-type", "application/json;charset=utf-8")
        .send({
            "replies": [
                {
                    "message": messageToReturn
                }
            ]
        });
})

app.post('/test', async (request, reply) => {

    let driver = await prisma.driver.findFirstOrThrow({
        where: {
            phone_number: request.headers.driver?.toString()
        }
    })

    return reply.code(200).send({
        "replies": [
            {
                "message": driver.name
            }
        ]
    });
})

app.post('/message', async (request, reply) => {

    let driversOn = await prisma.driver.findMany({
        where: {
            online: true
        }
    });

    driversOn = shuffle(driversOn);
    let messageToReturn = "Olá, tudo bem? Espero que sim!\nEstou indisponível no momento! 😓\nEm caso de agendamentos, respondo em alguns instantes! 😁";
    if (driversOn.length > 0)
        messageToReturn += "\nMas, a RGS conta com motoristas preparados para lhe atender! 🚗";
    for (let i = 0; i < driversOn.length; i++) 
        messageToReturn += `\n🔷 ${driversOn[i].name}: ${driversOn[i].phone_number}`

    return reply
        .code(200)
        .header("Content-type", "application/json;charset=utf-8")
        .send({
            "replies": [
                {
                    "message": messageToReturn
                }
            ]
        });
})

app.listen({
    host: '0.0.0.0',
    port: process.env.PORT ? Number(process.env.PORT) : 3333
}).then(() => console.log("HTTP Server is running"))


function shuffle(array: any) {
    var m = array.length, t, i;

    // While there remain elements to shuffle…
    while (m) {

        // Pick a remaining element…
        i = Math.floor(Math.random() * m--);

        // And swap it with the current element.
        t = array[m];
        array[m] = array[i];
        array[i] = t;
    }

    return array;
}