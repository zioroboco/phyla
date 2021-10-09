#!/usr/bin/env node

import * as begat from "begat"
import { clone } from "begat/std/clone"
import { diff } from "begat/std/diff"

import { license } from "begat-example-generator"

export default begat
  .pipeline([clone, license])
  .withOptions({
    author: "Raymond Luxury-Yacht <rayly@hotmail.com>",
    license: "MIT",
  })
  .then(diff)
