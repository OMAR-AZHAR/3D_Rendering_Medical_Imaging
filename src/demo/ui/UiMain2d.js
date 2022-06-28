import React from "react";
import { connect } from "react-redux";
import { Row, Col, Container } from "react-bootstrap";
import Graphics2d from "../engine/Graphics2d";

class UiMain2d extends React.Component {
  render() {
    const MIN_HEIGHT = 882;
    const strMinHeight = {
      minHeight: MIN_HEIGHT.toString() + "px",
    };

    const jsxMain2d = (
      <Container fluid="true" style={{ height: "100%", minHeight: "100%" }}>
        <Row>
          <Col
            xs
            md
            lg="12"
            style={{ height: "100%", position: "relative" }}
          ></Col>
          <Col lg={8} style={strMinHeight}>
            <Graphics2d />
          </Col>
        </Row>
      </Container>
    );

    return jsxMain2d;
  }
}

export default connect((store) => store)(UiMain2d);
