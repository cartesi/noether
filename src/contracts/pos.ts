// Copyright 2021 Cartesi Pte. Ltd.

// Licensed under the Apache License, Version 2.0 (the "License"); you may not use
// this file except in compliance with the License. You may obtain a copy of the
// License at http://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software distributed
// under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
// CONDITIONS OF ANY KIND, either express or implied. See the License for the
// specific language governing permissions and limitations under the License.

import { Signer } from "ethers";
import { Network } from "@ethersproject/providers";
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
import { ChainMap, getAddress } from ".";

import mainnet from "@cartesi/pos/export/abi/mainnet.json";
import goerli from "@cartesi/pos/export/abi/goerli.json";
import localhost from "./localhost.json";

const abis: ChainMap = {
    1: mainnet,
    5: goerli,
    31337: localhost,
};

export const createPoS = async (
    network: Network,
    signer: Signer
): Promise<PoS> => {
    const address = getAddress(network.chainId, abis, "PoS");
    return PoS__factory.connect(address, signer);
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
