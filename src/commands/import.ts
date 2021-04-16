// Copyright 2021 Cartesi Pte. Ltd.

// Licensed under the Apache License, Version 2.0 (the "License"); you may not use
// this file except in compliance with the License. You may obtain a copy of the
// License at http://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software distributed
// under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
// CONDITIONS OF ANY KIND, either express or implied. See the License for the
// specific language governing permissions and limitations under the License.

import { Argv } from "yargs";
import * as wallet from "../wallet";
import log from "loglevel";

interface Args {
    wallet: string;
}

export const command = "import";
export const describe = "Import encrypted wallet file from mnemonic";

export const builder = (yargs: Argv) => {
    return yargs.option("wallet", {
        describe: "Filename of JSON encrypted wallet file",
        type: "string",
        default: "/root/.ethereum/key",
    });
};

export const handler = async (args: Args) => {
    if (process.env.MNEMONIC) {
        // create wallet from mnemonic
        const w = await wallet.loadFromMnemonic(
            process.env.MNEMONIC,
            process.env.MNEMONIC_PATH
        );

        // create wallet encrypted file
        await wallet.save(w, args.wallet);
    } else if (process.env.SEED) {
        // create wallet from seed
        const w = await wallet.loadFromSeed(process.env.SEED);

        // create wallet encrypted file
        await wallet.save(w, args.wallet);
    } else {
        log.error(`environment variable MNEMONIC or SEED not set`);
    }
};
