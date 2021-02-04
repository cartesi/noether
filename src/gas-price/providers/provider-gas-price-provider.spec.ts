import { expect } from "chai";
import { GAS_PRICE_MULTIPLIER } from "../../config";
import { BigNumber } from "ethers";
import { MockProvider } from "@ethereum-waffle/provider";
import ProviderGasPriceProvider from "./provider-gas-price-provider";

describe("provider gas price provider test suite", () => {
    it("should provide gas price", async () => {
        const networkGasPrice = BigNumber.from("20000000000");
        const provider = new MockProvider({
            ganacheOptions: {
                gasPrice: networkGasPrice.toString(),
            },
        });
        const gasPriceProvider = new ProviderGasPriceProvider(provider);
        const gasPrice = await gasPriceProvider.getGasPrice();
        expect(gasPrice.toString()).to.be.eq(networkGasPrice.toString());
    });

    it("should use provided multiplier", async () => {
        const networkGasPrice = BigNumber.from("20000000000");
        const provider = new MockProvider({
            ganacheOptions: {
                gasPrice: networkGasPrice.toString(),
            },
        });
        const gasPriceProvider = new ProviderGasPriceProvider(
            provider,
            GAS_PRICE_MULTIPLIER
        );
        const gasPrice = await gasPriceProvider.getGasPrice();
        const expectedGasPrice = BigNumber.from(networkGasPrice)
            .mul(GAS_PRICE_MULTIPLIER)
            .div(100);
        expect(gasPrice.toString()).to.be.eq(expectedGasPrice.toString());
    });
});
