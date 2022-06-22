import { PrismaClient, User } from '@prisma/client'
const prisma = new PrismaClient()

export async function getProfile(username: string, isSubscriber: string = "false"): Promise<User> {

    const findUserByUserName = await prisma.user.findMany({
        where: {
            username: username
        }
    });

    if (!findUserByUserName.length) {
        const user = await prisma.user.create({
            data: {
                username: username,
                is_subscriber: isSubscriber,
                is_admin: username == process.env.TWITCH_CHANNEL ? "true" : "false"
            }
        });
        return user;
    }

    await prisma.user.update({
        where: {
            id: findUserByUserName[0].id
        },
        data: {
            is_subscriber: isSubscriber
        }
    });

    return findUserByUserName[0];
}