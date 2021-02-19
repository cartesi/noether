// Copyright 2021 Cartesi Pte. Ltd.

// Licensed under the Apache License, Version 2.0 (the "License"); you may not use
// this file except in compliance with the License. You may obtain a copy of the
// License at http://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software distributed
// under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
// CONDITIONS OF ANY KIND, either express or implied. See the License for the
// specific language governing permissions and limitations under the License.

import { expect } from "chai";
import { ChainMap, getAddress } from ".";

describe("contracts test suite", () => {
    it("should resolve address for existing contract", () => {
        const contract = "Test";
        const address = "0x569369A96be963B7ef2bA01dA792EF95fDcCD5b0";
        const chainId = 1;
        const map: ChainMap = {};
        map[chainId] = {
            name: "mainnet",
            chainId: chainId.toString(),
            contracts: {
                [contract]: {
                    abi: [],
                    address,
                },
            },
        };
        expect(getAddress(chainId, map, contract)).to.be.eql(address);
    });

    it("should not resolve address for unexisting chain", () => {
        const contract = "Test";
        const map = {};
        const chainId = 1;
        expect(() => getAddress(chainId, map, contract)).to.throw(
            `Unsupported chain '${chainId}' for contract ${contract}`
        );
    });

    it("should not resolve address for unexisting contract", () => {
        const contract = "Test";
        const map: ChainMap = {};
        const chainId = 1;
        const chainName = "mainnet";
        map[chainId] = {
            name: chainName,
            chainId: chainId.toString(),
            contracts: {},
        };
        expect(() => getAddress(chainId, map, contract)).to.throw(
            `No ${contract} deployed at network ${chainName} (${chainId})`
        );
    });
});
