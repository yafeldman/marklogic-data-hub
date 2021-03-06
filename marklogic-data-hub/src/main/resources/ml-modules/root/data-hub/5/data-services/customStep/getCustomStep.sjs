/**
 Copyright (c) 2021 MarkLogic Corporation

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */
'use strict';

xdmp.securityAssert("http://marklogic.com/data-hub/privileges/read-custom", "execute");

const Artifacts = require('/data-hub/5/artifacts/core.sjs')
var stepName;

let dataHubOptions = ["sourceQuery", "sourceQueryIsScript", "constrainSourceQueryToJob", "provenanceGranularityLevel", "acceptsBatch",
  "stepUpdate", "collections" , "additionalCollections", "permissions", "outputFormat", "sourceDatabase", "targetDatabase", "targetEntityType"];
let additionalSettings = {};
let step = Artifacts.getArtifact("custom", stepName)
let options = Artifacts.convertStepReferenceToInlineStep(step.stepId).options;
for (let key of Object.keys(options)) {
  if(!dataHubOptions.includes(key)){
    additionalSettings[key] = options[key];
  }
}
step["additionalSettings"] = additionalSettings;
step;
