// Copyright 2021 Cartesi Pte. Ltd.

// Licensed under the Apache License, Version 2.0 (the "License"); you may not use
// this file except in compliance with the License. You may obtain a copy of the
// License at http://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software distributed
// under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
// CONDITIONS OF ANY KIND, either express or implied. See the License for the
// specific language governing permissions and limitations under the License.

import log from "loglevel";

export interface ContractAbi {
    address: string;
    abi: any[];
}

export interface ContractMap {
    [name: string]: ContractAbi;
}

export interface ChainAbi {
    name: string;
    chainId: string;
    contracts: ContractMap;
}

export interface ChainMap {
    [chainId: number]: ChainAbi;
}

export const getAddress = (
    chainId: number,
    map: ChainMap,
    name: string
): string => {
    const chain = map[chainId];
    if (!chain) {
        throw `Unsupported chain '${chainId}' for contract ${name}`;
    }

    const contract = chain.contracts[name];
    if (!contract) {
        throw `No ${name} deployed at network ${chain.name} (${chainId})`;
    }

    const address = contract.address;
    log.debug(`${name}(${address})`);
    return address;
};

export * from "./util";
export * from "./pos";
export * as pos1 from "./pos-1.0";
