// Copyright 2020 Cartesi Pte. Ltd.

// Licensed under the Apache License, Version 2.0 (the "License"); you may not use
// this file except in compliance with the License. You may obtain a copy of the
// License at http://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software distributed
// under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
// CONDITIONS OF ANY KIND, either express or implied. See the License for the
// specific language governing permissions and limitations under the License.

import log from "loglevel";
import { Provider } from "@ethersproject/providers";
import { formatEther } from "@ethersproject/units";

import { sleep } from "./util";
import { connect } from "./connection";
import { produceBlock } from "./block";
import { hire, retire } from "./worker";
import { POLLING_INTERVAL, BALANCE_THRESHOLD } from "./config";

const checkBalance = async (provider: Provider, address: string) => {
    const balance = await provider.getBalance(address);
    if (balance.lt(BALANCE_THRESHOLD)) {
        log.warn(
            `low balance: ${formatEther(balance)} ETH, transfer more funds`
        );
    }
};

export const app = async (
    url: string,
    accountIndex: number,
    wallet: string | undefined,
    create: boolean
) => {
    // connect to node
    const { address, pos, workerManager } = await connect(
        url,
        accountIndex,
        wallet,
        create
    );

    // worker hiring
    const user = await hire(workerManager, address);

    if (!user) {
        log.error(`failed to hire`);
        return;
    }
    log.info(`worker hired by ${user}`);

    // loop forever
    while (true) {
        try {
            // check if node retired
            if (!(await retire(workerManager, address))) {
                break;
            }

            // check node balance
            await checkBalance(pos.provider, address);

            // check and try to produce a block
            await produceBlock(pos, user);
        } catch (e) {
            log.error(e);
        }

        // go to sleep
        await sleep(POLLING_INTERVAL);
    }
};
