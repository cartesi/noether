// Copyright 2021 Cartesi Pte. Ltd.

// Licensed under the Apache License, Version 2.0 (the "License"); you may not use
// this file except in compliance with the License. You may obtain a copy of the
// License at http://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software distributed
// under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
// CONDITIONS OF ANY KIND, either express or implied. See the License for the
// specific language governing permissions and limitations under the License.

import { expect } from "chai";
import { MockProvider } from "@ethereum-waffle/provider";

import { GAS_STATION_API_CHAIN_ID } from "../../src/config";
import { createGasPriceProvider } from "../../src/gas-price/gas-price-provider";
import ChainGasPriceProvider from "../../src/gas-price/providers/chain-gas-price-provider";
import ProviderGasPriceProvider from "../../src/gas-price/providers/provider-gas-price-provider";

describe("gas price provider test suite", () => {
    it("should create gas price provider without gas station", async () => {
        const provider = new MockProvider();
        const gasPriceProvider = await createGasPriceProvider(
            provider,
            "eth-provider"
        );
        expect(gasPriceProvider).to.be.an.instanceof(ProviderGasPriceProvider);
    });

    it("should create gas price provider with gas station", async () => {
        const provider = new MockProvider();
        provider.getNetwork = () =>
            Promise.resolve({
                chainId: GAS_STATION_API_CHAIN_ID,
                name: "homestead",
            });

        const gasPriceProvider = await createGasPriceProvider(provider, "fast");
        expect(gasPriceProvider).to.be.an.instanceof(ChainGasPriceProvider);
        expect(
            (gasPriceProvider as ChainGasPriceProvider).chain.length
        ).to.be.eq(2);
    });

    it("should not use gas station when chain id is not GAS_STATION_API_CHAIN_ID", async () => {
        const provider = new MockProvider();
        const gasPriceProvider = await createGasPriceProvider(provider, "fast");
        expect(gasPriceProvider).to.be.an.instanceof(ProviderGasPriceProvider);
    });
});
