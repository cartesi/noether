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
import { Signer } from "ethers";

import { createStaking, createBlockSelector } from "./contracts";

const produceChainBlock = async (
    signer: Signer,
    pos: PoS,
    user: string,
    chainId: number
) => {
    // check if chain is active
    if (!(await pos.isActive(chainId))) {
        log.info(`[chain ${chainId}] inactive`);
        return;
    }

    // check stake
    const staking = await createStaking(pos, chainId, signer);
    const staked = await staking.getStakedBalance(user);
    if (staked.isZero()) {
        const maturing = await staking.getMaturingBalance(user);
        if (maturing.gt(0)) {
            const timestamp = await staking.getMaturingTimestamp(user);
            const date = new Date(timestamp.toNumber() * 1000);
            log.info(
                `[chain ${chainId}] stake of ${maturing} CTSI maturing at ${date} for user ${user}`
            );
        } else {
            log.info(`[chain ${chainId}] no stake for user ${user}`);
        }
        return true;
    }
    log.info(`[chain ${chainId}] user ${user} stake: ${staked} CTSI`);

    // check if can produce
    const blockSelector = await createBlockSelector(pos, chainId, signer);
    const canProduce = await blockSelector.canProduceBlock(
        await pos.getBlockSelectorIndex(chainId),
        user,
        staked
    );

    log.info(`[chain ${chainId}] canProduce=${canProduce}`);
    if (canProduce) {
        log.info(`[chain ${chainId}] trying to produce block...`);
        const tx = await pos.produceBlock(chainId);
        log.info(
            `[chain ${chainId}] tx=${tx.hash}, waiting for confirmation...`
        );
        const receipt = await tx.wait(2);
        log.info(
            `[chain ${chainId}] block produced, gas used ${receipt.gasUsed}`
        );
    }
};

export const produceBlock = async (
    signer: Signer,
    pos: PoS,
    user: string
): Promise<Boolean> => {
    // number of chains
    const index = await pos.currentIndex();

    if (index.isZero()) {
        log.info(`no chains`);
        return true;
    }

    // loop through all chains
    for (let chainId = 0; chainId < index.toNumber(); chainId++) {
        produceChainBlock(signer, pos, user, chainId);
    }
    return true;
};
