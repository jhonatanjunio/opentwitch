import { PrismaClient, User } from '@prisma/client'
const prisma = new PrismaClient()

/**
 * Function called when user requests to add a song to Spotify Queue
 * 
 * @param {string}      username        Username of the user who requested the song
 * @param {string}      isSubscriber    Whether the user is a subscriber or not
 * 
 * @returns {Promise<User>}
 */
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