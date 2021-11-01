// Copyright 2021 Cartesi Pte. Ltd.

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
    GAS_PRICE_MULTIPLIER,
    POLLING_INTERVAL,
    RETRY_INTERVAL,
    TIMEOUT,
} from "./config";
import { Overrides } from "@ethersproject/contracts";
import TransactionManager from "./transactionManager";
import ProviderGasPriceProvider from "./gas-price/providers/provider-gas-price-provider";
import { createStakingPool } from "./contracts";

const _hire = async (
    workerManager: WorkerManager,
    transactionManager: TransactionManager,
    address: string
): Promise<string | undefined> => {
    const owned = await workerManager.isOwned(address);
    if (owned) {
        // already owned, just return the owner
        return workerManager.getOwner(address);
    }

    const user = await workerManager.getUser(address);
    if (await retire(workerManager, address, user)) {
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
            log.info(`${address} available for hiring`);
        } while (available);
    }

    let pending = await workerManager.isPending(address);
    if (pending) {
        // accept the job from user
        const user = await workerManager.getUser(address);
        log.info(`accepting job from ${user}...`);

        const overrides: Overrides = await transactionManager.getOverrides();
        const tx = await workerManager.acceptJob(overrides);
        log.info(`transaction ${tx.hash}, waiting for confirmation...`);
        const receipt = await tx.wait(CONFIRMATIONS);
        log.debug(`gas used: ${receipt.gasUsed}`);
        return workerManager.getOwner(address);
    }
    return undefined;
};

/**
 * Checks if the address is from a normal user or from a pool.
 * The pool needs to hire itself and authorized the PoS to called from the pool.
 * @param workerManager WorkerManager contract
 * @param userOrPool address of user, which might also be a pool
 * @returns true if address is from a pool
 */
export const isPool = async (
    workerManager: WorkerManager,
    userOrPool: string
): Promise<boolean> => {
    const owner = await workerManager.getOwner(userOrPool);
    return owner === userOrPool;
};

export const retire = async (
    workerManager: WorkerManager,
    address: string,
    user: string
): Promise<boolean> => {
    const retired = await workerManager.isRetired(address);
    if (retired) {
        const provider = workerManager.provider;
        const signer = workerManager.signer;

        // get node owner (user or owner of pool)
        let owner = user;
        if (await isPool(workerManager, user)) {
            // get owner of the pool
            const pool = await createStakingPool(user, workerManager.signer);
            owner = await pool.owner();
        }

        // get this node remaining balance
        const balance = await provider.getBalance(address);

        if (balance.isZero()) {
            log.info(`node retired, zero balance`);
            return true;
        }

        // estimate gas of transaction
        const gas = await provider.estimateGas({
            to: owner,
            value: balance,
        });

        // get gas price from provider
        // do not use the transaction manager here because we need a non "EIP-1559" gas price
        const gasPriceProvider = new ProviderGasPriceProvider(
            provider,
            GAS_PRICE_MULTIPLIER
        );
        const { gasPrice } = await gasPriceProvider.getGasPrice();

        // calculate the fees
        const fee = gasPrice.mul(gas);

        // send transaction returning all remaining balance to owner
        const value = balance.sub(fee);
        log.info(
            `node retired, returning ${formatEther(value)} ETH to user ${owner}`
        );
        const tx = await signer.sendTransaction({
            to: owner,
            value,
            gasLimit: gas,
            gasPrice,
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
