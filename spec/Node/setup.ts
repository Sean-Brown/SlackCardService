/// <reference path="../../typings/index.d.ts" />

import {setup} from "../../app";
import {Express} from "express";
import * as Mocha from "mocha";
import {readConfigFromEnv} from "../db/postgres/integration/setEnv";

var Q = require("q");

var express = require("express");

export interface TestClass extends Mocha.ITest {
    app: Express;
}

export function createNewServer(test: TestClass): Q.Promise<void> {
    return new Q.Promise((resolve, reject) => {
        readConfigFromEnv();
        setup(express())
            .then((app:Express) => {
                test.app = app;
                resolve();
            })
            .catch(() => {
                test.app = null;
                reject();
            });
    });
}
