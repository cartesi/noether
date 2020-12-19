// Copyright 2020 Cartesi Pte. Ltd.

// Licensed under the Apache License, Version 2.0 (the "License"); you may not use
// this file except in compliance with the License. You may obtain a copy of the
// License at http://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software distributed
// under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
// CONDITIONS OF ANY KIND, either express or implied. See the License for the
// specific language governing permissions and limitations under the License.

import log from "loglevel";
import { PoS } from "@cartesi/pos";

import { sleep } from "./util";
import { connect } from "./connection";
import { produceBlock } from "./block";
import { hire, retire } from "./worker";
import { POLLING_INTERVAL } from "./config";

const produce = async (pos: PoS, user: string) => {
    while (await produceBlock(pos, user)) {
        await sleep(POLLING_INTERVAL);
    }
};

export const app = async (url: string, accountIndex: number) => {
    // connect to node
    const { address, pos, workerManager } = await connect(url, accountIndex);

    // worker hiring
    const user = await hire(workerManager, address);

    if (!user) {
        log.error(`failed to hire`);
        return;
    }
    log.info(`worker hired by ${user}`);

    // loop forever
    await produce(pos, user);
};
