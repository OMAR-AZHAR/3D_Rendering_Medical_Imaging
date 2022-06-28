import ModeView from "../store/ModeView";
import StoreActionType from "../store/ActionTypes";

import React from 'react';
import { connect } from 'react-redux';

import { Modal, Container, Row, Col, Button, ButtonGroup, OverlayTrigger, Tooltip } from 'react-bootstrap';

const LARGE_NUMBER = 0x3FFFFFFF;
const DEFAULT_WIN_MIN = 650 - 2000 / 2;
const DEFAULT_WIN_MAX = 650 + 2000 / 2;


class UiModalWindowCenterWidth extends React.Component {
  constructor(props) {
    super(props);
    this.m_needMode3dLight = true;

    this.onMode3dLight = this.onMode3dLight.bind(this);
    this.m_objCanvas = null;
    this.m_dataMin = LARGE_NUMBER;
    this.m_dataMax = LARGE_NUMBER;

    this.onButtonCancel = this.onButtonCancel.bind(this);
    this.onButtonApply = this.onButtonApply.bind(this);

    this.state = {
      showModalWindowCenterWidth: false,
      windowMin: DEFAULT_WIN_MIN,
      windowMax: DEFAULT_WIN_MAX, 
    };
  } // end constructor

  onModalHide() {
    this.setState({ showModalWindowCenterWidth: false });
  }

  reset() {
    // restore data params to initial for next lloading
    this.m_dataMin = LARGE_NUMBER;
    this.m_dataMax = LARGE_NUMBER;
    this.setState({ windowMin: DEFAULT_WIN_MIN });
    this.setState({ windowMax: DEFAULT_WIN_MAX });
  }

  //
  onButtonCancel() {
    // console.log('TODO: on Cancel ...');
    this.reset();

    const onHideFunc = this.props.onHide;
    onHideFunc(false);
  }

  //
  onButtonApply() {
//     console.log('TODO: on Apply Render file in 3d...');




  }

  //
  componentDidMount() {
    // use onRef to provide access to this for the parent component
    // ini react hierarchy
    this.props.onRef(this);
    this.renderPreview();
  }

  componentWillUnmount() {
    this.props.onRef(undefined);
  }

  componentDidUpdate() {
    this.renderPreview();
  }

  drawSlice(ctx, wScreen, hScreen, imgData, dataDst, series, loaderDicom) {
    const serie = series[0];
    const slices = serie.m_slices;
    const numSlices = slices.length;

    // sort slices via slice location OR slice number
    let minSliceNum = slices[0].m_sliceNumber;
    let maxSliceNum = slices[0].m_sliceNumber;
    for (let s = 0; s < numSlices; s++) {
      const num = slices[s].m_sliceNumber;
      minSliceNum = (num < minSliceNum) ? num : minSliceNum;
      maxSliceNum = (num > maxSliceNum) ? num : maxSliceNum;
    }
    const difSlceNum = maxSliceNum - minSliceNum;
    if (difSlceNum > 0) {
      // sort slices by slice number (read from dicom tag)
      slices.sort((a, b) => {
        const zDif = a.m_sliceNumber - b.m_sliceNumber;
        return zDif;
      });
    } else {
      // sort slices by slice location (read from diocom tag)
      slices.sort((a, b) => {
        const zDif = a.m_sliceLocation - b.m_sliceLocation;
        return zDif;
      });
    }
    // assign new slice numbers according accending location
    let ind = 0;
    for (let s = 0; s < numSlices; s++) {
      slices[s].m_sliceNumber = ind;
      ind++;
    }
    loaderDicom.m_zDim = numSlices;

    const indexCenter = Math.floor(numSlices / 2);
    const slice = slices[indexCenter];
    const sliceData16 = slice.m_image;
    const xDim = slice.m_xDim;
    const yDim = slice.m_yDim;
    let maxVal = -LARGE_NUMBER;
    let minVal = +LARGE_NUMBER;
    const xyDim = xDim * yDim;
    const zOff = 0;
    let i;
    for (i = 0; i < xyDim; i++) {
      let valSrc = sliceData16[i];
      // check big endian
      if (!loaderDicom.m_littleEndian) {
        const valBytesSwap = (valSrc >> 8) | ((valSrc << 8) & 0xffff);
        valSrc = valBytesSwap;
      }
      // check pad value
      valSrc = (valSrc === loaderDicom.m_padValue) ? 0 : valSrc;
      
      const valData = valSrc * loaderDicom.m_rescaleSlope + loaderDicom.m_rescaleIntercept;
      minVal = (valData < minVal) ? valData : minVal;
      maxVal = (valData > maxVal) ? valData : maxVal;
    } // for (i) all slice pixels
    // console.log(`Modal dcm. min/max val = ${minVal} / ${maxVal}`);
    // this.m_dataMin = minVal;
    // this.m_dataMax = maxVal;

    const wMin = this.state.windowMin;
    const wMax = this.state.windowMax;
    const wc = Math.floor((wMax + wMin) * 0.5);
    const ww = wMax - wMin;

    const BITS_ACCUR = 11;
    const BITS_IN_BYTE = 8;
    const scale = Math.floor((1 << (BITS_IN_BYTE + BITS_ACCUR)) / (maxVal - minVal));
    const TOO_MIN_SCALE = 4;
    if (scale <= TOO_MIN_SCALE) {
      console.log('Bad scaling: image will be 0');
      return;
    }
    // const MAX_BYTE = 255;

    // create temp data array: 8 bit image for this slice
    const dataArray = new Uint8Array(xyDim);
    const winMin = wc - ww * 0.5;
    for (i = 0; i < xyDim; i++) {
      let valSrc = sliceData16[i];
      // check big endian
      if (!loaderDicom.m_littleEndian) {
        const valBytesSwap = (valSrc >> 8) | ((valSrc << 8) & 0xffff);
        valSrc = valBytesSwap;
      }
      // check pad value
      valSrc = (valSrc === loaderDicom.m_padValue) ? 0 : valSrc;
      const valScaled = valSrc * loaderDicom.m_rescaleSlope + loaderDicom.m_rescaleIntercept;

      let val = 0;
      if (loaderDicom.m_rescaleHounsfield) {
        // rescale for hounsfield units
        val = Math.floor((valScaled - winMin) * 255 / ww);
      } else {
        // usual (default) rescale
        val = Math.floor(127 + (valScaled - wc) * 128 / (ww / 2));
      }
      val = (val >= 0) ? val : 0;
      val = (val < 255) ? val : 255;
      dataArray[zOff + i] = val;
    } // for i

    // draw 8 but image into window
    let j = 0;
    const xStep = xDim / wScreen;
    const yStep = yDim / hScreen;
    let ay = 0.0; 
    for (let y = 0; y < hScreen; y++, ay += yStep) {
      const ySrc = Math.floor(ay);
      const yOff = ySrc * xDim;
      let ax = 0.0;
      for (let x = 0; x < wScreen; x++, ax += xStep) {
        const xSrc = Math.floor(ax);
        const val = dataArray[zOff + yOff + xSrc];
        dataDst[j + 0] = val;
        dataDst[j + 1] = val;
        dataDst[j + 2] = val;
        dataDst[j + 3] = 255; // opacity
        j += 4;
      } // for x
    } // for y
    ctx.putImageData(imgData, 0, 0);
  } // end draw slice

