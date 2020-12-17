// Copyright 2020 Cartesi Pte. Ltd.

// Licensed under the Apache License, Version 2.0 (the "License"); you may not use
// this file except in compliance with the License. You may obtain a copy of the
// License at http://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software distributed
// under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
// CONDITIONS OF ANY KIND, either express or implied. See the License for the
// specific language governing permissions and limitations under the License.

import log from "loglevel";
import { WorkerManager } from "@cartesi/util";

const POLLING_INTERVAL = 10000;
const CONFIRMATIONS = 1;

const sleep = (timeout: number) => {
    return new Promise((resolve) => setTimeout(resolve, timeout));
};

export const hire = async (
    workerManager: WorkerManager,
    address: string
): Promise<string | undefined> => {
    const owned = await workerManager.isOwned(address);
    if (owned) {
        // already owned, just return the owner
        return workerManager.getOwner(address);
    }

    const retired = await workerManager.isRetired(address);
    if (retired) {
        log.warn(`${address} retired`);
        // TODO: call retire method
        process.exit(0);
    }

    let available = await workerManager.isAvailable(address);
    if (available) {
        log.info(`${address} available for hiring`);

        // loop while available
        do {
            await sleep(POLLING_INTERVAL);
            available = await workerManager.isAvailable(address);
        } while (available);
    }

    let pending = await workerManager.isPending(address);
    if (pending) {
        // accept the job from user
        const user = await workerManager.getUser(address);
        log.info(`accepting job from ${user}...`);

        do {
            try {
                const tx = await workerManager.acceptJob();
                log.info(`transaction ${tx.hash}, waiting for confirmation...`);
                const receipt = await tx.wait(CONFIRMATIONS);
                log.debug(`gas used: ${receipt.gasUsed}`);
                return workerManager.getOwner(address);
            } catch (e) {
                log.error(e.message);
                await sleep(POLLING_INTERVAL);
                pending = await workerManager.isPending(address);
            }
        } while (pending);
    }
};

export const retire = async (workerManager: WorkerManager) => {
    // TODO:
    return;
};
