import { Command } from "commander";
import { readdirSync } from "fs";

 function main() {
    const program = new Command();
    program.name("oNinjaBot - Twitch chat misc integrations").version("0.0.1").description("A Twitch chat misc integrations bot.");
    
    program.command("run")
        .description("Run a command")
        .argument("[command]", "The command to run. Available commands: add-song, list-songs, vote-skip, vote-keep")
        .argument("[args...]", "The arguments to pass to the command.")
        .action((command, args) => {
            
            console.log(`⌛ Running command: ${command} with args: ${args}`);

            const moduleName = `${command}.test.ts`;
            const modulePath = `./modules/${moduleName}`;

            if (readdirSync(`./src/tests/modules`).includes(moduleName)) {
                console.log(`✅ Module found! Module name: ${moduleName}`); 

                //call found module
                import(modulePath).then(module => {
                    // module.main(args);
                }).catch(err => {
                    console.log(`❌ Error while importing module: ${moduleName}`);
                    console.log(err);
                });
                
            } else {
                console.log("👀 Module not found!");
            }            

        });
    
    program.parse(process.argv);
    
}

main();