// Copyright 2020 Cartesi Pte. Ltd.

// Licensed under the Apache License, Version 2.0 (the "License"); you may not use
// this file except in compliance with the License. You may obtain a copy of the
// License at http://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software distributed
// under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
// CONDITIONS OF ANY KIND, either express or implied. See the License for the
// specific language governing permissions and limitations under the License.

import axios from "axios";
import chalk from "chalk";
import log from "loglevel";

let first = true;

// structure of Auth token (JWT)
interface JWT {
    token: string;
    access_token: string;
    expires_in: number;
    issued_at: string;
}

// even public images need authentication (no user/password though)
const auth = async (image: string): Promise<JWT> => {
    return axios
        .get<JWT>(`https://auth.docker.io/token`, {
            params: {
                scope: `repository:${image}:pull`,
                service: "registry.docker.io",
            },
        })
        .then((r) => r.data);
};

// get image digest using Docker Registry HTTP API V2
// https://docs.docker.com/registry/spec/api/#manifest
const fetchVersion = async (
    image: string,
    tag: string = "latest"
): Promise<string> => {
    // get access token (even for public images)
    const jwt = await auth(image);

    // query manifest using HEAD (digest is in response header)
    const response = await axios.head(
        `https://registry.hub.docker.com/v2/${image}/manifests/${tag}`,
        {
            headers: {
                Accept: "application/vnd.docker.distribution.manifest.v2+json",
                Authorization: `Bearer ${jwt.token}`,
            },
        }
    );
    return response.headers["docker-content-digest"];
};

export const checkVersion = async () => {
    // expect a VERSION env var injected with the output of the following command:
    // docker images --no-trunc --quiet cartesi/noether:latest
    try {
        const digest = process.env.VERSION;
        if (digest) {
            const image = "cartesi/noether";
            const tag = "latest";

            // fetch version from docker hub
            const latest = await fetchVersion(image, tag);
            if (latest && digest !== latest) {
                log.warn(
                    `running version ${digest}, latest ${latest}, stop your node, do a "${chalk.blue(
                        `docker pull ${image}:${tag}`
                    )}" and restart`
                );
            }
        } else {
            if (first) {
                log.warn(
                    `no VERSION environment variable set, turning off node version checking`
                );
                first = false;
            }
        }
    } catch (e) {
        log.error(`error checking node version`, e);
    }
};
