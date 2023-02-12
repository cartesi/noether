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

import * as monitoring from "../monitoring";
import { formatCTSI } from "../util";
import { CONFIRMATION_TIMEOUT, CONFIRMATIONS } from "../config";
import { BlockSelector, PoS, RewardManager, Staking } from "@cartesi/pos";
import { StakingPoolImpl } from "@cartesi/staking-pool";
import { WorkerAuthManager } from "@cartesi/util";
import { BigNumber, ContractTransaction } from "ethers";
import { AbstractProtocolClient, ChainClient } from ".";
import {
    createBlockSelector,
    createRewardManager,
    createStaking,
    createStakingPool,
} from "../contracts";
import TransactionManager from "../transactionManager";

class ChainImpl implements ChainClient {
    protected pos: PoS;

    protected chainId: number;

    private rewardManager: RewardManager | undefined;

    private staking: Staking | undefined;

    private blockSelector: BlockSelector | undefined;

    protected transactionManager: TransactionManager;

    constructor(
        pos: PoS,
        transactionManager: TransactionManager,
        chainId: number
    ) {
        this.pos = pos;
        this.transactionManager = transactionManager;
        this.chainId = chainId;
        this.rewardManager = undefined;
        this.staking = undefined;
    }

    private async getRewardManager(): Promise<RewardManager> {
        if (!this.rewardManager) {
            this.rewardManager = await createRewardManager(
                this.pos,
                this.chainId,
                this.pos.signer
            );
        }
        return this.rewardManager;
    }

    private async getStaking(): Promise<Staking> {
        if (!this.staking) {
            this.staking = await createStaking(
                this.pos,
                this.chainId,
                this.pos.signer
            );
        }
        return this.staking;
    }

    private async getBlockSelector(): Promise<BlockSelector> {
        if (!this.blockSelector) {
            this.blockSelector = await createBlockSelector(
                this.pos,
                this.chainId,
                this.pos.signer
            );
        }
        return this.blockSelector;
    }

    isActive(): Promise<boolean> {
        return this.pos.isActive(this.chainId);
    }

    async getCurrentReward(): Promise<BigNumber> {
        const rewardManager = await this.getRewardManager();
        return rewardManager.getCurrentReward();
    }

    async getRewardManagerAddress(): Promise<string> {
        const rewardManager = await this.getRewardManager();
        return rewardManager.address;
    }

    async getStakedBalance(user: string): Promise<BigNumber> {
        const staking = await this.getStaking();
        return staking.getStakedBalance(user);
    }

    async getMaturingBalance(user: string): Promise<BigNumber> {
        const staking = await this.getStaking();
        return staking.getMaturingBalance(user);
    }

    async getMaturingTimestamp(user: string): Promise<number> {
        const staking = await this.getStaking();
        return staking.getMaturingTimestamp(user).then((t) => t.toNumber());
    }

    async getBlockInterval(user: string): Promise<BigNumber> {
        const blockSelector = await this.getBlockSelector();
        const blockSelectorIndex = await this.pos.getBlockSelectorIndex(
            this.chainId
        );
        const blockSelectorState = await blockSelector.getState(
            blockSelectorIndex,
            user
        );
        const currentBlock = blockSelectorState[0];
        const currentGoalBlockNumber = blockSelectorState[1];
        return currentBlock.sub(currentGoalBlockNumber);
    }

    async canProduceBlock(user: string, staked: BigNumber): Promise<boolean> {
        const blockSelector = await this.getBlockSelector();
        const blockSelectorIndex = await this.pos.getBlockSelectorIndex(
            this.chainId
        );
        return blockSelector.canProduceBlock(blockSelectorIndex, user, staked);
    }

    async produceBlock(): Promise<ContractTransaction> {
        const nonce = this.pos.signer.getTransactionCount("latest");
        const gasLimit = await this.pos.estimateGas.produceBlock(this.chainId);
        const overrides = await this.transactionManager.getOverrides(gasLimit);
        return this.pos.produceBlock(this.chainId, {
            ...overrides,
            nonce,
        });
    }
}

