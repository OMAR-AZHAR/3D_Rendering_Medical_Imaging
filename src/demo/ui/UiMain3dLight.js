import React from "react";
import { connect } from "react-redux";
import { Row, Col } from "react-bootstrap";
import Graphics3d from "../engine/Graphics3d";

class UiMain3dLight extends React.Component {
  render() {
    const MIN_HEIGHT = 882;
    const strMinHeight = {
      minHeight: MIN_HEIGHT.toString() + "px",
    };

    const jsxMain3dLight = (
      <Row>
        <Col xs={12} sm md lg={12} style={strMinHeight}>
          <Graphics3d />
        </Col>
      </Row>
    );

    return jsxMain3dLight;
  }
}

export default connect((store) => store)(UiMain3dLight);
