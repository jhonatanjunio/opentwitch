import { onSongList } from "../../commands/onSongList";

export async function main(args: string[]) {

    const userId = parseInt(args.slice(2)[0]);
    
    if (!userId)    {
        console.log("🤔 Missing user ID!");
        return;
    }

    await onSongList(userId)
        .catch((err: string) => {
            console.log(err);
        })
        .then((res: any) => {
            console.log("✅ Finished test! Result: " + res.message);
        });

}

main(process.argv.slice(2));