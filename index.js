import { NativeModules, NativeEventEmitter, Platform, Alert } from "react-native";
import { connectToHost, exchange_text } from './src/utilities';
const { BluetoothManager, BluetoothEscposPrinter, BluetoothTscPrinter, RNNetPrinter } =
  NativeModules;

const PrinterOptions = {
  beep: false,
  cut: false,
  tailingLine: false,
  encoding: '',
}
const PrinterImageOptions = {
  beep: false,
  cut: false,
  tailingLine: false,
  encoding: '',
  imageWidth: 0,
  imageHeight: 0,
  printerWidthType: 80,
  paddingX: 0
}

const textPreprocessingIOS = (text, canCut = true, beep = true) => {
  let options = {
    beep: beep,
    cut: canCut,
  };
  return {
    text: text
      .replace(/<\/?CB>/g, "")
      .replace(/<\/?CM>/g, "")
      .replace(/<\/?CD>/g, "")
      .replace(/<\/?C>/g, "")
      .replace(/<\/?D>/g, "")
      .replace(/<\/?B>/g, "")
      .replace(/<\/?M>/g, ""),
    opts: options,
  };
};

const textTo64Buffer = (text, opts = PrinterOptions) => {
  const defaultOptions = {
    beep: false,
    cut: false,
    tailingLine: false,
    encoding: "UTF8",
  };

  const options = {
    ...defaultOptions,
    ...opts,
  };

  const fixAndroid = "\n";
  const buffer = exchange_text(text + fixAndroid, options);
  return buffer.toString("base64");
};

// export interface INetPrinter {
//   host: string;
//   port: number;
// }
const NetPrinter = {
  init: () => new Promise((resolve, reject) => {
    RNNetPrinter.init(
      () => resolve(),
      (error) => reject(error)
    );
  }),

  getDeviceList: () => new Promise((resolve, reject) => {
    try {
      RNNetPrinter.getDeviceList(
        (printers) => resolve(printers),
        (error) => reject(error)
      );
    } catch (error) {
      reject(error?.message || `Không thể getDeviceList`);
    }
    
  }),

  connectPrinter: (host, port, timeout) => new Promise(async (resolve, reject) => {
    try {
      await connectToHost(host, timeout);
      RNNetPrinter.connectPrinter(
        host,
        port,
        printer => resolve(printer),
        error => reject(error)
      );
    } catch (error) {
      reject(error?.message || `Connect to ${host} fail`);
    }
  }),

  closeConn: () => new Promise((resolve) => {
    RNNetPrinter.closeConn();
    resolve();
  }),

  printText: (text, opts = {}) => {
    if (Platform.OS === "ios") {
      const processedText = textPreprocessingIOS(text, false, false);
      RNNetPrinter.printRawData(
        processedText.text,
        processedText.opts,
        (error) => console.log(error)
      );
    } else {
      RNNetPrinter.printRawData(textTo64Buffer(text, opts), (error) =>
        console.log(error)
      );
    }
  },

  printBill: (text, opts = {}) => {
    if (Platform.OS === "ios") {
      const processedText = textPreprocessingIOS(
        text,
        opts?.cut ?? true,
        opts.beep ?? true
      );
      RNNetPrinter.printRawData(
        processedText.text,
        processedText.opts,
        (error) => console.log(error)
      );
    } else {
      RNNetPrinter.printRawData(billTo64Buffer(text, opts), (error) =>
        console.log(error)
      );
    }
  },

  // printImage: function (imgUrl, opts = {}) {
  //   if (Platform.OS === "ios") {
  //     RNNetPrinter.printImageData(imgUrl, opts, (error) =>
  //       console.log(error)
  //     );
  //   } else {
  //     RNNetPrinter.printImageData(
  //       imgUrl,
  //       opts?.imageWidth ?? 0,
  //       opts?.imageHeight ?? 0,
  //       (error) => console.log(error)
  //     );
  //   }
  // },
  printImage: function (imgUrl, opts = {}) {
    if (Platform.OS === "ios") {
      RNNetPrinter.printImageData(imgUrl, opts, (error) =>
        // console.log(error)
        Alert.alert('Thông báo!', 'Chưa kết nối với máy in, vui lòng kiểm tra lại!')
      );
    } else {
      RNNetPrinter.printImageData(
        imgUrl,
        opts?.imageWidth ?? 0,
        opts?.imageHeight ?? 0,
        (error) => Alert.alert('Thông báo!', 'Chưa kết nối với máy in, vui lòng kiểm tra lại!')
      );
    }
  },

  printImageBase64: function (Base64, opts = {}) {
    if (Platform.OS === "ios") {
      RNNetPrinter.printImageBase64(Base64, opts, (error) =>
      Alert.alert('Thông báo!', 'Chưa kết nối với máy in, vui lòng kiểm tra lại!')
      );
    } else {
      RNNetPrinter.printImageBase64(
        Base64,
        opts?.imageWidth ?? 0,
        opts?.imageHeight ?? 0,
        (error) => Alert.alert('Thông báo!', `Chưa kết nối với máy in, vui lòng kiểm tra lại!`)
      );
    }
  },

  printRaw: (text) => {
    if (Platform.OS === "ios") {
    } else {
      RNNetPrinter.printRawData(text, (error) => console.log(error));
    }
  },

  printColumnsText: (
    texts,
    columnWidth,
    columnAlignment,
    columnStyle = [],
    opts = {}
  ) => {
    const result = processColumnText(
      texts,
      columnWidth,
      columnAlignment,
      columnStyle
    );
    if (Platform.OS === "ios") {
      const processedText = textPreprocessingIOS(result, false, false);
      RNNetPrinter.printRawData(
        processedText.text,
        processedText.opts,
        (error) => console.warn(error)
      );
    } else {
      RNNetPrinter.printRawData(textTo64Buffer(result, opts), (error) =>
        console.warn(error)
      );
    }
  },
};