class PoolChainImpl extends ChainImpl {
    private address: string;

    private stakingPool: StakingPoolImpl | undefined;

    constructor(
        pos: PoS,
        transactionManager: TransactionManager,
        chainId: number,
        pool: string
    ) {
        super(pos, transactionManager, chainId);
        this.address = pool;
    }

    private async getStakingPool(): Promise<StakingPoolImpl> {
        if (!this.stakingPool) {
            this.stakingPool = await createStakingPool(
                this.address,
                this.pos.signer
            );
        }
        return this.stakingPool;
    }

    async produceBlock(): Promise<ContractTransaction> {
        const nonce = this.pos.signer.getTransactionCount("latest");
        const pool = await this.getStakingPool();
        const gasLimit = await pool.estimateGas.produceBlock(this.chainId);
        const overrides = await this.transactionManager.getOverrides(gasLimit);
        return pool.produceBlock(this.chainId, {
            ...overrides,
            nonce,
        });
    }
}

export class ProtocolImpl extends AbstractProtocolClient {
    private transactionManager: TransactionManager;

    private chains: ChainClient[];

    constructor(
        pos: PoS,
        authManager: WorkerAuthManager,
        transactionManager: TransactionManager
    ) {
        super(pos, authManager);
        this.transactionManager = transactionManager;
        this.chains = [];
    }

    async rebalance(): Promise<boolean> {
        // nothing to do, not a pool
        return false;
    }

    getChain(index: number): ChainClient {
        // create chains on demand
        while (index >= this.chains.length) {
            const chain = new ChainImpl(
                this.pos,
                this.transactionManager,
                this.chains.length
            );
            this.chains.push(chain);
        }
        return this.chains[index];
    }
}

export class PoolProtocolImpl extends AbstractProtocolClient {
    private pool: string;

    private transactionManager: TransactionManager;

    private chains: ChainClient[];

    private stakingPool: StakingPoolImpl | undefined;

    constructor(
        pos: PoS,
        pool: string,
        authManager: WorkerAuthManager,
        transactionManager: TransactionManager
    ) {
        super(pos, authManager);
        this.pos = pos;
        this.pool = pool;
        this.transactionManager = transactionManager;
        this.chains = [];
    }

    getChain(index: number): ChainClient {
        while (index >= this.chains.length) {
            const chain = new PoolChainImpl(
                this.pos,
                this.transactionManager,
                this.chains.length,
                this.pool
            );
            this.chains.push(chain);
        }
        return this.chains[index];
    }

    private async getStakingPool(): Promise<StakingPoolImpl> {
        if (!this.stakingPool) {
            this.stakingPool = await createStakingPool(
                this.pool,
                this.pos.signer
            );
        }
        return this.stakingPool;
    }

    async rebalance(): Promise<boolean> {
        const pool = await this.getStakingPool();
        const { stake, unstake, withdraw } = await pool.amounts();

        // check if we need to rebalance pool
        if (stake.gt(0) || unstake.gt(0) || withdraw.gt(0)) {
            log.info(
                `[${pool.address}] rebalancing, stake ${formatCTSI(
                    stake
                )} CTSI, unstake ${formatCTSI(
                    unstake
                )} CTSI, withdraw ${formatCTSI(withdraw)} CTSI`
            );
            const tx = await pool.rebalance();
            log.info(
                `[${pool.address}] ⏱ transaction ${tx.hash}, waiting for ${CONFIRMATIONS} confirmation(s)...`
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
                `[${pool.address}}] 🎉 rebalanced, gas used ${receipt.gasUsed} at price ${receipt.effectiveGasPrice}`
            );

            // increment rebalance counter
            monitoring.rebalance.inc();

            return true;
        }

        return false;
    }
}
