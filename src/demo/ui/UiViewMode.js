import React from "react";
import { connect } from "react-redux";
import { Button, ButtonGroup, OverlayTrigger, Tooltip } from "react-bootstrap";
import ModeView from "../store/ModeView";
import StoreActionType from "../store/ActionTypes";


class UiViewMode extends React.Component {
  /**
   * @param {object} props - props from up level object
   */
  constructor(props) {
    super(props);

    this.m_needMode3dLight = true;

    this.onMode3dLight = this.onMode3dLight.bind(this);
  }

  onMode(indexMode) {
    const store = this.props;
    store.dispatch({
      type: StoreActionType.SET_MODE_VIEW,
      modeView: indexMode,
    });
  }

  onMode3dLight() {
    this.onMode(ModeView.VIEW_3D_LIGHT);
  }

  render() {
    const store = this.props;

    let viewMode = store.modeView;

    const str3dLight =
      viewMode === ModeView.VIEW_3D_LIGHT ? "primary" : "secondary";

    const jsxOut = (
     
        <ButtonGroup className="mr-2" aria-label="Top group">
          <OverlayTrigger
            key="3dLight"
            placement="bottom"
            overlay={
              <Tooltip>3d mode with fast rendering</Tooltip>
            }
          >
            <Button variant={str3dLight} onClick={this.onMode3dLight}>
              3D Render
             
            </Button>
          </OverlayTrigger>
        </ButtonGroup>
      
    );

    return jsxOut;
  }
}

export default connect((store) => store)(UiViewMode);
