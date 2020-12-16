// Copyright 2020 Cartesi Pte. Ltd.

// Licensed under the Apache License, Version 2.0 (the "License"); you may not use
// this file except in compliance with the License. You may obtain a copy of the
// License at http://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software distributed
// under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
// CONDITIONS OF ANY KIND, either express or implied. See the License for the
// specific language governing permissions and limitations under the License.

import { WorkerManager } from "@cartesi/util";

export const worker = async (
    workerManager: WorkerManager,
    address: string
): Promise<Boolean> => {
    const available = await workerManager.isAvailable(address);
    const pending = await workerManager.isPending(address);
    const owned = await workerManager.isOwned(address);
    const retired = await workerManager.isRetired(address);

    if (available) {
        console.log(`worker [${address}] available`);
        return false;
    }

    if (pending) {
        const user = await workerManager.getUser(address);
        console.log(
            `worker [${address}] pending, accepting job from [${user}]`
        );
        const tx = await workerManager.acceptJob();
        console.log(`tx=${tx.hash}, waiting for confirmation...`);
        const receipt = await tx.wait(1);
        console.log(`gas used=${receipt.gasUsed}`);
        return true;
    }

    if (owned) {
        const user = await workerManager.getUser(address);
        console.log(`worker [${address}] owned by ${user}`);
        return false;
    }

    if (retired) {
        const user = await workerManager.getUser(address);
        console.log(`worker [${address}] retired by ${user}`);
        // TODO: send money back
        return true;
    }

    return false;
};