  //
  // render preview window with slice and selected window properties
  //
  renderPreview() {
    const objCanvas = this.m_objCanvas;
    if (objCanvas === null) {
      return;
    }

    const wScreen = objCanvas.clientWidth;
    const hScreen = objCanvas.clientHeight;

    const ctx = objCanvas.getContext('2d');
    const store = this.props;

    // clear screen
    ctx.fillStyle = 'rgb(40, 40, 40)';
    ctx.fillRect(0, 0, wScreen, hScreen);

    // destination buffer to write
    const imgData = ctx.createImageData(wScreen, hScreen);
    const dataDst = imgData.data;
    let j = 0;
    const TEST_RAINBOW = false;
    if (TEST_RAINBOW) {
      console.log("special rainbow test instead of slice render");
      for (let y = 0; y < hScreen; y++) {
        for (let x = 0; x < wScreen; x++) {
          let b = Math.floor(255.0 * x / wScreen);
          let g = Math.floor(255.0 * y / hScreen);
          let r = 50;
          dataDst[j + 0] = r;
          dataDst[j + 1] = g;
          dataDst[j + 2] = b;
          dataDst[j + 3] = 255;
          j += 4;
        }
      }
      ctx.putImageData(imgData, 0, 0);
      return;
    } // if test rainbow

    const loaderDicom = store.loaderDicom;
    if (loaderDicom === null) {
      return;
    }
    const series = loaderDicom.m_slicesVolume.m_series;
    if (series.length === 0) {
      return;
    }
    this.drawSlice(ctx, wScreen, hScreen, imgData, dataDst, series, loaderDicom);
  } // end render preview

  //
  // callbakc on user change window range (min, max)
  //
  onSliderWindowRange()
  {
    const arrVals = this.refs.sliderRange.slider.get();
    const vMin = parseInt(arrVals[0]);
    const vMax = parseInt(arrVals[1]);
    this.setState({ windowMin: vMin });
    this.setState({ windowMax: vMax });
    // console.log(`slider min/max = ${vMin} / ${vMax}`);
  }

