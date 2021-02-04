import log from "loglevel";
import { expect } from "chai";
import sinon from "sinon";
import axios from "axios";
import GasStationGasPriceProvider from "./gas-station-gas-price-provider";

const sandbox = sinon.createSandbox();

describe("gas station gas price provider test suite", () => {
    afterEach(() => {
        sandbox.restore();
    });

    it("should provide gas price", async () => {
        const profile = "fast";
        const axiosGetSpy = sandbox.stub(axios, "get").returns(
            Promise.resolve({
                data: { [profile]: 450 },
            })
        );
        const gasPriceProvider = new GasStationGasPriceProvider({ profile });
        const gasPrice = await gasPriceProvider.getGasPrice();
        expect(axiosGetSpy.callCount).to.be.eq(1);
        expect(gasPrice.toString()).to.be.eq("45000000000");
    });

    it("should reject on api error", async () => {
        sandbox.stub(log, "error").returns();
        sandbox.stub(axios, "get").returns(Promise.reject("test error"));
        const provider = new GasStationGasPriceProvider();
        expect(provider.getGasPrice).to.throw;
    });

    it("should reject on missing price", async () => {
        sandbox.stub(log, "error").returns();
        sandbox.stub(axios, "get").returns(Promise.resolve({ data: {} }));
        const gasPriceProvider = new GasStationGasPriceProvider();
        expect(gasPriceProvider.getGasPrice).to.throw;
    });
});
