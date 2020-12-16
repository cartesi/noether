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
import yargs, { Argv } from "yargs";

let argv = yargs.command("start", "Start the node.", (yargs: Argv) => {
    return yargs
        .option("url", {
            describe: "URL of the Ethereum node",
            default: "http://localhost:8545",
        })
        .option("verbose", {
            alias: "v",
            default: false,
        });
}).argv;

app(argv.url);
