// Copyright 2020 Cartesi Pte. Ltd.

// Licensed under the Apache License, Version 2.0 (the "License"); you may not use
// this file except in compliance with the License. You may obtain a copy of the
// License at http://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software distributed
// under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
// CONDITIONS OF ANY KIND, either express or implied. See the License for the
// specific language governing permissions and limitations under the License.

import { expect } from "chai";
import { GAS_PRICE_MULTIPLIER } from "../../../src/config";
import { BigNumber } from "ethers";
import { MockProvider } from "@ethereum-waffle/provider";
import ProviderGasPriceProvider from "../../../src/gas-price/providers/provider-gas-price-provider";

describe("provider gas price provider test suite", () => {
    it("should provide gas price", async () => {
        const networkGasPrice = BigNumber.from("20000000000");
        const provider = new MockProvider({
            ganacheOptions: {
                gasPrice: networkGasPrice.toString(),
            },
        });
        const gasPriceProvider = new ProviderGasPriceProvider(provider);
        const gasPrice = await gasPriceProvider.getGasPrice();
        expect(gasPrice.toString()).to.be.eq(networkGasPrice.toString());
    });

    it("should use provided multiplier", async () => {
        const networkGasPrice = BigNumber.from("20000000000");
        const provider = new MockProvider({
            ganacheOptions: {
                gasPrice: networkGasPrice.toString(),
            },
        });
        const gasPriceProvider = new ProviderGasPriceProvider(
            provider,
            GAS_PRICE_MULTIPLIER
        );
        const gasPrice = await gasPriceProvider.getGasPrice();
        const expectedGasPrice = BigNumber.from(networkGasPrice)
            .mul(GAS_PRICE_MULTIPLIER)
            .div(100);
        expect(gasPrice.toString()).to.be.eq(expectedGasPrice.toString());
    });
});
