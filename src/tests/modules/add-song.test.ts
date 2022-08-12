import { onSongRequest } from "../../commands/onSongRequest";

export async function main(args: string[]) {
    
    const [ userId, userName, trackId ] :any = args.slice(2);
    
    if (!trackId) {
        console.log("🤔 Missing song ID!");
        return;
    } else if (!userId) {
        console.log("🤔 Missing user ID!");
        return;
    } else if (!userName) {
        console.log("🤔 Missing user name!");
        return;
    }

    await onSongRequest(userId, userName, trackId, 'test')
        .catch((err: string) => {
            console.log(err);
        })
        .then((res: any) => {
            console.log("✅ Finished test! Result: " + res.message);
        });
        
}

main(process.argv.slice(2));