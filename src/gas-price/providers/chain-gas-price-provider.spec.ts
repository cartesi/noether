// Copyright 2020 Cartesi Pte. Ltd.

// Licensed under the Apache License, Version 2.0 (the "License"); you may not use
// this file except in compliance with the License. You may obtain a copy of the
// License at http://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software distributed
// under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
// CONDITIONS OF ANY KIND, either express or implied. See the License for the
// specific language governing permissions and limitations under the License.

import { expect } from "chai";
import sinon from "sinon";
import { GasPriceProvider } from "../gas-price-provider";
import { BigNumber } from "ethers";
import ChainGasPriceProvider from "./chain-gas-price-provider";
import log from "loglevel";

const sandbox = sinon.createSandbox();

class gasProviderMock implements GasPriceProvider {
    private readonly gasPrice: BigNumber;
    private readonly shouldReject: boolean;

    constructor(gasPrice: BigNumber, shouldReject = false) {
        this.gasPrice = gasPrice;
        this.shouldReject = shouldReject;
    }

    getGasPrice(): Promise<BigNumber> {
        if (this.shouldReject) return Promise.reject("test rejection");
        return Promise.resolve(this.gasPrice);
    }
}

describe("chain gas price provider test suite", () => {
    afterEach(() => {
        sandbox.restore();
    });

    it("should provide gas price", async () => {
        sandbox.stub(log, "error").returns();
        const gasPriceProvider1 = new gasProviderMock(BigNumber.from(1), true);
        const gasPriceProvider2 = new gasProviderMock(BigNumber.from(2));
        const gasPriceProvider3 = new gasProviderMock(BigNumber.from(3));
        const gasPriceProviders = [
            gasPriceProvider1,
            gasPriceProvider2,
            gasPriceProvider3,
        ];
        const gasPriceProvider = new ChainGasPriceProvider(gasPriceProviders);
        expect(gasPriceProvider.chain).to.be.eq(gasPriceProviders);
        const gasPrice = await gasPriceProvider.getGasPrice();
        expect(gasPrice.toString()).to.be.eq("2");
    });
});
