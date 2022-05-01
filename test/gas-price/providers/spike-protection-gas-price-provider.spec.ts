// Copyright 2021 Cartesi Pte. Ltd.

// Licensed under the Apache License, Version 2.0 (the "License"); you may not use
// this file except in compliance with the License. You may obtain a copy of the
// License at http://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software distributed
// under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
// CONDITIONS OF ANY KIND, either express or implied. See the License for the
// specific language governing permissions and limitations under the License.

import chain, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import sinon from "sinon";
import {
    GasPriceOverride,
    GasPriceOverrideEip1559,
    GasPriceOverrides,
    GasPriceProvider,
} from "../../../src/gas-price/gas-price-provider";
import { BigNumber, utils } from "ethers";
import ChainGasPriceProvider from "../../../src/gas-price/providers/chain-gas-price-provider";
import log from "loglevel";
import SpikeProtectionGasPriceProvider from "../../../src/gas-price/providers/spike-protection-gas-price-provider";

chain.use(chaiAsPromised);
const sandbox = sinon.createSandbox();

class gasProviderMock implements GasPriceProvider {
    private readonly gasPrice: BigNumber;
    private readonly isEip1559: boolean;

    constructor(gasPrice: BigNumber, isEip1559 = false) {
        this.gasPrice = gasPrice;
        this.isEip1559 = isEip1559;
    }

    async getGasPrice(): Promise<GasPriceOverrides> {
        if (this.isEip1559) {
            const maxPriorityFeePerGas = utils.parseUnits("2", "gwei");
            const maxFeePerGas = maxPriorityFeePerGas.add(this.gasPrice);
            return {
                maxFeePerGas: maxFeePerGas,
                maxPriorityFeePerGas: maxPriorityFeePerGas,
            };
        }
        return { gasPrice: this.gasPrice };
    }
}

describe("spike protection gas price provider test suite", () => {
    afterEach(() => {
        sandbox.restore();
    });

    it("should provide gas price when under threshold", async () => {
        sandbox.stub(log, "error").returns();
        const currentGasPrice = utils.parseUnits("50", "gwei");
        const gasPriceProvider1 = new SpikeProtectionGasPriceProvider(
            new gasProviderMock(currentGasPrice, false),
            100
        );
        const gasPriceProvider2 = new SpikeProtectionGasPriceProvider(
            new gasProviderMock(currentGasPrice, true),
            100
        );
        const gasPrice1 =
            (await gasPriceProvider1.getGasPrice()) as GasPriceOverride;
        const gasPrice2 =
            (await gasPriceProvider2.getGasPrice()) as GasPriceOverrideEip1559;
        expect(gasPrice1.gasPrice).to.be.deep.eq(currentGasPrice);
        expect(gasPrice2.maxFeePerGas).to.be.deep.eq(
            currentGasPrice.add(gasPrice2.maxPriorityFeePerGas)
        );
    });

    it("should reject when over threshold", async () => {
        sandbox.stub(log, "error").returns();
        const currentGasPrice = utils.parseUnits("50", "gwei");
        const gasPriceProvider1 = new SpikeProtectionGasPriceProvider(
            new gasProviderMock(currentGasPrice, false),
            50
        );
        const gasPriceProvider2 = new SpikeProtectionGasPriceProvider(
            new gasProviderMock(currentGasPrice, true),
            50
        );
        await expect(gasPriceProvider1.getGasPrice()).to.be.rejected;
        await expect(gasPriceProvider2.getGasPrice()).to.be.rejected;
    });
});
