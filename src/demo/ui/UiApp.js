import React from 'react';
import { connect } from 'react-redux';

import { Nav, Navbar, Container, ProgressBar, Row, Col } from 'react-bootstrap';
import StoreActionType from '../store/ActionTypes';

import UiMain from './UiMain';
import UiOpenMenu from './UiOpenMenu';
import UiViewMode from './UiViewMode';
// import UiAbout from './UiAbout';
import UiSaveMenu from './UiSaveMenu';
// import UiReportMenu from './UiReportMenu';
// import UiFilterMenu from './UiFilterMenu';
import UiModalText from './UiModalText';
import UiModalAlert from './UiModalAlert';
import UiErrConsole from './UiErrConsole';
// import ModeView from '../store/ModeView';

import BrowserDetector from '../engine/utils/BrowserDetector';

class UiApp extends React.Component {
  constructor(props) {
    super(props);

    this.onShowModalText = this.onShowModalText.bind(this);
    this.onHideModalText = this.onHideModalText.bind(this);

    this.onShowModalAlert = this.onShowModalAlert.bind(this);
    this.onHideModalAlert = this.onHideModalAlert.bind(this);

    this.doShowProgressBar = this.doShowProgressBar.bind(this);
    this.doHideProgressBar = this.doHideProgressBar.bind(this);
    this.doSetProgressBarRatio = this.doSetProgressBarRatio.bind(this);

    this.m_modalText = null;
    this.m_store = null;
    this.m_fileNameOnLoad = '';

    this.state = {
      showModalText: false,
      showProgressBar: false,
      progressBarRatio: 55,
      showModalAlert: false,
      strAlertTitle: '???',
      strAlertText: '???',
      strProgressMessage: 'Loading...',
    };
  }

  UNSAFE_componentWillMount() {
    let fileNameOnLoad = '';
    const strSearch = window.location.search;
    if (strSearch.length > 0) {
      const strReg = /\\?url=(\S+)/;
      const arr = strSearch.match(strReg);
      if (arr === null) {
        console.log('arguments should be in form: ?url=www.xxx.yy/zz/ww');
        return;
      }
      fileNameOnLoad = arr[1];
      const regA = /^((ftp|http|https):\/\/)?(([\S]+)\.)?([\S]+)\.([A-z]{2,})(:\d{1,6})?\/[\S]+/;
      const regB = /(ftp|http|https):\/\/([\d]+)\.([\d]+)\.([\d]+)\.([\d]+)(:([\d]+))?\/([\S]+)/;
      const isValidA = fileNameOnLoad.match(regA);
      const isValidB = fileNameOnLoad.match(regB);
      if ((isValidA === null) && (isValidB === null)) {
        console.log(`Not valid URL = ${fileNameOnLoad}`);
        return;
      }
      this.m_fileNameOnLoad = fileNameOnLoad;
    }
  }

  componentDidMount() {
    const store = this.m_store;
    if (store === null) {
      console.log('UiApp. componentDidMount. store is NULL');
    }
    store.dispatch({ type: StoreActionType.SET_UI_APP, uiApp: this });

    // browser detector
    const browserDetector = new BrowserDetector();
    this.isWebGl20supported = browserDetector.checkWebGlSupported();
    if (!this.isWebGl20supported) {
      this.setState({ strAlertTitle: 'Browser compatibility problem detected' });
      this.setState({ strAlertText: 'This browser not supported WebGL 2.0. Application functinality is decreased and app can be unstable' });
      this.onShowModalAlert();
    } else {
      const isValidBro = browserDetector.checkValidBrowser();
      if (!isValidBro) {
        this.setState({ strAlertTitle: 'Browser compatibility problem detected' });
        this.setState({ strAlertText: 'App is specially designed for Chrome/Firefox/Opera/Safari browsers' });
        this.onShowModalAlert();
      }
    }
  }

  onShowModalText() {
    this.setState({ showModalText: true });
  }

  onHideModalText() {
    this.setState({ showModalText: false });
  }

  onShowModalAlert() {
    this.setState({ showModalAlert: true });
  }

  onHideModalAlert() {
    this.setState({ showModalAlert: false });
  }

  doShowProgressBar(strProgressMsg) {
    if ((strProgressMsg === undefined) || (strProgressMsg === null)) {
      console.log('doShowProgressBar: need argument - strProgressMsg');
      return;
    }
    this.setState({ strProgressMessage: strProgressMsg });
    this.setState({ showProgressBar: true });
  }

  doHideProgressBar() {
    // console.log('doHideProgressBar');
    this.setState({ showProgressBar: false });
  }

  /**
   * 
   * @param {number} ratio - in [0..99] range
   */
  doSetProgressBarRatio(ratio) {
    // console.log(`doSetProgressBarRatio: ${ratio}`);

    // show progress bar if it was hidden but need to show some non-0, non-100 progress
    if ((ratio >= 0) && (ratio <= 99)) {
      if (this.state.showProgressBar === false) {
        this.setState({ showProgressBar: true });
      }
    }
    this.setState({ progressBarRatio: ratio });
  }

  /**
   * Main component render func callback
   */
  render() {
    const store = this.props;
    this.m_store = store;
    const isLoaded = store.isLoaded;
    const fileName = store.fileName;
    const arrErrorsLoadedd = store.arrErrors;

    const strMessageOnMenu = (isLoaded) ? 'File: ' + fileName : 'Upload Files to Render';

    const strProgressMsg = this.state.strProgressMessage;

    const objPrgBarVis = 
      <Row>
        <Col xs xl sm md lg="12" style={{ width: '100%' } }>
          {strProgressMsg}
          <ProgressBar animated variant="success"
            now={this.state.progressBarRatio} label={`${this.state.progressBarRatio}%`}  />
        </Col>
      </Row>
    const objProgressBar = (this.state.showProgressBar) ? objPrgBarVis : <p></p>;

    const jsxNavBarReact = 
      <Container fluid="true" style={{ height:'100%', minHeight:'100%' }}  >
        <Navbar bg="dark" variant="dark" expand="lg" >
          <Navbar.Brand>
            {/* <UiAbout /> */}
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="mr-auto">

              <Navbar.Text className="d-none d-sm-block">
                {strMessageOnMenu}
              </Navbar.Text>
{/* Upload File Function */}
              <UiOpenMenu fileNameOnLoad={this.m_fileNameOnLoad} /> 

              <UiSaveMenu />
              {/* <UiReportMenu /> */}
              {/* {(store.modeView === ModeView.VIEW_2D) ? <UiFilterMenu /> : <p></p>} */}
              {(isLoaded && this.isWebGl20supported) ? <UiViewMode /> : <p></p>}
            </Nav>
          </Navbar.Collapse>

        </Navbar>
        {objProgressBar}
        {(isLoaded) ? <UiMain /> : <p></p>}
        {(arrErrorsLoadedd.length > 0) ? <UiErrConsole /> : <p></p>}
        <UiModalText stateVis={this.state.showModalText}
          onHide={this.onHideModalText} onShow={this.onShowModalText} />
        <UiModalAlert stateVis={this.state.showModalAlert}
          onHide={this.onHideModalAlert} onShow={this.onShowModalAlert} 
          title={this.state.strAlertTitle} text={this.state.strAlertText} />
      </Container>;

    return jsxNavBarReact;
  }
}

export default connect(store => store)(UiApp);
