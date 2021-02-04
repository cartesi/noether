import { BigNumber } from "ethers";
import { GasPriceProvider } from "../gas-price-provider";
import log from "loglevel";
import axios from "axios";

interface GasStationOptions {
    url: string;
    key?: string;
    timeout: number;
    profile: string;
}
type GasStationOptionsReadOnly = Readonly<GasStationOptions>;
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
            log.info("gas station: fetched gas price", {
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
