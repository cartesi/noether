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
import humanizeDuration from "humanize-duration";
import { formatCTSI } from "./util";

import {
    createStaking,
    createBlockSelector,
    createRewardManager,
} from "./contracts";

import { CONFIRMATIONS, GAS_MULTIPLIER } from "./config";

const produceChainBlock = async (pos: PoS, user: string, chainId: number) => {
    // check if chain is active
    const active = await pos.isActive(chainId);
    if (!active) {
        log.debug(`[chain ${chainId}] inactive`);
        return;
    }

    const rewardManager = await createRewardManager(pos, chainId, pos.signer);
    const reward = await rewardManager.getCurrentReward();
    if (reward.isZero()) {
        log.debug(
            `[chain ${chainId}] zero reward from RewardManager(${rewardManager.address})`
        );
        return;
    }

    // check stake state
    const staking = await createStaking(pos, chainId, pos.signer);
    const staked = await staking.getStakedBalance(user);
    const maturing = await staking.getMaturingBalance(user);
    const timestamp =
        (await staking.getMaturingTimestamp(user)).toNumber() * 1000;
    const now = Date.now();

    // print stake
    if (maturing.gt(0)) {
        if (timestamp > now) {
            log.debug(
                `[chain ${chainId}] ${formatCTSI(
                    staked
                )} CTSI at stake, ${formatCTSI(
                    maturing
                )} CTSI maturing in ${humanizeDuration(timestamp - now, {
                    maxDecimalPoints: 0,
                })}`
            );
        } else {
            log.warn(
                `[chain ${chainId}] ${formatCTSI(
                    staked
                )} CTSI at stake, ${formatCTSI(
                    maturing
                )} CTSI maturing past due ${humanizeDuration(now - timestamp, {
                    maxDecimalPoints: 0,
                })}`
            );
        }
    } else {
        log.debug(`[chain ${chainId}] ${formatCTSI(staked)} CTSI at stake`);
    }

    if (staked.isZero()) {
        // zero mature, bail out
        return;
    }

    // check if can produce
    const blockSelector = await createBlockSelector(pos, chainId, pos.signer);
    const canProduce = await blockSelector.canProduceBlock(
        await pos.getBlockSelectorIndex(chainId),
        user,
        staked
    );

    log.debug(`[chain ${chainId}] canProduce=${canProduce}`);
    if (canProduce) {
        try {
            log.info(
                `[chain ${chainId}] trying to produce block and claim reward of ${formatCTSI(
                    reward
                )} CTSI...`
            );
            const gasPrice = await pos.signer.getGasPrice();
            const tx = await pos.produceBlock(chainId, {
                gasPrice: gasPrice,
            });
            log.info(
                `[chain ${chainId}] transaction ${tx.hash}, waiting for ${CONFIRMATIONS} confirmation(s)...`
            );
            const receipt = await tx.wait(CONFIRMATIONS);
            log.info(
                `[chain ${chainId}] block produced, gas used ${receipt.gasUsed}`
            );
        } catch (e) {
            log.error(e.message);
        }
    }
};

export const produceBlock = async (
    pos: PoS,
    user: string
): Promise<Boolean> => {
    try {
        // number of chains
        const index = await pos.currentIndex();

        if (index.isZero()) {
            log.debug(`no chains`);
            return true;
        }

        // loop through all chains
        for (let chainId = 0; chainId < index.toNumber(); chainId++) {
            await produceChainBlock(pos, user, chainId);
        }
    } catch (e) {
        log.error(e.message);
    }
    return true;
};