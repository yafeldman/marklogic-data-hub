import React from "react";
import {render, cleanup, fireEvent, screen, waitForElement} from "@testing-library/react";
import MergeRuleDialog from "./merge-rule-dialog";
import data from "../../../../assets/mock-data/curation/merging.data";
import {CurationContext} from "../../../../util/curation-context";
import {customerMergingStep} from "../../../../assets/mock-data/curation/curation-context-mock";
import {updateMergingArtifact} from "../../../../api/merging";
import userEvent from "@testing-library/user-event";
import {MergeRuleTooltips, multiSliderTooltips} from "../../../../config/tooltips.config";


jest.mock("../../../../api/merging");
const mockMergingUpdate = updateMergingArtifact as jest.Mock;

describe("Merge Rule Dialog component", () => {

  afterEach(() => {
    jest.clearAllMocks();
    cleanup();
  });

  it("Verify Add Merge Rule dialog with custom mergeType renders correctly", () => {
    mockMergingUpdate.mockResolvedValueOnce({status: 200, data: {}});
    const {getByText, getByTestId, getByLabelText, queryByLabelText} = render(
      <CurationContext.Provider value={customerMergingStep}>
        <MergeRuleDialog
          {...data.mergeRuleDataProps}
          isEditRule={false}
        />
      </CurationContext.Provider>
    );

    expect(getByText("Add Merge Rule")).toBeInTheDocument();
    expect(getByText("Select the property and the merge type for this merge rule. When you select a structured type property, the merge rule is applied to all the properties within that structured type property as well.")).toBeInTheDocument();
    expect(getByTestId("multipleIconLegend")).toBeInTheDocument();
    expect(getByTestId("structuredIconLegend")).toBeInTheDocument();
    expect(getByLabelText("formItem-Property")).toBeInTheDocument();

    fireEvent.click(getByText("Select property"));
    fireEvent.click(getByText("customerId"));

    //Confirming that URI, function and namespace fields are not available now, because Custom merge type is not selected yet.
    expect(queryByLabelText("uri-input")).not.toBeInTheDocument();
    expect(queryByLabelText("function-input")).not.toBeInTheDocument();
    expect(queryByLabelText("namespace-input")).not.toBeInTheDocument();

    //Selecting the merge type to Custom
    fireEvent.click(getByLabelText("mergeType-select"));
    fireEvent.click(getByTestId("mergeTypeOptions-Custom"));

    //Initializing the required elements to be re-used later.
    let uri = getByLabelText("uri-input");
    let functionValue = getByLabelText("function-input");
    let saveButton = getByText("Save");

    //Checking if URI, function and namespace fields are available now, since merge type is Custom.
    expect(uri).toBeInTheDocument();
    expect(functionValue).toBeInTheDocument();
    expect(getByLabelText("namespace-input")).toBeInTheDocument();

    fireEvent.click(saveButton); //Will throw an error because URI and Function are mandatory fields.

    //verify if the below error messages are displayed properly
    expect(getByText("URI is required")).toBeInTheDocument();
    expect(getByText("Function is required")).toBeInTheDocument();

    //Enter the values for URI and Function fields and see if the save button gets enabled.
    fireEvent.change(uri, {target: {value: "Customer/Cust1.json"}});
    fireEvent.change(functionValue, {target: {value: "Compare"}});

    fireEvent.click(saveButton); //Modal will close now
    expect(data.mergeRuleDataProps.setOpenMergeRuleDialog).toHaveBeenCalledTimes(1);
    expect(mockMergingUpdate).toHaveBeenCalledTimes(1);

  });

  it("Verify Add Merge Rule dialog with property-specific mergeType renders correctly", async () => {
    const {getByText, getByTestId, getByLabelText, queryByLabelText, getByPlaceholderText, getAllByLabelText} = render(
      <CurationContext.Provider value={customerMergingStep}>
        <MergeRuleDialog
          {...data.mergeRuleDataProps}
          isEditRule={false}
        />
      </CurationContext.Provider>
    );

    expect(getByText("Add Merge Rule")).toBeInTheDocument();
    expect(getByText("Select the property and the merge type for this merge rule. When you select a structured type property, the merge rule is applied to all the properties within that structured type property as well.")).toBeInTheDocument();
    expect(getByTestId("multipleIconLegend")).toBeInTheDocument();
    expect(getByTestId("structuredIconLegend")).toBeInTheDocument();
    expect(getByLabelText("formItem-Property")).toBeInTheDocument();

    fireEvent.click(getByText("Select property"));
    fireEvent.click(getByText("nicknames"));

    //Confirming that max values, max sources and add button are not available now, because property-specific merge type is not selected yet.
    expect(queryByLabelText("Enter max values")).not.toBeInTheDocument();
    expect(queryByLabelText("Enter max sources")).not.toBeInTheDocument();
    expect(queryByLabelText("add-slider-button")).not.toBeInTheDocument();

    let saveButton = getByText("Save");

    //Selecting the merge type to Property-Specific
    fireEvent.click(getByLabelText("mergeType-select"));
    fireEvent.click(getByTestId("mergeTypeOptions-Property-specific"));

    //Checking if max values, max sources, priority slider and add button are available now, since merge type is property-specific.
    expect(getByPlaceholderText("Enter max values")).toBeInTheDocument();
    expect(getByPlaceholderText("Enter max sources")).toBeInTheDocument();
    expect(getByTestId("priorityOrderSlider")).toBeInTheDocument();

    //Verify priority Order slider tooltip
    userEvent.hover(getAllByLabelText("icon: question-circle")[3]);
    expect((await(waitForElement(() => getByText(multiSliderTooltips.priorityOrder))))).toBeInTheDocument();

    //Timestamp handle is visible by default
    let timestampHandle = getByTestId("Timestamp-active");
    expect(timestampHandle).toHaveClass("handleDisabled");
    expect(getByLabelText("Timestamp")).toBeInTheDocument();
    userEvent.hover(timestampHandle);
    expect((await(waitForElement(() => getByText(multiSliderTooltips.timeStamp))))).toBeInTheDocument();

    expect(getByLabelText("add-slider-button")).toBeInTheDocument();

    fireEvent.click(saveButton); //Modal will close now
    expect(data.mergeRuleDataProps.setOpenMergeRuleDialog).toHaveBeenCalledTimes(1);
    expect(mockMergingUpdate).toHaveBeenCalledTimes(1);
  });

  it("Verify Add Merge Rule dialog with strategy mergeType renders correctly", () => {
    const {getByText, getByTestId, getByLabelText, queryByText} = render(
      <CurationContext.Provider value={customerMergingStep}>
        <MergeRuleDialog
          {...data.mergeRuleDataProps}
          isEditRule={false}
        />
      </CurationContext.Provider>
    );

    expect(getByText("Add Merge Rule")).toBeInTheDocument();
    expect(getByText("Select the property and the merge type for this merge rule. When you select a structured type property, the merge rule is applied to all the properties within that structured type property as well.")).toBeInTheDocument();
    expect(getByTestId("multipleIconLegend")).toBeInTheDocument();
    expect(getByTestId("structuredIconLegend")).toBeInTheDocument();
    expect(getByLabelText("formItem-Property")).toBeInTheDocument();

    fireEvent.click(getByText("Select property"));
    fireEvent.click(getByText("status"));
    //Checking if strategy name select is available now, because strategy merge type is not selected yet.
    expect(queryByText("Select strategy name")).not.toBeInTheDocument();

    //Selecting the merge type to strategy
    fireEvent.click(getByLabelText("mergeType-select"));
    fireEvent.click(getByTestId("mergeTypeOptions-Strategy"));

    expect(queryByText("Select strategy name")).toBeInTheDocument();

    //verify if the below error message is not displayed yet
    expect(queryByText("Strategy Name is required")).not.toBeInTheDocument();

    let strategyName = getByLabelText("strategy-name-select");
    let saveButton = getByText("Save");

    //Checking if strategy name is available now, since merge type is strategy.
    expect(strategyName).toBeInTheDocument();
    fireEvent.click(saveButton); //Will throw an error because strategy name is mandatory field.

    //verify if the below error message is displayed properly
    expect(getByText("Strategy Name is required")).toBeInTheDocument();

    //Enter the values for strategy name to see save button gets enabled.
    fireEvent.click(strategyName);
    fireEvent.click(getByTestId("strategyNameOptions-customMergeStrategy"));

    fireEvent.click(saveButton); //Modal will close now
    expect(data.mergeRuleDataProps.setOpenMergeRuleDialog).toHaveBeenCalledTimes(1);
    expect(mockMergingUpdate).toHaveBeenCalledTimes(1);
  });

  it("Verify Add Merge Rule dialog with existing rule for property is disabled in the dropdown", async() => {
    const {getByText, getByTestId, getByLabelText} = render(
      <CurationContext.Provider value={customerMergingStep}>
        <MergeRuleDialog
          {...data.mergeRuleDataProps}
          isEditRule={false}
        />
      </CurationContext.Provider>
    );

    fireEvent.click(getByText("Select property"));
    fireEvent.click(getByText("name"));

    //Verify property dropdown tooltip
    userEvent.hover(getByLabelText("icon: question-circle"));
    expect((await(waitForElement(() => getByText(MergeRuleTooltips.disabledProperties))))).toBeInTheDocument();

    //Selecting the merge type to Property-Specific
    fireEvent.click(getByLabelText("mergeType-select"));
    fireEvent.click(getByTestId("mergeTypeOptions-Property-specific"));

    let saveButton = getByText("Save");

    fireEvent.click(saveButton);
    expect(getByText("Property is required")).toBeInTheDocument();//Will throw an error because name already has a merge rule.
    expect(data.mergeRuleDataProps.setOpenMergeRuleDialog).toHaveBeenCalledTimes(0);
    expect(mockMergingUpdate).toHaveBeenCalledTimes(0);
  });

  it("Verify if add merge rule dialog can be saved without property and mergetype values", () => {
    const {getByText} = render(
      <CurationContext.Provider value={customerMergingStep}>
        <MergeRuleDialog
          {...data.mergeRuleDataProps}
        />
      </CurationContext.Provider>
    );
    let saveButton = getByText("Save");
    fireEvent.click(saveButton);
    expect(getByText("Property is required")).toBeInTheDocument();
    expect(getByText("Merge type is required")).toBeInTheDocument();
    expect(data.mergeRuleDataProps.setOpenMergeRuleDialog).toHaveBeenCalledTimes(0);
    expect(mockMergingUpdate).toHaveBeenCalledTimes(0);
  });

  it("Verify if add merge rule dialog can be closed without saving", () => {
    const {getByText} = render(
      <CurationContext.Provider value={customerMergingStep}>
        <MergeRuleDialog
          {...data.mergeRuleDataProps}
          isEditRule={false}
        />
      </CurationContext.Provider>
    );
    let cancelButton = getByText("Cancel");
    fireEvent.click(cancelButton);
    expect(screen.queryByLabelText("confirm-body")).toBeNull();
    expect(data.mergeRuleDataProps.setOpenMergeRuleDialog).toHaveBeenCalledTimes(1);
    expect(mockMergingUpdate).toHaveBeenCalledTimes(0);
  });

  it("Verify Edit Merge Rule dialog renders correctly with property name", async() => {
    mockMergingUpdate.mockResolvedValueOnce({status: 200, data: {}});
    const {getByText} = render(
      <CurationContext.Provider value={customerMergingStep}>
        <MergeRuleDialog
          {...data.mergeRuleDataProps}
          propertyName={"customerId"}
        />
      </CurationContext.Provider>
    );

    expect(getByText("Edit Merge Rule")).toBeInTheDocument();
    expect(getByText("customerId")).toBeInTheDocument();
    let saveButton = getByText("Save");
    //Modal will close now
    fireEvent.click(saveButton);
    expect(data.mergeRuleDataProps.setOpenMergeRuleDialog).toHaveBeenCalledTimes(1);

  });


});
