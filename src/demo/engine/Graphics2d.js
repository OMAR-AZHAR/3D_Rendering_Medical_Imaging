import React from "react";
import { connect } from "react-redux";

import Modes2d from "../store/Modes2d";
import StoreActionType from "../store/ActionTypes";
import Segm2d from "./Segm2d";

import RoiPalette from "./loaders/roipalette";
class Graphics2d extends React.Component {
  /**
   * @param {object} props - props from up level object
   */
  constructor(props) {
    super(props);

    this.m_sliceRatio = 0.5;
    this.m_mode2d = Modes2d.TRANSVERSE;

    // scale
    this.m_zoom = 1;
    this.m_xPos = 0;
    this.m_yPos = 0;

    // mounted
    this.m_isMounted = false;

    // actual render window dimenison
    this.state = {
      wRender: 0,
      hRender: 0,
      stateMouseDown: false,
      xMouse: -1,
      yMouse: -1,
    };
    // segm 2d
    this.segm2d = new Segm2d(this);
    this.m_isSegmented = false;

    // roi
    this.m_roiPalette = new RoiPalette();

    // store
    const store = props;
    store.dispatch({ type: StoreActionType.SET_GRAPHICS_2D, graphics2d: this });
  }

  componentDidMount() {
    this.m_isMounted = true;
    // this.start();
    // this.renderScene();

    this.prepareImageForRender();
    this.renderReadyImage();

    // detect actual render window dims
    const w = this.m_mount.clientWidth;
    const h = this.m_mount.clientHeight;
    if (this.state.wRender === 0) {
      this.setState({ wRender: w });
      this.setState({ hRender: h });
    }
  }

  componentWillUnmount() {
    this.m_isMounted = false;
  }

  componentDidUpdate() {
    // this.prepareImageForRender();
    if (this.m_isMounted) {
      this.renderReadyImage();
    }
  }

  /**
   * Get screenshot
   *
   * @param {nuimber} wShot - x size of screenshot
   * @param {nuimber} hShot - y size of screenshot
   */
  screenshot(wShot, hShot) {
    const objCanvas = this.m_mount;
    const dataUrl = objCanvas.toDataURL();
    return dataUrl;
  }

  /**
   * Render text info about volume
   *
   * @param {object} ctx - render context
   * @param {VolumeSet} volSet - volume set to rener
   */
  renderTextInfo(ctx, volSet, vol) {
    let strMsg;
    let xText = 4;
    let yText = 4;
    const FONT_SZ = 16;
    ctx.font = FONT_SZ.toString() + "px Arial";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillStyle = "grey";

    strMsg =
      "volume dim = " +
      vol.m_xDim.toString() +
      " * " +
      vol.m_yDim.toString() +
      " * " +
      vol.m_zDim.toString();
    ctx.fillText(strMsg, xText, yText);
    yText += FONT_SZ;

    const xSize = Math.floor(vol.m_boxSize.x);
    const ySize = Math.floor(vol.m_boxSize.y);
    const zSize = Math.floor(vol.m_boxSize.z);
    strMsg =
      "vol phys size = " +
      xSize.toString() +
      " * " +
      ySize.toString() +
      " * " +
      zSize.toString();
    ctx.fillText(strMsg, xText, yText);
    yText += FONT_SZ;

    const patName = volSet.m_patientName;
    if (patName.length > 1) {
      strMsg = "patient name = " + patName;
      ctx.fillText(strMsg, xText, yText);
      yText += FONT_SZ;
    }
    const patBirth = volSet.m_patientBirth;
    if (patBirth.length > 1) {
      strMsg = "patient birth = " + patBirth;
      ctx.fillText(strMsg, xText, yText);
      yText += FONT_SZ;
    }
    const seriesDescr = volSet.m_seriesDescr;
    if (seriesDescr.length > 1) {
      strMsg = "series descr = " + seriesDescr;
      ctx.fillText(strMsg, xText, yText);
      yText += FONT_SZ;
    }
    const institutionName = volSet.m_institutionName;
    if (institutionName.length > 1) {
      strMsg = "institution name = " + institutionName;
      ctx.fillText(strMsg, xText, yText);
      yText += FONT_SZ;
    }
    const operatorsName = volSet.m_operatorsName;
    if (operatorsName.length > 1) {
      strMsg = "operators name = " + operatorsName;
      ctx.fillText(strMsg, xText, yText);
      yText += FONT_SZ;
    }
    const physicansName = volSet.m_physicansName;
    if (physicansName.length > 1) {
      strMsg = "physicans name = " + physicansName;
      ctx.fillText(strMsg, xText, yText);
      yText += FONT_SZ;
    }
  }