  getDataMinMax(store, loaderDicom) {
    const series = loaderDicom.m_slicesVolume.m_series;
    if (series.length === 0) {
      return;
    }
    const serie = series[0];
    const slices = serie.m_slices;
    const slice = slices[0];
    const sliceData16 = slice.m_image;
    const xDim = slice.m_xDim;
    const yDim = slice.m_yDim;
    let maxVal = -LARGE_NUMBER;
    let minVal = +LARGE_NUMBER;
    const xyDim = xDim * yDim;
    let i;
    for (i = 0; i < xyDim; i++) {
      let valSrc = sliceData16[i];
      // check big endian
      if (!loaderDicom.m_littleEndian) {
        const valBytesSwap = (valSrc >> 8) | ((valSrc << 8) & 0xffff);
        valSrc = valBytesSwap;
      }
      // check pad value
      valSrc = (valSrc === loaderDicom.m_padValue) ? 0 : valSrc;
      
      const valData = valSrc * loaderDicom.m_rescaleSlope + loaderDicom.m_rescaleIntercept;
      minVal = (valData < minVal) ? valData : minVal;
      maxVal = (valData > maxVal) ? valData : maxVal;
    } // for (i) all slice pixels
    // console.log(`Modal dcm. min/max val = ${minVal} / ${maxVal}`);
    this.m_dataMin = minVal;
    this.m_dataMax = maxVal;
    // console.log(`data min max ready`);
  } // end get data min max

  initWindowRange() {
    const store = this.props;
    const loaderDicom = store.loaderDicom;
    if (loaderDicom !== null) {
      let isValid = true;
      isValid = (loaderDicom.m_windowCenter === LARGE_NUMBER) ? false : isValid;
      isValid = (loaderDicom.m_windowWidth === LARGE_NUMBER) ? false : isValid;
      isValid = (loaderDicom.m_windowWidth <= 0) ? false : isValid;

      if (isValid) {
        const wMin = Math.floor(loaderDicom.m_windowCenter - loaderDicom.m_windowWidth / 2);
        const wMax = Math.floor(loaderDicom.m_windowCenter + loaderDicom.m_windowWidth / 2);
        this.setState({ windowMin: wMin });
        this.setState({ windowMax: wMax });
      }
      this.getDataMinMax(store, loaderDicom);
    } // if loader dicom ready
  } // end init

  // render 





  


onMode(indexMode) {
  const store = this.props;
  store.dispatch({
    type: StoreActionType.SET_MODE_VIEW,
    modeView: indexMode,
  });
}

onMode3dLight() {
  this.onMode(ModeView.VIEW_3D_LIGHT);

console.log('TODO: on Apply Render file in 3d...');

this.reset();
// const
const store = this.props;

const loaderDicom = store.loaderDicom;
const volSet = store.volumeSet;


const series = loaderDicom.m_slicesVolume.getSeries();
const numSeries = series.length;
for (let i = 0; i < numSeries; i++) {
  const hashCode = series[i].m_hash;
  loaderDicom.createVolumeFromSlices(volSet, i, hashCode);
}

// hide this modal
const onHideFunc = this.props.onHide;
onHideFunc(true);
}
  render() {
    const store = this.props;

    let viewMode = store.modeView;

    const str3dLight = viewMode === ModeView.VIEW_3D_LIGHT ? "primary" : "secondary";

    const stateVis = this.props.stateVis;
    const onHideFunc = this.props.onHide;

    const stylePreview = {
      width: '500px',
      height: '400px',
    };

    const jsxCanvas = <canvas ref={ (mount) => {this.m_objCanvas = mount} } style={stylePreview} width="500px" height="400px" />;

    // const valToolTps = true;

    // let valMin = 0;
    // let valMax = 5000;
    // let valDelta = valMax - valMin;
    // let valStep = 50;
    if (this.m_dataMin !== LARGE_NUMBER) {
      // valMin = this.m_dataMin;
      // valMax = this.m_dataMax;
      // valDelta = valMax - valMin;
      // valStep = Math.floor(valDelta / 32);
    }

    // const rangeTwo = {
    //   'min': Math.floor(valMin - valDelta / 4),
    //   'max': Math.floor(valMax + valDelta / 4)
    // }
    // const wMin = Math.floor(this.state.windowMin);
    // const wMax = Math.floor(this.state.windowMax);
    // const wArr = [wMin, wMax];

    const jxsModal = 
      <Modal show={stateVis} onHide={onHideFunc} size="xl">
        <Modal.Header closeButton>
         
        </Modal.Header>
        <Modal.Body>
          <Container>
            <Row>
              <Col xs md lg="12" ref={ (mount) => {this.m_objCol = mount} } >
                <p className="text-center">
                  {jsxCanvas}
                </p>
              </Col>
            </Row>

           

            <Row>
              <Col xs md lg="5">
              </Col>
              <Col xs md lg="3">
              <ButtonGroup className="mr-2" aria-label="Top group">
          <OverlayTrigger
            key="3dLight"
            placement="bottom"
            overlay={
              <Tooltip>Prepare 2D</Tooltip>
            }
          >
            <Button variant={str3dLight} onClick={this.onMode3dLight }>
              2D Image Creation
             
            </Button>
          </OverlayTrigger>
        </ButtonGroup>
              </Col>
            
            </Row>
          </Container>

        </Modal.Body>
      </Modal>
    return jxsModal;
  } // end render
} // end class UiWindowCenterWidth

export default connect(store => store)(UiModalWindowCenterWidth);
