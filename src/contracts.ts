// Copyright 2020 Cartesi Pte. Ltd.

// Licensed under the Apache License, Version 2.0 (the "License"); you may not use
// this file except in compliance with the License. You may obtain a copy of the
// License at http://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software distributed
// under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
// CONDITIONS OF ANY KIND, either express or implied. See the License for the
// specific language governing permissions and limitations under the License.

import { Network } from "@ethersproject/providers";
import log from "loglevel";
import {
    BlockSelector,
    BlockSelector__factory,
    PoS,
    PoS__factory,
    RewardManager,
    RewardManager__factory,
    Staking,
    StakingImpl__factory,
} from "@cartesi/pos";
import {
    WorkerManager,
    WorkerManagerAuthManagerImpl__factory,
} from "@cartesi/util";
import pos_mainnet from "@cartesi/pos/export/abi/mainnet.json";
import pos_goerli from "@cartesi/pos/export/abi/goerli.json";
import util_mainnet from "@cartesi/util/export/abi/mainnet.json";
import util_goerli from "@cartesi/util/export/abi/goerli.json";
import localhost from "./localhost.json";
import { Signer } from "ethers";

interface ContractAbi {
    address: string;
    abi: any[];
}

interface ContractMap {
    [name: string]: ContractAbi;
}

interface ChainAbi {
    name: string;
    chainId: string;
    contracts: ContractMap;
}

interface ChainMap {
    [chainId: number]: ChainAbi;
}

const posAbis: ChainMap = {
    1: pos_mainnet,
    5: pos_goerli,
    31337: localhost,
};

const utilAbis: ChainMap = {
    1: util_mainnet,
    5: util_goerli,
    31337: localhost,
};

const getAddress = (chainId: number, map: ChainMap, name: string): string => {
    const chain = map[chainId];
    if (!chain) {
        throw `Unsupported chain '${chainId}' for contract ${name}`;
    }

    const contract = chain.contracts[name];
    if (!contract) {
        throw `No ${name} deployed at network ${chain.name} (${chainId})`;
    }

    const address = contract.address;
    log.debug(
        `${name} resolved to address ${address} at network ${chain.name} (${chainId})`
    );
    return address;
};

export const createPoS = async (
    network: Network,
    signer: Signer
): Promise<PoS> => {
    const address = getAddress(network.chainId, posAbis, "PoS");
    return PoS__factory.connect(address, signer);
};

export const createWorkerManager = async (
    network: Network,
    signer: Signer
): Promise<WorkerManager> => {
    const address = getAddress(
        network.chainId,
        utilAbis,
        "WorkerManagerAuthManagerImpl"
    );
    return WorkerManagerAuthManagerImpl__factory.connect(address, signer);
};

export const createStaking = async (
    pos: PoS,
    chainId: number,
    signer: Signer
): Promise<Staking> => {
    const address = await pos.getStakingAddress(chainId);
    return StakingImpl__factory.connect(address, signer);
};

export const createBlockSelector = async (
    pos: PoS,
    chainId: number,
    signer: Signer
): Promise<BlockSelector> => {
    const address = await pos.getBlockSelectorAddress(chainId);
    return BlockSelector__factory.connect(address, signer);
};

export const createRewardManager = async (
    pos: PoS,
    chainId: number,
    signer: Signer
): Promise<RewardManager> => {
    const address = await pos.getRewardManagerAddress(chainId);
    return RewardManager__factory.connect(address, signer);
};
