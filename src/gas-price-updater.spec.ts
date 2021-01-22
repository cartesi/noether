import log from "loglevel";
import { expect } from "chai";
import sinon from "sinon";
import { updateGasPrice } from "./gas-price-updater";
import axios from "axios";
import { getGasPrice, setGasPrice } from "./gas-price";
import { GAS_MULTIPLIER } from "./config";
import { MockProvider } from "@ethereum-waffle/provider";
import { BigNumber } from "ethers";

const sandbox = sinon.createSandbox();

describe("gas price updater test suite", () => {
    afterEach(() => {
        sandbox.restore();
        setGasPrice(null);
    });

    it("should update gas price", async () => {
        sandbox.stub(axios, "get").returns(
            Promise.resolve({
                data: { average: 450 },
            })
        );
        await updateGasPrice();
        expect(getGasPrice()!.toString()).to.be.eq("45000000000");
        sandbox.restore();
        sandbox.stub(axios, "get").returns(
            Promise.resolve({
                data: { average: 750 },
            })
        );
        await updateGasPrice();
        expect(getGasPrice()!.toString()).to.be.eq("75000000000");
    });

    it("should not update gas price on api error", async () => {
        sandbox.stub(axios, "get").returns(
            Promise.resolve({
                data: { average: 450 },
            })
        );
        await updateGasPrice();
        expect(getGasPrice()!.toString()).to.be.eq("45000000000");
        sandbox.restore();
        sandbox.stub(log, "error").returns();
        sandbox.stub(axios, "get").returns(Promise.reject("test error"));
        await updateGasPrice();
        expect(getGasPrice()!.toString()).to.be.eq("45000000000");
    });

    it("should not update gas price on missing average", async () => {
        sandbox.stub(axios, "get").returns(
            Promise.resolve({
                data: { average: 450 },
            })
        );
        await updateGasPrice();
        expect(getGasPrice()!.toString()).to.be.eq("45000000000");
        sandbox.restore();
        sandbox.stub(log, "error").returns();
        sandbox.stub(axios, "get").returns(Promise.resolve({ data: {} }));
        await updateGasPrice();
        expect(getGasPrice()!.toString()).to.be.eq("45000000000");
    });

    it("should use provider gas price on api error", async () => {
        sandbox.stub(log, "error").returns();
        sandbox.stub(axios, "get").returns(Promise.resolve({ data: {} }));
        const networkGasPrice = BigNumber.from("20000000000");
        const provider = new MockProvider({
            ganacheOptions: {
                gasPrice: networkGasPrice.toString(),
            },
        });
        await updateGasPrice(provider);
        const expectedGasPrice = BigNumber.from(networkGasPrice)
            .mul(GAS_MULTIPLIER)
            .div(100);
        expect(getGasPrice()!.toString()).to.be.eq(expectedGasPrice.toString());
    });
});