  prepareImageForRender(volIndexArg) {
    // console.log('prepareImageForRender ...');
    const objCanvas = this.m_mount;
    if (objCanvas === null) {
      return;
    }
    const ctx = objCanvas.getContext("2d");
    const w = objCanvas.clientWidth;
    const h = objCanvas.clientHeight;
    if (w * h === 0) {
      return;
    }

    const store = this.props;

    ctx.fillStyle = "rgb(64, 64, 64)";
    ctx.fillRect(0, 0, w, h);
    // console.log(`render scene 2d. screen = ${w} * ${h}`);

    // Test draw chessboard
    const NEED_TEST_RAINBOW = false;
    if (NEED_TEST_RAINBOW) {
      const wImg = 800;
      const hImg = 600;
      const imgData = ctx.createImageData(wImg, hImg);
      const dataDst = imgData.data;
      let j = 0;
      for (let y = 0; y < hImg; y++) {
        for (let x = 0; x < wImg; x++) {
          dataDst[j + 0] = Math.floor((255 * x) / wImg);
          dataDst[j + 1] = Math.floor((255 * y) / hImg);
          dataDst[j + 2] = 120;
          dataDst[j + 3] = 255;
          j += 4;
        } // for (x)
      } // for (y)
      ctx.putImageData(imgData, 0, 0);
    }

    const volSet = store.volumeSet;
    // const volIndex = this.m_volumeIndex;
    const volIndex =
      volIndexArg !== undefined ? volIndexArg : store.volumeIndex;

    const vol = volSet.getVolume(volIndex);
    const mode2d = this.m_mode2d;
    const sliceRatio = store.slider2d;

    if (vol !== null) {
      if (vol.m_dataArray === null) {
        console.log("Graphics2d. Volume has no data array");
        return;
      }
      const xDim = vol.m_xDim;
      const yDim = vol.m_yDim;
      const zDim = vol.m_zDim;
      const xyDim = xDim * yDim;
      const dataSrc = vol.m_dataArray; // 1 or 4 bytes array of pixels
      if (dataSrc.length !== xDim * yDim * zDim * vol.m_bytesPerVoxel) {
        console.log(
          `Bad src data len = ${dataSrc.length}, but expect ${xDim}*${yDim}*${zDim}`
        );
      }

      // console.log(`Graphics2d. prepareImageForRender. mode= ${mode2d}`);

      const ONE = 1;
      const FOUR = 4;
      const OFF_3 = 3;

      let imgData = null;
      let dataDst = null;

      const roiPal256 = this.m_roiPalette.getPalette256();

      // determine actual render square (not w * h - viewport)
      // calculate area using physical volume dimension
      const TOO_SMALL = 1.0e-5;
      const pbox = vol.m_boxSize;
      if (pbox.x * pbox.y * pbox.z < TOO_SMALL) {
        console.log(
          `Bad physical dimensions for rendered volume = ${pbox.x}*${pbox.y}*${pbox.z} `
        );
      }
      let wScreen = 0,
        hScreen = 0;

      const xPos = store.render2dxPos;
      const yPos = store.render2dyPos;
      const zoom = store.render2dZoom;
      // console.log(`Gra2d. RenderScene. zoom=${zoom}, xyPos=${xPos}, ${yPos}`);
      if (mode2d === Modes2d.TRANSVERSE) {
        // calc screen rect based on physics volume slice size (z slice)
        const xyRratio = pbox.x / pbox.y;
        wScreen = w;
        hScreen = Math.floor(w / xyRratio);
        if (hScreen > h) {
          hScreen = h;
          wScreen = Math.floor(h * xyRratio);
          if (wScreen > w) {
            console.log(
              `logic error! wScreen * hScreen = ${wScreen} * ${hScreen}`
            );
          }
        }
        hScreen = hScreen > 0 ? hScreen : 1;

        // create image data
        imgData = ctx.createImageData(wScreen, hScreen);
        dataDst = imgData.data;
        if (dataDst.length !== wScreen * hScreen * 4) {
          console.log(
            `Bad dst data len = ${dataDst.length}, but expect ${wScreen}*${hScreen}*4`
          );
        }

        // z slice
        let zSlice = Math.floor(zDim * sliceRatio);
        zSlice = zSlice < zDim ? zSlice : zDim - 1;
        const zOff = zSlice * xyDim;
        const xStep = (zoom * xDim) / wScreen;
        const yStep = (zoom * yDim) / hScreen;
        let j = 0;
        let ay = yPos * yDim;
        if (vol.m_bytesPerVoxel === ONE) {
          for (let y = 0; y < hScreen; y++, ay += yStep) {
            const ySrc = Math.floor(ay);
            const yOff = ySrc * xDim;
            let ax = xPos * xDim;
            for (let x = 0; x < wScreen; x++, ax += xStep) {
              const xSrc = Math.floor(ax);
              const val = dataSrc[zOff + yOff + xSrc];
              dataDst[j + 0] = val;
              dataDst[j + 1] = val;
              dataDst[j + 2] = val;
              dataDst[j + 3] = 255; // opacity
              j += 4;
            } // for (x)
          } // for (y)
        } else if (vol.m_bytesPerVoxel === FOUR) {
          for (let y = 0; y < hScreen; y++, ay += yStep) {
            const ySrc = Math.floor(ay);
            const yOff = ySrc * xDim;
            let ax = xPos * xDim;
            for (let x = 0; x < wScreen; x++, ax += xStep) {
              const xSrc = Math.floor(ax);
              const val = dataSrc[(zOff + yOff + xSrc) * FOUR + OFF_3];
              const val4 = val * FOUR;
              const rCol = roiPal256[val4 + 0];
              const gCol = roiPal256[val4 + 1];
              const bCol = roiPal256[val4 + 2];

              dataDst[j + 0] = bCol;
              dataDst[j + 1] = gCol;
              dataDst[j + 2] = rCol;
              dataDst[j + 3] = 255;
              j += 4;
            } // for (x)
          } // for (y)
        } // if 4 bpp
      } else if (mode2d === Modes2d.SAGGITAL) {
        // calc screen rect based on physics volume slice size (x slice)
        const yzRatio = pbox.y / pbox.z;
        wScreen = w;
        hScreen = Math.floor(w / yzRatio);
        if (hScreen > h) {
          hScreen = h;
          wScreen = Math.floor(h * yzRatio);
          if (wScreen > w) {
            console.log(
              `logic error! wScreen * hScreen = ${wScreen} * ${hScreen}`
            );
          }
        }
        hScreen = hScreen > 0 ? hScreen : 1;

        // create image data
        imgData = ctx.createImageData(wScreen, hScreen);
        dataDst = imgData.data;
        if (dataDst.length !== wScreen * hScreen * 4) {
          console.log(
            `Bad dst data len = ${dataDst.length}, but expect ${wScreen}*${hScreen}*4`
          );
        }

        // x slice
        let xSlice = Math.floor(xDim * sliceRatio);
        xSlice = xSlice < xDim ? xSlice : xDim - 1;

        const yStep = (zoom * yDim) / wScreen;
        const zStep = (zoom * zDim) / hScreen;
        let j = 0;
        let az = yPos * zDim;
        if (vol.m_bytesPerVoxel === ONE) {
          for (let y = 0; y < hScreen; y++, az += zStep) {
            const zSrc = Math.floor(az);
            const zOff = zSrc * xDim * yDim;
            let ay = xPos * yDim;
            for (let x = 0; x < wScreen; x++, ay += yStep) {
              const ySrc = Math.floor(ay);
              const yOff = ySrc * xDim;
              const val = dataSrc[zOff + yOff + xSlice];

              dataDst[j + 0] = val;
              dataDst[j + 1] = val;
              dataDst[j + 2] = val;
              dataDst[j + 3] = 255; // opacity

              j += 4;
            } // for (x)
          } // for (y)
        } else if (vol.m_bytesPerVoxel === FOUR) {
          for (let y = 0; y < hScreen; y++, az += zStep) {
            const zSrc = Math.floor(az);
            const zOff = zSrc * xDim * yDim;
            let ay = xPos * yDim;
            for (let x = 0; x < wScreen; x++, ay += yStep) {
              const ySrc = Math.floor(ay);
              const yOff = ySrc * xDim;
              const val = dataSrc[(zOff + yOff + xSlice) * FOUR + OFF_3];
              const val4 = val * FOUR;
              const rCol = roiPal256[val4 + 0];
              const gCol = roiPal256[val4 + 1];
              const bCol = roiPal256[val4 + 2];

              dataDst[j + 0] = bCol;
              dataDst[j + 1] = gCol;
              dataDst[j + 2] = rCol;
              dataDst[j + 3] = 255; // opacity

              j += 4;
            } // for (x)
          } // for (y)
        } // if 4 bppp
      } else if (mode2d === Modes2d.CORONAL) {
        // calc screen rect based on physics volume slice size (y slice)
        const xzRatio = pbox.x / pbox.z;
        wScreen = w;
        hScreen = Math.floor(w / xzRatio);
        if (hScreen > h) {
          hScreen = h;
          wScreen = Math.floor(h * xzRatio);
          if (wScreen > w) {
            console.log(
              `logic error! wScreen * hScreen = ${wScreen} * ${hScreen}`
            );
          }
        }
        hScreen = hScreen > 0 ? hScreen : 1;

        // create image data
        imgData = ctx.createImageData(wScreen, hScreen);
        dataDst = imgData.data;
        if (dataDst.length !== wScreen * hScreen * 4) {
          console.log(
            `Bad dst data len = ${dataDst.length}, but expect ${wScreen}*${hScreen}*4`
          );
        }

        // y slice
        let ySlice = Math.floor(yDim * sliceRatio);
        ySlice = ySlice < yDim ? ySlice : yDim - 1;
        const yOff = ySlice * xDim;

        const xStep = (zoom * xDim) / wScreen;
        const zStep = (zoom * zDim) / hScreen;
        let j = 0;
        let az = yPos * zDim;
        if (vol.m_bytesPerVoxel === ONE) {
          for (let y = 0; y < hScreen; y++, az += zStep) {
            const zSrc = Math.floor(az);
            const zOff = zSrc * xDim * yDim;
            let ax = xPos * xDim;
            for (let x = 0; x < wScreen; x++, ax += xStep) {
              const xSrc = Math.floor(ax);
              const val = dataSrc[zOff + yOff + xSrc];

              dataDst[j + 0] = val;
              dataDst[j + 1] = val;
              dataDst[j + 2] = val;
              dataDst[j + 3] = 255; // opacity

              j += 4;
            } // for (x)
          } // for (y)
        } else if (vol.m_bytesPerVoxel === FOUR) {
          for (let y = 0; y < hScreen; y++, az += zStep) {
            const zSrc = Math.floor(az);
            const zOff = zSrc * xDim * yDim;
            let ax = xPos * xDim;
            for (let x = 0; x < wScreen; x++, ax += xStep) {
              const xSrc = Math.floor(ax);
              const val = dataSrc[(zOff + yOff + xSrc) * FOUR + OFF_3];
              const val4 = val * FOUR;
              const rCol = roiPal256[val4 + 0];
              const gCol = roiPal256[val4 + 1];
              const bCol = roiPal256[val4 + 2];

              dataDst[j + 0] = bCol;
              dataDst[j + 1] = gCol;
              dataDst[j + 2] = rCol;
              dataDst[j + 3] = 255; // opacity

              j += 4;
            } // for (x)
          } // for (y)
        } // end if 4 bpp
      }

      this.imgData = imgData;
      this.segm2d.setImageData(imgData);
    } // if vol not null
  } // prepareImageForRender

