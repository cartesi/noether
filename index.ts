#!/usr/bin/env node
// Copyright 2020 Cartesi Pte. Ltd.

// Licensed under the Apache License, Version 2.0 (the "License"); you may not use
// this file except in compliance with the License. You may obtain a copy of the
// License at http://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software distributed
// under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
// CONDITIONS OF ANY KIND, either express or implied. See the License for the
// specific language governing permissions and limitations under the License.

import { app } from "./src/app";
import log from "loglevel";
import yargs, { Argv } from "yargs";

// parse command line
let argv = yargs.command("start", "Start the node.", (yargs: Argv) => {
    return yargs
        .option("url", {
            describe: "URL of the Ethereum node",
            default: "http://localhost:8545",
        })
        .option("accountIndex", {
            describe: "Account index from server to use",
            default: 0,
        })
        .option("verbose", {
            alias: "v",
            default: false,
        });
}).argv;

// set log level according to verbose option
log.setLevel(argv.verbose ? "trace" : "info");

// run the app
app(argv.url, argv.accountIndex);
