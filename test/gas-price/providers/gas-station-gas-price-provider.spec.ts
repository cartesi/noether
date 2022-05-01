// Copyright 2020 Cartesi Pte. Ltd.

// Licensed under the Apache License, Version 2.0 (the "License"); you may not use
// this file except in compliance with the License. You may obtain a copy of the
// License at http://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software distributed
// under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
// CONDITIONS OF ANY KIND, either express or implied. See the License for the
// specific language governing permissions and limitations under the License.

import log from "loglevel";
import { expect } from "chai";
import sinon from "sinon";
import axios from "axios";
import GasStationGasPriceProvider, {
    GasStationProfile,
} from "../../../src/gas-price/providers/gas-station-gas-price-provider";

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
        const gasPriceProvider = new GasStationGasPriceProvider({
            profile,
            key: "test",
        });
        const { gasPrice } = await gasPriceProvider.getGasPrice();
        expect(axiosGetSpy.callCount).to.be.eq(1);
        expect(gasPrice.toString()).to.be.eq("45000000000");
    });

    it("should reject on api error", async () => {
        sandbox.stub(log, "error").returns();
        sandbox.stub(axios, "get").returns(Promise.reject("test error"));
        const provider = new GasStationGasPriceProvider();
        await expect(provider.getGasPrice()).to.be.rejected;
    });

    it("should reject on missing price", async () => {
        const profile: GasStationProfile = "fast";
        sandbox.stub(log, "error").returns();
        sandbox.stub(axios, "get").returns(Promise.resolve({ data: {} }));
        const gasPriceProvider = new GasStationGasPriceProvider({ profile });
        await expect(gasPriceProvider.getGasPrice()).to.be.rejectedWith(
            `gas station did not return a ${profile} price`
        );
    });
});
