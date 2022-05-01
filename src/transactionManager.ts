// Copyright 2021 Cartesi Pte. Ltd.

// Licensed under the Apache License, Version 2.0 (the "License"); you may not use
// this file except in compliance with the License. You may obtain a copy of the
// License at http://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software distributed
// under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
// CONDITIONS OF ANY KIND, either express or implied. See the License for the
// specific language governing permissions and limitations under the License.

import { GasPriceProvider } from "./gas-price/gas-price-provider";
import { Overrides } from "@ethersproject/contracts";
import { BigNumber } from "ethers";
import { GAS_LIMIT_MULTIPLIER } from "./config";

export default class TransactionManager {
    private readonly gasPriceProvider: GasPriceProvider;

    constructor(gasPriceProvider: GasPriceProvider) {
        this.gasPriceProvider = gasPriceProvider;
    }

    async getOverrides(gasLimit?: BigNumber): Promise<Overrides> {
        const gasPrice = await this.gasPriceProvider.getGasPrice();
        const overrides: Overrides = {
            ...gasPrice,
        };
        if (gasLimit) {
            overrides.gasLimit = gasLimit.mul(GAS_LIMIT_MULTIPLIER).div(100);
        }
        return overrides;
    }
}
