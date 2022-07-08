import { onSongChoose, onSongSearch } from "../../commands/onSongSearch";

export async function main(args: string[]) {

    const [userId, userName, trackName, type]: any = args.slice(2);

    if (!userId) {
        console.log("🤔 Missing user ID!");
        return;
    } else if (!userName) {
        console.log("🤔 Missing user name!");
        return;
    }

    if ((type === undefined || type == "search") && (args.slice(2).length == 3)) {
        if (!trackName) {
            console.log("🤔 Missing track name!");
            return;
        }
        await onSongSearch(userId, userName, trackName)
            .catch((err: string) => {
                console.log(err);
            })
            .then((res: any) => {
                console.log("✅ Finished test! Result: " + res);
            });
    } else if (type && type == "choice" && (args.slice(2).length == 4)) {
        if (!trackName) {
            console.log("🤔 Missing choice!");
            return;
        }
        await onSongChoose(userId, userName, trackName)
            .catch((err: string) => {
                console.log(err);
            })
            .then((res: any) => {
                console.log("✅ Finished test! Result: " + res);
            });
    }

}

main(process.argv.slice(2));