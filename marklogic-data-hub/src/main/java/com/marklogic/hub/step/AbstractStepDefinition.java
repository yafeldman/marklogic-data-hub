/*
 * Copyright 2012-2019 MarkLogic Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package com.marklogic.hub.step;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.databind.JsonNode;
import com.marklogic.hub.step.impl.Step;
import com.marklogic.hub.util.json.JSONObject;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public abstract class AbstractStepDefinition implements StepDefinition {
    private final static int DEFAULT_BATCH_SIZE = 100;
    private final static int DEFAULT_THREAD_COUNT = 4;

    private String language;
    private String name;
    private String description;
    private StepDefinitionType type;
    private Integer version;
    private Map<String, Object> options;
    private JsonNode customHook;
    private String modulePath;
    @JsonIgnore
    private String identifier;
    private int retryLimit;
    private int batchSize;
    private int threadCount;

    protected AbstractStepDefinition() {
        language = "zxx";
        version = 1;

        options = new HashMap<>();
        List<String> collectionName = new ArrayList<>();
        collectionName.add(name);
        options.put("collections", collectionName);

        customHook = new JSONObject().jsonNode();
        retryLimit = 0;
        batchSize = DEFAULT_BATCH_SIZE;
        threadCount = DEFAULT_THREAD_COUNT;
    }


    public String getLanguage() {
        return language;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public StepDefinitionType getType() {
        return type;
    }

    public void setType(StepDefinitionType type) {
        this.type = type;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Integer getVersion() {
        return version;
    }

    public void setVersion(Integer version) {
        this.version = version;
    }

    public Map<String, Object> getOptions() {
        return options;
    }

    public void setOptions(Map<String, Object> options) {
        this.options = options;
    }

    public String getModulePath() {
        return modulePath;
    }

    public void setModulePath(String path) {
        this.modulePath = path;
    }

    public JsonNode getCustomHook() {
        return customHook;
    }

    public void setCustomHook(JsonNode hookObj) {
        this.customHook = hookObj;
    }

    public String getSourceQuery() {
        return identifier;
    }

    public void setSourceQuery(String identifier) {
        this.identifier = identifier;
    }

    public int getRetryLimit() {
        return retryLimit;
    }

    public void setRetryLimit(int retryLimit) {
        this.retryLimit = retryLimit;
    }

    public int getBatchSize() {
        return batchSize;
    }

    public void setBatchSize(int batchSize) {
        this.batchSize = batchSize;
    }

    public int getThreadCount() {
        return threadCount;
    }

    public void setThreadCount(int threadCount) {
        this.threadCount = threadCount;
    }

    public void incrementVersion() {
        setVersion(getVersion() + 1);
    }

    @Override
    public void deserialize(JsonNode json) {
        JSONObject jsonObject = new JSONObject(json);

        if (jsonObject.isExist("name")) {
            setName(jsonObject.getString("name"));
        }

        if (jsonObject.isExist("description")) {
            setDescription(jsonObject.getString("description"));
        }

        if (jsonObject.isExist("type")) {
            setType(StepDefinitionType.getStepDefinitionType(jsonObject.getString("type")));
        }

        if (jsonObject.isExist("version")) {
            setVersion(jsonObject.getInt("version"));
        }

        Map<String, Object> options = jsonObject.getMap("options");
        if (!options.isEmpty()) {
            setOptions(jsonObject.getMap("options"));
        }

        if (jsonObject.isExist("customHook")) {
            setCustomHook(jsonObject.getNode("customHook"));
        }

        if (jsonObject.isExist("modulePath")) {
            setModulePath(jsonObject.getString("modulePath"));
        }

        if (this.options != null) {
            Object identifier = this.options.get("identifier");
            if (identifier != null) {
                setSourceQuery(identifier.toString());
            }
        }

        if (jsonObject.isExist("retryLimit")) {
            setRetryLimit(jsonObject.getInt("retryLimit"));
        }

        if (jsonObject.isExist("batchSize")) {
            setBatchSize(jsonObject.getInt("batchSize"));
        }

        if (jsonObject.isExist("threadCount")) {
            setThreadCount(jsonObject.getInt("threadCount"));
        }
    }

    public Step transformToStep(String stepName, StepDefinition stepDefinition, Step step) {
        step.setStepDefinitionName(stepDefinition.getName());
        step.setStepDefinitionType(stepDefinition.getType());
        step.setName(stepName);
        step.setThreadCount(stepDefinition.getThreadCount());
        step.setBatchSize(stepDefinition.getBatchSize());
        step.setRetryLimit(stepDefinition.getRetryLimit());
        step.setModulePath(stepDefinition.getModulePath());
        step.setCustomHook(stepDefinition.getCustomHook());
        step.setOptions(stepDefinition.getOptions());
        step.setDescription(stepDefinition.getDescription());

        return step;
    }

    public StepDefinition transformFromStep(StepDefinition stepDefinition, Step step) {
        stepDefinition.setName(step.getName());
        stepDefinition.setBatchSize(step.getBatchSize());
        stepDefinition.setDescription(step.getDescription());
        stepDefinition.setThreadCount(step.getThreadCount());
        stepDefinition.setOptions(step.getOptions());
        stepDefinition.setModulePath(step.getModulePath());
        stepDefinition.setCustomHook(step.getCustomHook());

        return stepDefinition;
    }
}
