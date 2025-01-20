"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const config_1 = require("./config");
const node_cluster_1 = __importDefault(require("node:cluster"));
const node_os_1 = __importDefault(require("node:os"));
const node_http_1 = __importDefault(require("node:http"));
const config_schema_1 = require("./config-schema");
const server_schema_1 = require("./server-schema");
function createServer(config) {
    return __awaiter(this, void 0, void 0, function* () {
        const { workerCount } = config;
        if (node_cluster_1.default.isPrimary) {
            console.log(`Master ${process.pid} is running`);
            for (let i = 0; i < workerCount; i++) {
                node_cluster_1.default.fork({ config: JSON.stringify(config.config) });
                console.log(`Worker ${process.pid} started`);
            }
            const server = node_http_1.default.createServer((req, res) => {
                const ind = Math.floor(Math.random() * workerCount);
                const workers = Object.values(!node_cluster_1.default.workers); // Returns an array of workers
                const worker = workers[ind];
                const payload = {
                    requestType: 'HTTP',
                    headers: req.headers,
                    body: null,
                    path: '${req.url}',
                };
                worker.send(JSON.stringify(payload));
            });
            server.listen(config.port, function () {
                console.log(`Server is running on port ${config.port}`);
            });
        }
        else {
            console.log(`Worker ${process.pid} started`);
            const config = yield config_schema_1.configSchema.parseAsync(JSON.parse(process.env.config));
            process.on('message', (message) => __awaiter(this, void 0, void 0, function* () {
                const messageValidated = yield server_schema_1.workerMessageSchema.parseAsync(JSON.parse(message));
                const reqUrl = messageValidated.url;
            }));
        }
    });
}
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        commander_1.program.option('--config <path>');
        commander_1.program.parse();
        const options = commander_1.program.opts();
        if (options && 'config' in options) {
            const validatedConfig = yield (0, config_1.validateConfig)(yield (0, config_1.parseYAMLConfig)(options.config));
            // console.log(validatedConfig);
            yield createServer({
                port: validatedConfig.servers[0].listen,
                workerCount: (_a = validatedConfig.servers[0].workers) !== null && _a !== void 0 ? _a : node_os_1.default.cpus().length,
                config: validatedConfig,
            });
        }
    });
}
main();
