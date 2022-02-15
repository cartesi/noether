// Copyright 2021 Cartesi Pte. Ltd.

// Licensed under the Apache License, Version 2.0 (the "License"); you may not use
// this file except in compliance with the License. You may obtain a copy of the
// License at http://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software distributed
// under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
// CONDITIONS OF ANY KIND, either express or implied. See the License for the
// specific language governing permissions and limitations under the License.

import { Argv } from "yargs";
import { app } from "../app";
import {
    GasPriceProviderType,
    gasPriceProviderTypes,
} from "../gas-price/gas-price-provider";

interface Args {
    url: string;
    wallet: string | undefined;
    accountIndex: number;
    create: boolean;
    monitoring: boolean;
    hostname: string;
    port: number;
    gasPrice: GasPriceProviderType;
    gasStationAPIKey: string;
    verbose: boolean;
}

export const command = ["start", "$0"];
export const describe = "Start the node.";

export const builder = (yargs: Argv) => {
    return yargs
        .option("url", {
            describe: "URL of the Ethereum node",
            default: process.env.URL,
        })
        .option("wallet", {
            describe: "Filename of JSON wallet file",
            type: "string",
        })
        .option("accountIndex", {
            describe: "Account index from server to use",
            default: 0,
        })
        .option("gasPrice", {
            describe: "Gas price predictor strategy",
            default: process.env.GAS_PRICE_PROVIDER,
            demandOption: true,
            choices: gasPriceProviderTypes,
        })
        .option("gasStationAPIKey", {
            describe: "Gas Station API Key",
            default: process.env.GAS_STATION_API_KEY,
        })
        .option("create", {
            describe: "Create a wallet if it doesn't exist",
            type: "boolean",
            alias: "c",
            default: false,
        })
        .option("monitoring", {
            describe: "Start monitoring server",
            type: "boolean",
            alias: "m",
            default: false,
        })
        .option("hostname", {
            describe: "Host of monitoring server",
            type: "string",
            alias: "h",
            default: "127.0.0.1",
        })
        .option("port", {
            describe: "Port of monitoring server",
            type: "number",
            alias: "p",
            default: 9860,
        })
        .option("verbose", {
            type: "boolean",
            alias: "v",
            default: false,
        });
};
export const handler = (args: Args) => {
    app(
        args.url,
        args.accountIndex,
        args.wallet,
        args.create,
        args.monitoring,
        args.hostname,
        args.port,
        args.gasPrice,
        args.gasStationAPIKey
    );
};
