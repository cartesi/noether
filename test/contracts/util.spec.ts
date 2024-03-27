// Copyright 2021 Cartesi Pte. Ltd.

// Licensed under the Apache License, Version 2.0 (the "License"); you may not use
// this file except in compliance with the License. You may obtain a copy of the
// License at http://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software distributed
// under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
// CONDITIONS OF ANY KIND, either express or implied. See the License for the
// specific language governing permissions and limitations under the License.

import { expect } from "chai";
import { Network } from "@ethersproject/providers";
import { Signer, VoidSigner } from "ethers";
import { createWorkerManager } from "../../src/contracts/util";

import mainnet from "@cartesi/util/export/abi/mainnet.json";
import goerli from "@cartesi/util/export/abi/goerli.json";
import sepolia from "@cartesi/util/export/abi/sepolia.json";

describe("util contracts test suite", () => {
    it("should create mainnet contract", async () => {
        const network: Network = {
            chainId: 1,
            name: "mainnet",
        };
        const signer: Signer = new VoidSigner(
            "0x569369A96be963B7ef2bA01dA792EF95fDcCD5b0"
        );
        const workerManager = await createWorkerManager(network, signer);
        expect(workerManager.address).to.equal(
            mainnet.contracts.WorkerManagerAuthManagerImpl.address
        );
        expect(workerManager.signer).to.equal(signer);
    });

    it("should create goerli contract", async () => {
        const network: Network = {
            chainId: 5,
            name: "goerli",
        };
        const signer: Signer = new VoidSigner(
            "0x569369A96be963B7ef2bA01dA792EF95fDcCD5b0"
        );
        const workerManager = await createWorkerManager(network, signer);
        expect(workerManager.address).to.equal(
            goerli.contracts.WorkerManagerAuthManagerImpl.address
        );
        expect(workerManager.signer).to.equal(signer);
    });

    it("should create sepolia contract", async () => {
        const network: Network = {
            chainId: 11155111,
            name: "sepolia",
        };
        const signer: Signer = new VoidSigner(
            "0x569369A96be963B7ef2bA01dA792EF95fDcCD5b0"
        );
        const workerManager = await createWorkerManager(network, signer);
        expect(workerManager.address).to.equal(
            sepolia.contracts.WorkerManagerAuthManagerImpl.address
        );
        expect(workerManager.signer).to.equal(signer);
    });
});
