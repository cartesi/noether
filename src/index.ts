#!/usr/bin/env node
// Copyright 2021 Cartesi Pte. Ltd.

// Licensed under the Apache License, Version 2.0 (the "License"); you may not use
// this file except in compliance with the License. You may obtain a copy of the
// License at http://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software distributed
// under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
// CONDITIONS OF ANY KIND, either express or implied. See the License for the
// specific language governing permissions and limitations under the License.

import "./env";
import log from "loglevel";
import chalk from "chalk";
import prefix from "loglevel-plugin-prefix";
import yargs from "yargs";

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

// graceful shutdown
process.on("SIGINT", function () {
    process.exit();
});

// parse command line
const argv = yargs
    .version()
    .middleware([(argv) => log.setLevel(argv.verbose ? 0 : 2)])
    .commandDir("commands", { extensions: ["js", "ts"] })
    .epilogue(
        "for more information, find the documentation at https://github.com/cartesi/noether"
    ).argv;
