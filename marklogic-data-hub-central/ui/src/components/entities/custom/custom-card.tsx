import React, {useState} from "react";
import styles from "./custom-card.module.scss";
import {Card, Row, Col} from "antd";
import {convertDateFromISO, getInitialChars, extractCollectionFromSrcQuery} from "../../../util/conversionFunctions";
import {AdvCustomTooltips} from "../../../config/tooltips.config";
import {MLTooltip} from "@marklogic/design-system";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import Steps from "../../steps/steps";
import {faEye} from "@fortawesome/free-solid-svg-icons";


interface Props {
    data: any;
    canReadOnly: boolean,
    canReadWrite: boolean
}

const CustomCard: React.FC<Props> = (props) => {
  const activityType = "custom";
  const [stepData, setStepData] = useState({});
  const [openStepSettings, setOpenStepSettings] = useState(false);

  const OpenStepSettings = (index) => {
    setStepData(prevState => ({...prevState, ...props.data[index]}));
    setOpenStepSettings(true);
  };

  return (
    <div className={styles.customContainer}>
      <Row gutter={16} type="flex" >
        {props && props.data.length > 0 ? props.data.map((elem, index) => (

          <Col key={index}>
            <Card
              actions={[
                <MLTooltip title={AdvCustomTooltips.viewCustom} placement="bottom">
                  <span className={styles.viewStepSettingsIcon} onClick={() => OpenStepSettings(index)} role="edit-custom button" data-testid={elem.name+"-edit"}><FontAwesomeIcon icon={faEye}/> View Step Settings</span>
                </MLTooltip>,
              ]}
              className={styles.cardStyle}
              size="small"
            >
              <div className={styles.formatFileContainer}>
                <span className={styles.customNameStyle}>{getInitialChars(elem.name, 27, "...")}</span>
              </div>
              <br />
              {elem.selectedSource === "collection" ? <div className={styles.sourceQuery}>Collection: {extractCollectionFromSrcQuery(elem.sourceQuery)}</div> : <div className={styles.sourceQuery}>Source Query: {getInitialChars(elem.sourceQuery, 32, "...")}</div>}
              <br /><br />
              <p className={styles.lastUpdatedStyle}>Last Updated: {convertDateFromISO(elem.lastUpdated)}</p>
            </Card>
          </Col>
        )) : <span></span> }</Row>
      <Steps
        // Basic Settings
        isEditing={true}
        stepData={stepData}
        canReadWrite={props.canReadWrite}
        canReadOnly={props.canReadOnly}
        // Advanced Settings
        tooltipsData={AdvCustomTooltips}
        openStepSettings={openStepSettings}
        setOpenStepSettings={setOpenStepSettings}
        activityType={activityType}
      />
    </div>
  );
};

export default CustomCard;
