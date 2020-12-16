#!/usr/bin/env node
// Copyright 2020 Cartesi Pte. Ltd.

// Licensed under the Apache License, Version 2.0 (the "License"); you may not use
// this file except in compliance with the License. You may obtain a copy of the
// License at http://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software distributed
// under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
// CONDITIONS OF ANY KIND, either express or implied. See the License for the
// specific language governing permissions and limitations under the License.

// import commander from "commander";
import { app } from "./src/app";

/*const program = commander.program;
program.option("-u, --url", "Node URL", "http://localhost:8545");
program.parse(process.argv);*/

const url = 'http://localhost:8545';
app(url);
