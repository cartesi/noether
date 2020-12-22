#!/usr/bin/env node
// Copyright 2020 Cartesi Pte. Ltd.

// Licensed under the Apache License, Version 2.0 (the "License"); you may not use
// this file except in compliance with the License. You may obtain a copy of the
// License at http://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software distributed
// under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
// CONDITIONS OF ANY KIND, either express or implied. See the License for the
// specific language governing permissions and limitations under the License.

import { app } from "./app";
import log from "loglevel";
import chalk from "chalk";
import prefix from "loglevel-plugin-prefix";
import yargs, { Argv } from "yargs";

// parse command line
let argv = yargs.command("start", "Start the node.", (yargs: Argv) => {
    return yargs
        .option("url", {
            describe: "URL of the Ethereum node",
            default: "http://localhost:8545",
        })
        .option("wallet", {
            describe: "File path of JSON wallet file",
            type: "string",
        })
        .option("accountIndex", {
            describe: "Account index from server to use",
            default: 0,
        })
        .option("create", {
            type: "boolean",
            alias: "c",
            default: false,
        })
        .option("verbose", {
            type: "boolean",
            alias: "v",
            default: false,
        });
}).argv;

// setup shinny log prefix
prefix.reg(log);
interface ColorMapping {
    [level: string]: chalk.Chalk;
}
const colors: ColorMapping = {
    TRACE: chalk.gray,
    DEBUG: chalk.gray,
    INFO: chalk.gray,
    WARN: chalk.yellow,
    ERROR: chalk.red,
};
prefix.apply(log, {
    format: (level, _, timestamp) => colors[level](`[${timestamp}] ${level}:`),
    levelFormatter: (level) => level.toUpperCase(),
    timestampFormatter: (date) => date.toISOString(),
});

// set log level according to verbose option, 0 is trace, 2 is info
log.setLevel(argv.verbose ? 0 : 2);

// The signals we want to handle
// NOTE: although it is tempting, the SIGKILL signal (9) cannot be intercepted and handled
const signals = {
    SIGHUP: 1,
    SIGINT: 2,
    SIGTERM: 15,
};

// Create a listener for each of the signals that we want to handle
Object.keys(signals).forEach((signal) => {
    process.on(signal, () => {
        log.info(`shutdown, process receive a ${signal} signal`);
        process.exit(128);
    });
});

// run the app
app(argv.url, argv.accountIndex, argv.wallet, argv.create);
