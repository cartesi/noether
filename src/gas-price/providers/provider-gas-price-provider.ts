import { BigNumber } from "ethers";
import { GasPriceProvider } from "../gas-price-provider";
import { Provider } from "@ethersproject/abstract-provider";

export default class ProviderGasPriceProvider implements GasPriceProvider {
    private readonly provider: Provider;
    private readonly gasPriceMultiplier: number;

    constructor(provider: Provider, gasPriceMultiplier = 100) {
        this.provider = provider;
        this.gasPriceMultiplier = gasPriceMultiplier;
    }

    getGasPrice = async (): Promise<BigNumber> => {
        return this.fetchGasStationPrice();
    };

    private fetchGasStationPrice = async (): Promise<BigNumber> => {
        const currentGasPrice = await this.provider.getGasPrice();
        return currentGasPrice.mul(this.gasPriceMultiplier).div(100);
    };
}
