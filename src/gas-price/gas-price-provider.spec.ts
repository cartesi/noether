// Copyright 2020 Cartesi Pte. Ltd.

// Licensed under the Apache License, Version 2.0 (the "License"); you may not use
// this file except in compliance with the License. You may obtain a copy of the
// License at http://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software distributed
// under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
// CONDITIONS OF ANY KIND, either express or implied. See the License for the
// specific language governing permissions and limitations under the License.

import { expect } from "chai";
import { GAS_STATION_API_CHAIN_ID } from "../config";
import { MockProvider } from "@ethereum-waffle/provider";
import { createGasPriceProvider } from "./gas-price-provider";

const provider = new MockProvider();

describe("gas price provider test suite", () => {
    it("should create gas price provider without gas station", async () => {
        const gasPriceProvider = createGasPriceProvider(provider);
        expect(gasPriceProvider.getGasPriceProviders().length).to.be.eq(1);
    });

    it("should create gas price provider with gas station", async () => {
        const gasPriceProvider = createGasPriceProvider(
            provider,
            GAS_STATION_API_CHAIN_ID
        );
        expect(gasPriceProvider.getGasPriceProviders().length).to.be.eq(2);
    });
});
