package com.marklogic.hub.hubcentral.migration;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
//import com.marklogic.client.document.JSONDocumentManager;
import com.marklogic.client.eval.EvalResult;
import com.marklogic.client.eval.EvalResultIterator;
import com.marklogic.hub.*;
import com.marklogic.hub.dataservices.FlowService;
import com.marklogic.hub.flow.Flow;
import com.marklogic.hub.flow.FlowInputs;
import com.marklogic.hub.flow.FlowRunner;
import com.marklogic.hub.flow.RunFlowResponse;
import com.marklogic.hub.impl.FlowManagerImpl;
import com.marklogic.hub.impl.MappingManagerImpl;
import com.marklogic.hub.mapping.Mapping;
import com.marklogic.hub.step.RunStepResponse;
import com.marklogic.hub.step.StepDefinition;
import org.apache.commons.io.FileUtils;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ClassPathResource;

import java.io.File;
import java.io.IOException;
import java.nio.file.Path;
import java.util.*;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.*;

class AllStepsReferencedTest extends AbstractHubCoreTest {

    ObjectMapper mapper = new ObjectMapper();

    @Autowired
    FlowRunner flowRunner;

    @BeforeEach
    void setUp() {
        String folderInClasspath = "test-projects/all-steps-referenced";
        installProjectInFolder(folderInClasspath);
    }

    @Test
    void validateMigratedFlowsAndSteps() {
        HubConfig hubConfig = getHubConfig();

        FlowMigrator flowMigrator = new FlowMigrator(hubConfig);
        flowMigrator.migrateFlows();

        validateFullyReferencedFlowsAndSteps();
    }

    @Test
    void migrateAndRunCompleteFlow() {
        HubConfig hubConfig = getHubConfig();

        FlowMigrator flowMigrator = new FlowMigrator(hubConfig);
        flowMigrator.migrateFlows();
        installUserArtifacts();

        RunFlowResponse flowResponse = flowRunner.runFlow(new FlowInputs("CurateCustomerJSON", "1", "2", "3", "4"));
        flowRunner.awaitCompletion();
        RunStepResponse runStepResponse = flowResponse.getStepResponses().get("1");
        assertTrue(runStepResponse.isSuccess(), "Ingestion step failed!");
        runStepResponse = flowResponse.getStepResponses().get("2");
        assertTrue(runStepResponse.isSuccess(), "Mapping step failed!");
        runStepResponse = flowResponse.getStepResponses().get("3");
        assertTrue(runStepResponse.isSuccess(), "Matching step failed!");
        runStepResponse = flowResponse.getStepResponses().get("4");
        assertTrue(runStepResponse.isSuccess(), "Merging step failed!");

        assertEquals(8, getFinalDocCount("merged-customer"),"Expected 8 merged-customer docs");
        assertEquals(1, getFinalDocCount("sm-Customer-merged"),"Expected 1 merged Customer doc");
    }

    private void validateFullyReferencedFlowsAndSteps() {
        HubProject hubProject = getHubConfig().getHubProject();

        ArrayList<StepDefinition.StepDefinitionType> stepDefTypes = StepDefinition.StepDefinitionType.getStepDefinitionTypes();

        File[] flowFiles = hubProject.getFlowsDir().toFile().listFiles();
        assertEquals(flowFiles.length, 1);

        for (File flowFile : flowFiles) {
            JsonNode flowNode = readJsonObject(flowFile);
            JsonNode stepsNode = flowNode.get("steps");
            assertNotNull(stepsNode, "The steps key should exist in the flow document");
             Iterator<String> fieldNames = stepsNode.fieldNames();
            int stepNum = 1;
            while (fieldNames.hasNext()) {
                String fieldName = fieldNames.next();
                assertEquals(fieldName, Integer.toString(stepNum),
                    "Step numbers should be sequential positive integers starting with one.");
                JsonNode innerObj = stepsNode.get(fieldName);
                assertNotNull(innerObj);

                String stepId = innerObj.get("stepId").asText();
                assertNotNull(stepId, "stepId should be not null");

                String[] stepIdParts = stepId.split("-");
                assertTrue(stepIdParts.length > 1,
                    format("Step name should be consist of multiple hyphen-separated parts. (%s)", stepId));
                // the last part of the step name is the step definition type
                String stepType = stepIdParts[stepIdParts.length - 1];
                assertNotNull(StepDefinition.StepDefinitionType.getStepDefinitionType(stepType),
                    "The final part of the stepId should be a step definition type");

                Path stepsPath = hubProject.getStepsPath(StepDefinition.StepDefinitionType.getStepDefinitionType(stepType));
                // derive the step name by omitting the final hyphen and step definition type
                String stepName = String.join("-", Arrays.copyOfRange(stepIdParts, 0, stepIdParts.length - 1));
                assertTrue(stepsPath.resolve(stepName + ".step.json").toFile().exists(),
                    format("The step file should exist in the correct step directory. (name: %s, stepId: %s, stepDefinitionType: %s)", stepName, stepId, stepType));

                stepNum++;
            }
        }
    }
}
