import { BigNumber } from "ethers";
import { GasPriceProvider } from "../gas-price-provider";
import log from "loglevel";

export default class ChainGasPriceProvider implements GasPriceProvider {
    private readonly gasPriceProviders: Array<GasPriceProvider>;

    constructor(gasPriceProviders: Array<GasPriceProvider>) {
        this.gasPriceProviders = gasPriceProviders;
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

    getGasPriceProviders = (): Array<GasPriceProvider> => {
        return this.gasPriceProviders;
    };
}
