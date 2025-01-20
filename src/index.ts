import {program} from 'commander';
import { validateConfig, parseYAMLConfig } from './config';
import cluster from 'node:cluster'
import os from 'node:os';
import http from 'node:http';
import { configSchema, typeConfigSchema } from './config-schema';
import { workerMessageSchema, WorkerMessageType } from './server-schema';
interface CreateServerConfig{
    port:string;
    workerCount:number;
    config: typeConfigSchema
}

async function createServer(config: CreateServerConfig){
    const {workerCount}=config;
    
    if(cluster.isPrimary){
        console.log(`Master ${process.pid} is running`);
        for(let i=0;i<workerCount;i++){
            cluster.fork({config:JSON.stringify(config.config)});
            console.log(`Worker ${process.pid} started`);


        }
        const server=http.createServer((req,res)=>{
            const ind=Math.floor(Math.random()*workerCount);
            const workers = Object.values(!cluster.workers); // Returns an array of workers
            const worker = workers[ind];
            const payload:WorkerMessageType={
                requestType:'HTTP',
                headers: req.headers,
                body:null,
                path: '${req.url}',
            }
            worker.send(JSON.stringify(payload));
        });
        server.listen(config.port,function(){
            console.log(`Server is running on port ${config.port}`);
        });

    }else{
        console.log(`Worker ${process.pid} started`);
         const config=await configSchema.parseAsync(JSON.parse(process.env.config as string));
         process.on('message', async (message: string) => {
            const messageValidated=await workerMessageSchema.parseAsync(JSON.parse(message));
            const reqUrl=messageValidated.url;
            
         });
    }
}
async function main() {
    program.option('--config <path>');
    program.parse();

    const options=program.opts();
    if(options && 'config' in options){
        const validatedConfig= await validateConfig(await parseYAMLConfig(options.config));
        // console.log(validatedConfig);
    
        await createServer({
            port: validatedConfig.servers[0].listen,
            workerCount: validatedConfig.servers[0].workers ?? os.cpus().length,
            config: validatedConfig,
            
        });
    }
}

main();