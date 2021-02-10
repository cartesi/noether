// Copyright 2021 Cartesi Pte. Ltd.

// Licensed under the Apache License, Version 2.0 (the "License"); you may not use
// this file except in compliance with the License. You may obtain a copy of the
// License at http://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software distributed
// under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
// CONDITIONS OF ANY KIND, either express or implied. See the License for the
// specific language governing permissions and limitations under the License.

import { WorkerAuthManager } from "@cartesi/util";
import { BigNumber, ContractTransaction } from "ethers";

export interface ChainClient {
    isActive(): Promise<boolean>;
    getCurrentReward(): Promise<BigNumber>;
    getStakedBalance(user: string): Promise<BigNumber>;
    getMaturingBalance(user: string): Promise<BigNumber>;
    getMaturingTimestamp(user: string): Promise<number>;
    getBlockInterval(user: string): Promise<BigNumber>;
    canProduceBlock(user: string, staked: BigNumber): Promise<boolean>;
    produceBlock(): Promise<ContractTransaction>;
}

export interface ProtocolClient {
    authorize(address: string): Promise<boolean>;
    getNumberOfChains(): Promise<number>;
    getChain(index: number): ChainClient;
}

export abstract class AbstractProtocolClient {
    private authManager: WorkerAuthManager;

    private address: string;

    constructor(authManager: WorkerAuthManager, address: string) {
        this.authManager = authManager;
        this.address = address;
    }

    async authorize(address: string): Promise<boolean> {
        return this.authManager.isAuthorized(address, this.address);
    }
}

export * from "./client";
export * as client1 from "./client1";
