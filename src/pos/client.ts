// Copyright 2021 Cartesi Pte. Ltd.

// Licensed under the Apache License, Version 2.0 (the "License"); you may not use
// this file except in compliance with the License. You may obtain a copy of the
// License at http://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software distributed
// under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
// CONDITIONS OF ANY KIND, either express or implied. See the License for the
// specific language governing permissions and limitations under the License.

import { BlockSelector, PoS, RewardManager, Staking } from "@cartesi/pos";
import { WorkerAuthManager } from "@cartesi/util";
import { BigNumber, Overrides, ContractTransaction } from "ethers";
import { ChainClient, AbstractProtocolClient } from ".";
import { GAS_LIMIT_MULTIPLIER } from "../config";
import {
    createBlockSelector,
    createRewardManager,
    createStaking,
} from "../contracts";
import { GasPriceProvider } from "../gas-price/gas-price-provider";

class ChainImpl implements ChainClient {
    private pos: PoS;

    private chainId: number;

    private rewardManager: RewardManager | undefined;

    private staking: Staking | undefined;

    private blockSelector: BlockSelector | undefined;

    private gasPriceProvider: GasPriceProvider;

    constructor(pos: PoS, gasPriceProvider: GasPriceProvider, chainId: number) {
        this.pos = pos;
        this.gasPriceProvider = gasPriceProvider;
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
        const gasPrice = await this.gasPriceProvider.getGasPrice();
        const gasLimit = await this.pos.estimateGas.produceBlock(this.chainId);
        const overrides: Overrides = {
            nonce,
            gasPrice,
            gasLimit: gasLimit.mul(GAS_LIMIT_MULTIPLIER).div(100),
        };

        return this.pos.produceBlock(this.chainId, overrides);
    }
}

export class ProtocolImpl extends AbstractProtocolClient {
    private pos: PoS;

    private gasPriceProvider: GasPriceProvider;

    private chains: ChainClient[];

    constructor(
        pos: PoS,
        authManager: WorkerAuthManager,
        gasPriceProvider: GasPriceProvider
    ) {
        super(authManager, pos.address);
        this.pos = pos;
        this.gasPriceProvider = gasPriceProvider;
        this.chains = [];
    }

    async getNumberOfChains(): Promise<number> {
        const i = await this.pos.currentIndex();
        return i.toNumber();
    }

    getChain(index: number): ChainClient {
        // create chains on demand
        while (index >= this.chains.length) {
            const chain = new ChainImpl(
                this.pos,
                this.gasPriceProvider,
                this.chains.length
            );
            this.chains.push(chain);
        }
        return this.chains[index];
    }
}
