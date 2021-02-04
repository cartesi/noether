// Copyright 2020 Cartesi Pte. Ltd.

// Licensed under the Apache License, Version 2.0 (the "License"); you may not use
// this file except in compliance with the License. You may obtain a copy of the
// License at http://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software distributed
// under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
// CONDITIONS OF ANY KIND, either express or implied. See the License for the
// specific language governing permissions and limitations under the License.

import { BigNumber } from "ethers";
import { GasPriceProvider } from "../gas-price-provider";
import log from "loglevel";

export default class ChainGasPriceProvider implements GasPriceProvider {
    private readonly gasPriceProviders: Array<GasPriceProvider>;

    constructor(gasPriceProviders: Array<GasPriceProvider>) {
        this.gasPriceProviders = gasPriceProviders;
    }

    get chain(): Array<GasPriceProvider> {
        return this.gasPriceProviders;
    }

    getGasPrice = async (): Promise<BigNumber> => {
        for (const gasPriceProvider of this.gasPriceProviders) {
            try {
                return await gasPriceProvider.getGasPrice();
            } catch (error) {
                log.error(
                    `failed to retrieve gas price from ${gasPriceProvider.constructor.name}`,
                    { error }
                );
            }
        }
        throw new Error(
            "no valid gas price returned from the chain of gas price providers"
        );
    };
}
