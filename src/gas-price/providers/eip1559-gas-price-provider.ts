// Copyright 2020 Cartesi Pte. Ltd.

// Licensed under the Apache License, Version 2.0 (the "License"); you may not use
// this file except in compliance with the License. You may obtain a copy of the
// License at http://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software distributed
// under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
// CONDITIONS OF ANY KIND, either express or implied. See the License for the
// specific language governing permissions and limitations under the License.

import { BigNumber } from "ethers";
import { Provider } from "@ethersproject/abstract-provider";
import { suggestFees } from "eip1559-fee-suggestions-ethers";
import { JsonRpcProvider } from "@ethersproject/providers";
import {
    GasPriceOverrideEip1559,
    GasPriceProvider,
} from "../gas-price-provider";

export type Eip1559Profile = "urgent" | "fast" | "normal";

export default class Eip1559GasPriceProvider implements GasPriceProvider {
    constructor(
        private readonly provider: Provider,
        private readonly profile: Eip1559Profile
    ) {
        this.provider = provider;
        this.profile = profile;
    }

    getGasPrice = async (): Promise<GasPriceOverrideEip1559> => {
        const suggestedFee = await suggestFees(
            this.provider as JsonRpcProvider
        );
        const maxPriorityFeePerGas = BigNumber.from(
            suggestedFee.maxPriorityFeeSuggestions[this.profile]
        );
        const maxFeePerGas = maxPriorityFeePerGas.add(
            suggestedFee.baseFeeSuggestion
        );
        return {
            maxFeePerGas: maxFeePerGas,
            maxPriorityFeePerGas: maxPriorityFeePerGas,
        };
    };
}
