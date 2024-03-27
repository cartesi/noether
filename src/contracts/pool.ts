// Copyright 2021 Cartesi Pte. Ltd.

// Licensed under the Apache License, Version 2.0 (the "License"); you may not use
// this file except in compliance with the License. You may obtain a copy of the
// License at http://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software distributed
// under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
// CONDITIONS OF ANY KIND, either express or implied. See the License for the
// specific language governing permissions and limitations under the License.

import { Signer } from "ethers";
import {
    StakingPoolImpl,
    StakingPoolImpl__factory,
} from "@cartesi/staking-pool";
import { ChainMap } from ".";

import goerli from "@cartesi/staking-pool/export/abi/goerli.json";
import sepolia from "@cartesi/staking-pool/export/abi/sepolia.json";
import localhost from "./localhost.json";

const abis: ChainMap = {
    11155111: sepolia,
    5: goerli,
    31337: localhost,
};

export const createStakingPool = async (
    address: string,
    signer: Signer
): Promise<StakingPoolImpl> => {
    return StakingPoolImpl__factory.connect(address, signer);
};
