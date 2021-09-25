// Copyright 2021 Cartesi Pte. Ltd.

// Licensed under the Apache License, Version 2.0 (the "License"); you may not use
// this file except in compliance with the License. You may obtain a copy of the
// License at http://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software distributed
// under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
// CONDITIONS OF ANY KIND, either express or implied. See the License for the
// specific language governing permissions and limitations under the License.

import log from "loglevel";
import humanizeDuration from "humanize-duration";
import pTimeout from "p-timeout";

import { formatCTSI } from "./util";
import { CONFIRMATIONS, CONFIRMATION_TIMEOUT } from "./config";
import { ProtocolClient } from "./pos";
import * as monitoring from "./monitoring";
import { constants } from "ethers";

const explorerUrl = "https://explorer.cartesi.io/staking";

export class BlockProducer {
    private address: string;

    private client: ProtocolClient;

    constructor(address: string, client: ProtocolClient) {
        this.address = address;
        this.client = client;
    }

    async produceBlock(user: string) {
        // number of chains
        const chains = await this.client.getNumberOfChains();
        const authorized = await this.client.isAuthorized();

        // check authorization
        if (!authorized) {
            if (chains == 0) {
                log.warn(
                    `[${this.address}] worker not authorized to interact with PoS(${this.address}), please go to ${explorerUrl} and authorize`
                );
            } else {
                log.error(
                    `[${this.address}] worker not authorized to interact with PoS(${this.address}), please go to ${explorerUrl} and authorize`
                );
            }
            return true;
        }

        // if there are no chains, exit
        if (chains == 0) {
            log.debug(`[${this.address}] no chains`);
            return true;
        }

        // loop through all chains, each at a time
        for (let chainId = 0; chainId < chains; chainId++) {
            const chain = this.client.getChain(chainId);
            // check if chain is active
            const active = await chain.isActive();
            if (!active) {
                if (chainId > 0) {
                    log.debug(`[${this.address}/${chainId}] inactive`);
                }
                continue;
            }

            const reward = await chain.getCurrentReward();
            if (reward.isZero()) {
                const address = await chain.getRewardManagerAddress();
                log.debug(
                    `[${this.address}/${chainId}] zero reward at RewardManager(${address})`
                );
                continue;
            }

            // check stake state
            const staked = await chain.getStakedBalance(user);
            const maturing = await chain.getMaturingBalance(user);
            const timestamp = (await chain.getMaturingTimestamp(user)) * 1000;
            const now = Date.now();

            // track stake to monitoring
            monitoring.stake.set(staked.div(constants.WeiPerEther).toNumber());

            // print stake
            if (maturing.gt(0)) {
                if (timestamp > now) {
                    log.debug(
                        `[${this.address}/${chainId}] ${formatCTSI(
                            staked
                        )} CTSI at stake, ${formatCTSI(
                            maturing
                        )} CTSI maturing in ${humanizeDuration(
                            timestamp - now,
                            {
                                maxDecimalPoints: 0,
                            }
                        )}`
                    );
                } else {
                    log.warn(
                        `[${this.address}/${chainId}] ${formatCTSI(
                            staked
                        )} CTSI at stake, ${formatCTSI(
                            maturing
                        )} CTSI maturing past due ${humanizeDuration(
                            now - timestamp,
                            {
                                maxDecimalPoints: 0,
                            }
                        )}`
                    );
                }
            } else {
                log.debug(
                    `[${this.address}/${chainId}] ${formatCTSI(
                        staked
                    )} CTSI at stake`
                );
            }

            if (staked.isZero()) {
                // zero mature, bail out
                continue;
            }

            // check if can produce
            const canProduce = await chain.canProduceBlock(user, staked);
            monitoring.eligibility_checks.inc();

            log.debug(
                `[${this.address}/${chainId}] eligibleForNextBlock=${canProduce}`
            );
            if (canProduce) {
                try {
                    // count eligibility to monitoring
                    monitoring.eligibility.inc();

                    const blockInterval = await chain.getBlockInterval(user);
                    if (
                        blockInterval.mod(256).eq(0) ||
                        blockInterval.mod(256).gte(254)
                    ) {
                        continue;
                    }

                    log.info(
                        `[${
                            this.address
                        }/${chainId}] ⛏ trying to produce block and claim reward of ${formatCTSI(
                            reward
                        )} CTSI...`
                    );

                    const tx = await chain.produceBlock();
                    log.info(
                        `[${this.address}/${chainId}] ⏱ transaction ${tx.hash} with price ${tx.gasPrice}, waiting for ${CONFIRMATIONS} confirmation(s)...`
                    );

                    // wait for confirmation, with a timeout
                    const receipt = await pTimeout(
                        tx.wait(CONFIRMATIONS),
                        CONFIRMATION_TIMEOUT,
                        `⏰ timeout waiting ${humanizeDuration(
                            CONFIRMATION_TIMEOUT
                        )} for confirmation`
                    );

                    log.info(
                        `[${this.address}/${chainId}] 🎉 block produced, gas used ${receipt.gasUsed}`
                    );

                    // count block produced to monitoring
                    monitoring.block.inc();
                } catch (e: any) {
                    log.error(e.message);
                }
            }
        }
        return true;
    }

    async rebalance() {
        // XXX: what should we do with the boolean return value?
        await this.client.rebalance();
    }
}
