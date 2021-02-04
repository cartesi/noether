import { expect } from "chai";
import { GAS_STATION_API_CHAIN_ID } from "../config";
import { MockProvider } from "@ethereum-waffle/provider";
import { createGasPriceProvider } from "./gas-price-provider";

const provider = new MockProvider();

describe("gas price provider test suite", () => {
    it("should create gas price provider without gas station", async () => {
        const gasPriceProvider = createGasPriceProvider(provider);
        expect(gasPriceProvider.getGasPriceProviders().length).to.be.eq(1);
    });

    it("should create gas price provider with gas station", async () => {
        const gasPriceProvider = createGasPriceProvider(
            provider,
            GAS_STATION_API_CHAIN_ID
        );
        expect(gasPriceProvider.getGasPriceProviders().length).to.be.eq(2);
    });
});
