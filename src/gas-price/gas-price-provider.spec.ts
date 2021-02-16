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
import rewire from "rewire";

const gasPriceProviderModule = rewire("./gas-price-provider");
const createGasPriceProvider = gasPriceProviderModule.createGasPriceProvider;
const provider = new MockProvider();

describe("gas price provider test suite", () => {
    it("should create gas price provider without gas station", () => {
        gasPriceProviderModule.__with__({
            // default Ganache chain id is 1337
            gasStationChainId: 1337,
        })(async () => {
            const gasPriceProvider = await createGasPriceProvider(
                provider,
                "eth-provider"
            );
            expect(gasPriceProvider.chain.length).to.be.eq(1);
        });
    });

    it("should create gas price provider with gas station", () => {
        gasPriceProviderModule.__with__({
            // default Ganache chain id is 1337
            gasStationChainId: 1337,
        })(async () => {
            const gasPriceProvider = await createGasPriceProvider(
                provider,
                "fast"
            );
            expect(gasPriceProvider.chain.length).to.be.eq(2);
        });
    });

    it("should not use gas station when chain id is not GAS_STATION_API_CHAIN_ID", () => {
        gasPriceProviderModule.__with__({
            gasStationChainId: 1,
        })(async () => {
            const gasPriceProvider = await createGasPriceProvider(
                provider,
                "fast"
            );
            expect(gasPriceProvider.chain.length).to.be.eq(1);
        });
    });
});
