// Copyright 2020 Cartesi Pte. Ltd.

// Licensed under the Apache License, Version 2.0 (the "License"); you may not use
// this file except in compliance with the License. You may obtain a copy of the
// License at http://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software distributed
// under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
// CONDITIONS OF ANY KIND, either express or implied. See the License for the
// specific language governing permissions and limitations under the License.

import { GasPriceOverrides, GasPriceProvider } from "../gas-price-provider";
import { BigNumber, utils } from "ethers";

export default class SpikeProtectionGasPriceProvider
    implements GasPriceProvider
{
    private readonly proxiedGasPriceProviders: GasPriceProvider;
    private readonly maxGasPrice: BigNumber;

    constructor(
        proxiedGasPriceProviders: GasPriceProvider,
        maxGasPriceGwei: number
    ) {
        this.proxiedGasPriceProviders = proxiedGasPriceProviders;
        this.maxGasPrice = utils.parseUnits(maxGasPriceGwei.toString(), "gwei");
    }

    getGasPrice = async (): Promise<GasPriceOverrides> => {
        const overrides = await this.proxiedGasPriceProviders.getGasPrice();
        let gasPrice: BigNumber;
        if ("maxFeePerGas" in overrides) {
            gasPrice = overrides.maxFeePerGas;
        } else {
            gasPrice = overrides.gasPrice;
        }
        if (gasPrice.lt(this.maxGasPrice)) {
            return overrides;
        }
        throw new Error(
            `Current gas price of ${utils.formatUnits(
                gasPrice,
                "gwei"
            )} Gwei higher than allowed ${utils.formatUnits(
                this.maxGasPrice,
                "gwei"
            )} Gwei`
        );
    };
}
