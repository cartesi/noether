// Copyright 2021 Cartesi Pte. Ltd.

// Licensed under the Apache License, Version 2.0 (the "License"); you may not use
// this file except in compliance with the License. You may obtain a copy of the
// License at http://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software distributed
// under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
// CONDITIONS OF ANY KIND, either express or implied. See the License for the
// specific language governing permissions and limitations under the License.

import { expect } from "chai";
import { mock } from "sinon";
import { Network } from "@ethersproject/providers";
import { Signer, VoidSigner } from "ethers";
import { createPoS, createStaking } from "./pos";

import mainnet from "@cartesi/pos/export/abi/mainnet.json";
import goerli from "@cartesi/pos/export/abi/goerli.json";
import { PoS } from "@cartesi/pos";

describe("pos contracts test suite", () => {
    it("should create PoS mainnet contract", async () => {
        const network: Network = {
            chainId: 1,
            name: "mainnet",
        };
        const signer: Signer = new VoidSigner(
            "0x569369A96be963B7ef2bA01dA792EF95fDcCD5b0"
        );
        const pos = await createPoS(network, signer);
        expect(pos.address).to.equal(mainnet.contracts.PoS.address);
        expect(pos.signer).to.equal(signer);
    });

    it("should create PoS goerli contract", async () => {
        const network: Network = {
            chainId: 5,
            name: "goerli",
        };
        const signer: Signer = new VoidSigner(
            "0x569369A96be963B7ef2bA01dA792EF95fDcCD5b0"
        );
        const pos = await createPoS(network, signer);
        expect(pos.address).to.equal(goerli.contracts.PoS.address);
        expect(pos.signer).to.equal(signer);
    });
});
