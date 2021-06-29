// Copyright 2021 Cartesi Pte. Ltd.

// Licensed under the Apache License, Version 2.0 (the "License"); you may not use
// this file except in compliance with the License. You may obtain a copy of the
// License at http://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software distributed
// under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
// CONDITIONS OF ANY KIND, either express or implied. See the License for the
// specific language governing permissions and limitations under the License.

import { PoS } from "@cartesi/pos";
import { WorkerAuthManager } from "@cartesi/util";
import { BigNumber, ContractTransaction } from "ethers";

export interface ChainClient {
    isActive(): Promise<boolean>;
    getCurrentReward(): Promise<BigNumber>;
    getRewardManagerAddress(): Promise<string>;
    getStakedBalance(user: string): Promise<BigNumber>;
    getMaturingBalance(user: string): Promise<BigNumber>;
    getMaturingTimestamp(user: string): Promise<number>;
    getBlockInterval(user: string): Promise<BigNumber>;
    canProduceBlock(user: string, staked: BigNumber): Promise<boolean>;
    produceBlock(): Promise<ContractTransaction>;
}

export interface ProtocolClient {
    isAuthorized(): Promise<boolean>;
    getNumberOfChains(): Promise<number>;
    getChain(index: number): ChainClient;
    cycle(): Promise<boolean>;
}

export abstract class AbstractProtocolClient implements ProtocolClient {
    private authManager: WorkerAuthManager;

    protected pos: PoS;

    constructor(pos: PoS, authManager: WorkerAuthManager) {
        this.pos = pos;
        this.authManager = authManager;
    }

    async isAuthorized(): Promise<boolean> {
        const workerAddress = await this.authManager.signer.getAddress();
        return this.authManager.isAuthorized(workerAddress, this.pos.address);
    }

    async getNumberOfChains(): Promise<number> {
        const i = await this.pos.currentIndex();
        return i.toNumber();
    }

    abstract getChain(index: number): ChainClient;
    abstract cycle(): Promise<boolean>;
}

export * from "./client";
