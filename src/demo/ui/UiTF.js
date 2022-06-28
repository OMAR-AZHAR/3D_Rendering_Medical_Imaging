import "nouislider/distribute/nouislider.css";
import React from "react";
import { connect } from "react-redux";

class UiTF extends React.Component {
  constructor(props) {
    super(props);
    //this.onUndo = this.onUndo.bind(this);
    this.m_updateEnable = true;
  }

  shouldComponentUpdate(nextProps) {
    //return this.m_updateEnable;
    let flag = this.m_updateEnable;
    if (this.props.mode3d !== nextProps.mode3d) {
      flag = true;
    }
    return flag;
    //return true;
  }

  /**
   * Main component render func callback
   */
  render() {
    const store = this.props;
    const mode3d = store.mode3d;

    const jsxRayfastTF = null;

    console.log(`UiTF . mode = ${mode3d}`);
    const jsxArray = [jsxRayfastTF];
    const jsxRet = jsxArray[mode3d];
    return jsxRet;
  }
}

export default connect((store) => store)(UiTF);
