// Copyright 2021 Cartesi Pte. Ltd.

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
import axios from "axios";

// profiles according to gas station API at https://docs.ethgasstation.info/gas-price
export type GasStationProfile = "fast" | "fastest" | "safeLow" | "average";

interface GasStationOptions {
    url: string;
    key?: string;
    timeout: number;
    profile: GasStationProfile;
}
export type GasStationOptionsReadOnly = Readonly<GasStationOptions>;
export type GasStationGasPriceProviderOptions = Partial<GasStationOptions>;

export default class GasStationGasPriceProvider implements GasPriceProvider {
    private readonly opts: GasStationOptionsReadOnly;

    constructor(opts: GasStationGasPriceProviderOptions = {}) {
        this.opts = {
            url: "https://ethgasstation.info/json/ethgasAPI.json",
            timeout: 10000,
            profile: "fast",
            ...opts,
        };
    }

    getGasPrice = async (): Promise<BigNumber> => {
        try {
            const gasStationPrice = await this.requestGasStationPrice();
            const gasPrice = this.gasStationPriceToBigNumber(gasStationPrice);
            log.debug("gas station: fetched gas price", {
                gasPrice: gasPrice.toString(),
            });
            return gasPrice;
        } catch (error) {
            log.error("gas station: failed to retrieve gas  price", { error });
            throw error;
        }
    };

    private requestGasStationPrice = async (): Promise<number> => {
        let url = this.opts.url;
        if (this.opts.key) url += `?api-key=${this.opts.key}`;
        const response = await axios.get(url, {
            timeout: this.opts.timeout,
        });
        const { data } = response;
        const gasStationPrice = data[this.opts.profile];
        if (typeof gasStationPrice !== "number") {
            throw new Error(
                `gas station did not return a ${this.opts.profile} price`
            );
        }
        return gasStationPrice;
    };

    private gasStationPriceToBigNumber = (
        gasStationPrice: number
    ): BigNumber => {
        return (
            BigNumber.from(gasStationPrice)
                // gas price from Gas Station returned in Gwei/10
                // so multiply it by 10^8 to convert it to wei.
                .mul(10 ** 8)
        );
    };
}
