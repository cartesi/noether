// Copyright 2020 Cartesi Pte. Ltd.

// Licensed under the Apache License, Version 2.0 (the "License"); you may not use
// this file except in compliance with the License. You may obtain a copy of the
// License at http://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software distributed
// under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
// CONDITIONS OF ANY KIND, either express or implied. See the License for the
// specific language governing permissions and limitations under the License.

import { BigNumberish } from "ethers";
import { formatUnits } from "ethers/lib/utils";
import log from "loglevel";
import humanizeDuration from "humanize-duration";

export const sleep = (timeout: number) => {
    log.debug(
        `sleeping for ${humanizeDuration(timeout, { maxDecimalPoints: 0 })}`
    );
    return new Promise((resolve) => setTimeout(resolve, timeout));
};

export const formatCTSI = (value: BigNumberish) => {
    return formatUnits(value, 18);
};