const NetPrinterEventEmitter =
  Platform.OS === "ios"
    ? new NativeEventEmitter(RNNetPrinter)
    : new NativeEventEmitter();

// export { NetPrinter, NetPrinterEventEmitter };


const RN_THERMAL_RECEIPT_PRINTER_EVENTS = {
  EVENT_NET_PRINTER_SCANNED_SUCCESS: "scannerResolved",
  EVENT_NET_PRINTER_SCANNING: "scannerRunning",
  EVENT_NET_PRINTER_SCANNED_ERROR: "registerError",
};

// export { RN_THERMAL_RECEIPT_PRINTER_EVENTS };


BluetoothTscPrinter.DIRECTION = {
  FORWARD: 0,
  BACKWARD: 1,
};

BluetoothTscPrinter.DENSITY = {
  DNESITY0: 0,
  DNESITY1: 1,
  DNESITY2: 2,
  DNESITY3: 3,
  DNESITY4: 4,
  DNESITY5: 5,
  DNESITY6: 6,
  DNESITY7: 7,
  DNESITY8: 8,
  DNESITY9: 9,
  DNESITY10: 10,
  DNESITY11: 11,
  DNESITY12: 12,
  DNESITY13: 13,
  DNESITY14: 14,
  DNESITY15: 15,
};
BluetoothTscPrinter.BARCODETYPE = {
  CODE128: "128",
  CODE128M: "128M",
  EAN128: "EAN128",
  ITF25: "25",
  ITF25C: "25C",
  CODE39: "39",
  CODE39C: "39C",
  CODE39S: "39S",
  CODE93: "93",
  EAN13: "EAN13",
  EAN13_2: "EAN13+2",
  EAN13_5: "EAN13+5",
  EAN8: "EAN8",
  EAN8_2: "EAN8+2",
  EAN8_5: "EAN8+5",
  CODABAR: "CODA",
  POST: "POST",
  UPCA: "EAN13",
  UPCA_2: "EAN13+2",
  UPCA_5: "EAN13+5",
  UPCE: "EAN13",
  UPCE_2: "EAN13+2",
  UPCE_5: "EAN13+5",
  CPOST: "CPOST",
  MSI: "MSI",
  MSIC: "MSIC",
  PLESSEY: "PLESSEY",
  ITF14: "ITF14",
  EAN14: "EAN14",
};
BluetoothTscPrinter.FONTTYPE = {
  FONT_1: "1",
  FONT_2: "2",
  FONT_3: "3",
  FONT_4: "4",
  FONT_5: "5",
  FONT_6: "6",
  FONT_7: "7",
  FONT_8: "8",
  SIMPLIFIED_CHINESE: "TSS24.BF2",
  TRADITIONAL_CHINESE: "TST24.BF2",
  KOREAN: "K",
};
BluetoothTscPrinter.EEC = {
  LEVEL_L: "L",
  LEVEL_M: "M",
  LEVEL_Q: "Q",
  LEVEL_H: "H",
};
BluetoothTscPrinter.ROTATION = {
  ROTATION_0: 0,
  ROTATION_90: 90,
  ROTATION_180: 180,
  ROTATION_270: 270,
};
BluetoothTscPrinter.FONTMUL = {
  MUL_1: 1,
  MUL_2: 2,
  MUL_3: 3,
  MUL_4: 4,
  MUL_5: 5,
  MUL_6: 6,
  MUL_7: 7,
  MUL_8: 8,
  MUL_9: 9,
  MUL_10: 10,
};
BluetoothTscPrinter.BITMAP_MODE = {
  OVERWRITE: 0,
  OR: 1,
  XOR: 2,
};
BluetoothTscPrinter.PRINT_SPEED = {
  SPEED1DIV5: 1,
  SPEED2: 2,
  SPEED3: 3,
  SPEED4: 4,
};
BluetoothTscPrinter.TEAR = {
  ON: "ON",
  OFF: "OFF",
};
BluetoothTscPrinter.READABLE = {
  DISABLE: 0,
  EANBLE: 1,
};

BluetoothEscposPrinter.ERROR_CORRECTION = {
  L: 1,
  M: 0,
  Q: 3,
  H: 2,
};

BluetoothEscposPrinter.BARCODETYPE = {
  UPC_A: 65, //11<=n<=12
  UPC_E: 66, //11<=n<=12
  JAN13: 67, //12<=n<=12
  JAN8: 68, //7<=n<=8
  CODE39: 69, //1<=n<=255
  ITF: 70, //1<=n<=255(even numbers)
  CODABAR: 71, //1<=n<=255
  CODE93: 72, //1<=n<=255
  CODE128: 73, //2<=n<=255
};
BluetoothEscposPrinter.ROTATION = {
  OFF: 0,
  ON: 1,
};
BluetoothEscposPrinter.ALIGN = {
  LEFT: 0,
  CENTER: 1,
  RIGHT: 2,
};
BluetoothEscposPrinter.DEVICE_WIDTH = {
  WIDTH_58: 384,
  WIDTH_80: 576,
};
module.exports = {
  BluetoothManager,
  BluetoothEscposPrinter,
  BluetoothTscPrinter,
  RN_THERMAL_RECEIPT_PRINTER_EVENTS,
  NetPrinter, NetPrinterEventEmitter
};