  renderReadyImage() {
    // console.log('renderReadyImage ...');
    if (!this.m_isMounted) {
      return;
    }

    const objCanvas = this.m_mount;
    if (objCanvas === null) {
      return;
    }
    const ctx = objCanvas.getContext("2d");
    const store = this.props;

    const volSet = store.volumeSet;
    if (volSet.getNumVolumes() === 0) {
      return;
    }
    const volIndex = store.volumeIndex;
    const vol = volSet.getVolume(volIndex);
    if (vol === null) {
      return;
    }

    const isSegm = this.m_isSegmented;
    if (isSegm) {
      const w = this.m_toolPick.m_wScreen;
      const h = this.m_toolPick.m_hScreen;
      this.segm2d.render(ctx, w, h, this.imgData);
    } else {
      ctx.putImageData(this.imgData, 0, 0);
    }
    // render text info
    this.renderTextInfo(ctx, volSet, vol);
  }

  /**
   * Invoke forced rendering, after some tool visual changes
   */
  forceUpdate(volIndex) {
    // console.log('forceUpdate ...');
    this.prepareImageForRender(volIndex);
    // this.forceRender();
    if (this.m_isSegmented) {
      // need to draw segmented image
      if (this.segm2d.model !== null) {
        // we have loaded model: applt it to image
        this.segm2d.startApplyImage();
      }
    } else {
      this.forceRender();
    } // if not segmented image
  }

  forceRender() {
    if (this.m_isMounted) {
      // console.log('forceRender ...');
      this.setState({ state: this.state });
    }
  }

  /**
   * Main component render func callback
   */
  render() {
    // const store = this.props;
    // const volSet = store.volumeSet;
    this.m_sliceRatio = this.props.sliderValue;
    this.m_mode2d = this.props.mode2d;

    const styleObj = {
      width: "100%",
      height: "100%",
    };

    const jsxGrapNonSized = (
      <canvas
        ref={(mount) => {
          this.m_mount = mount;
        }}
        style={styleObj}
      />
    );
    const jsxGrapSized = (
      <canvas
        ref={(mount) => {
          this.m_mount = mount;
        }}
        width={this.state.wRender}
        height={this.state.hRender}
        onMouseDown={this.onMouseDown}
        onMouseUp={this.onMouseUp}
        onMouseMove={this.onMouseMove}
        onWheel={this.onMouseWheel}
      />
    );
    const jsx = this.state.wRender > 0 ? jsxGrapSized : jsxGrapNonSized;
    return jsx;
  }
}

export default connect((store) => store)(Graphics2d);
