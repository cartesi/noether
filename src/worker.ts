// Copyright 2020 Cartesi Pte. Ltd.

// Licensed under the Apache License, Version 2.0 (the "License"); you may not use
// this file except in compliance with the License. You may obtain a copy of the
// License at http://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software distributed
// under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
// CONDITIONS OF ANY KIND, either express or implied. See the License for the
// specific language governing permissions and limitations under the License.

import log from "loglevel";
import { formatEther } from "ethers/lib/utils";
import { retryDecorator } from "ts-retry-promise";
import { WorkerManager } from "@cartesi/util";
import { sleep } from "./util";
import {
    CONFIRMATIONS,
    GAS_MULTIPLIER,
    POLLING_INTERVAL,
    RETRY_INTERVAL,
    TIMEOUT,
} from "./config";

const _hire = async (
    workerManager: WorkerManager,
    address: string
): Promise<string | undefined> => {
    const owned = await workerManager.isOwned(address);
    if (owned) {
        // already owned, just return the owner
        return workerManager.getOwner(address);
    }

    if (await retire(workerManager, address)) {
        // if retire returns true, exit
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

        // get gas price from provider
        const currentGasPrice = await workerManager.provider.getGasPrice();

        // increase the price
        const gasPrice = currentGasPrice.mul(16).div(10);
        log.debug(
            `gasPrice: ${gasPrice} = ${currentGasPrice} * ${GAS_MULTIPLIER} / 100`
        );

        const tx = await workerManager.acceptJob({
            gasPrice: gasPrice,
        });
        log.info(`transaction ${tx.hash}, waiting for confirmation...`);
        const receipt = await tx.wait(CONFIRMATIONS);
        log.debug(`gas used: ${receipt.gasUsed}`);
        return workerManager.getOwner(address);
    }
    return undefined;
};

export const retire = async (
    workerManager: WorkerManager,
    address: string
): Promise<boolean> => {
    const retired = await workerManager.isRetired(address);
    if (retired) {
        const provider = workerManager.provider;
        const signer = workerManager.signer;

        // get who is the node owner
        const user = await workerManager.getUser(address);

        // get this node remaining balance
        const balance = await provider.getBalance(address);

        if (balance.isZero()) {
            log.info(`node retired, zero balance`);
            return true;
        }

        // estimate gas of transaction
        const gas = await provider.estimateGas({
            to: user,
            value: balance,
        });

        // get gas price from provider
        const gasPrice = await provider.getGasPrice();

        // calculate the fees
        const fee = gasPrice.mul(gas);

        // send transaction returning all remaining balance to owner
        const value = balance.sub(fee);
        log.info(
            `node retired, returning ${formatEther(value)} ETH to user ${user}`
        );
        const tx = await signer.sendTransaction({
            to: user,
            value,
        });
        log.info(`transaction ${tx.hash}, waiting for confirmation...`);
        const receipt = await tx.wait(CONFIRMATIONS);
        log.debug(`gas used: ${receipt.gasUsed}`);

        return true;
    }
    return false;
};

export const hire = retryDecorator(_hire, {
    logger: (msg) => log.error(msg),
    delay: RETRY_INTERVAL,
    retries: "INFINITELY",
    timeout: TIMEOUT,
});
