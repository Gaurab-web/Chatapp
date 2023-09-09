import React, {useEffect, createContext, useState} from 'react';
import {
  NativeEventEmitter,
  NativeModules,
  Platform,
  PermissionsAndroid,
  Alert,
} from 'react-native';
import _ from 'lodash';
import Geolocation from 'react-native-geolocation-service';
import Geolocations from '@react-native-community/geolocation';
import {useDispatch, useSelector} from 'react-redux';
import BleManager from 'react-native-ble-manager';
import {
  setBluetoothStatus,
  getDisconnectedDevice,
} from '../../redux/Reducer/GolfCourseReducer';
const BleManagerModule = NativeModules.BleManager;
const bleManagerEmitter = new NativeEventEmitter(BleManagerModule);
import Realm from 'realm';
import showErrorAlert from './Toast';

export const BleContext = createContext();

let peripherals = [];
let scanCallBack = () => {};
let realm = new Realm({path: 'Powakaddy.realm'});
global.currentRegion = {};
global.isRequest = '';

export default function (props) {
  const dispatch = useDispatch();
  const [serialNum, setSerial] = useState('');
  const GolfCourseReducer = useSelector(state => state.GolfCourseReducer);

  useEffect(() => {
    BleManager.start({showAlert: false}).then(() => {
      BleManager.checkState();
      // console.log('Module initialized');
    });

    const handlerDidUpdateState = bleManagerEmitter.addListener(
      'BleManagerDidUpdateState',
      res => {
        // console.log('BleManagerDidUpdateState', res.state);
        if (res.state == 'off') {
          global.isRequest = '';
          dispatch(setBluetoothStatus(false));
          setTimeout(() => {
            updateDetails();
          }, 1000);
        } else if (res.state == 'on') {
          global.isRequest = '';
          dispatch(setBluetoothStatus(true));
          setTimeout(() => {
            autoConnectDevices(true);
          }, 3000);
        }
      },
    );

    const handlerDiscover = bleManagerEmitter.addListener(
      'BleManagerDiscoverPeripheral',
      peripheral => {
        // console.log('peripheral : ',peripheral);
        if (peripheral.name != null) {
          peripherals.push({
            id: peripheral?.id,
            name: peripheral.name,
          });
        }
      },
    );

    const handlerStop = bleManagerEmitter.addListener(
      'BleManagerStopScan',
      handleStopScan,
    );

    const handleDisconnect = bleManagerEmitter.addListener(
      'BleManagerDisconnectPeripheral',
      handleDisconnectedPeripheral,
    );

    const handleUpdateValue = bleManagerEmitter.addListener(
      'BleManagerDidUpdateValueForCharacteristic',
      handleUpdateValueForCharacteristic,
    );

    return () => {
      // console.log('unmount');
      handlerDidUpdateState.remove();
      handlerDiscover.remove();
      handlerStop.remove();
      handleDisconnect.remove();
      handleUpdateValue.remove();
    };
  }, []);

  async function hasPermission(callback = () => {}) {
    try {
      if (Platform.OS === 'android' && Platform.Version > 30) {
        PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        ).then(result => {
          if (result) {
            callback(true);
          } else {
            PermissionsAndroid.requestMultiple([
              PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
              PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADVERTISE,
              PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
              PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            ]).then(result => {
              // console.log('RESULT', result);
              if (
                result['android.permission.BLUETOOTH_ADVERTISE'] &&
                result['android.permission.BLUETOOTH_CONNECT'] &&
                result['android.permission.ACCESS_FINE_LOCATION'] &&
                result['android.permission.BLUETOOTH_SCAN'] === 'granted'
              ) {
                callback(true);
              } else if (
                result['android.permission.BLUETOOTH_ADVERTISE'] ||
                result['android.permission.BLUETOOTH_CONNECT'] ||
                result['android.permission.ACCESS_FINE_LOCATION'] ||
                result['android.permission.BLUETOOTH_SCAN'] ===
                  'never_ask_again'
              ) {
                callback(false);
                // 'Rad needs access to sacn nearby device',
                // 'Rad would like to use your bluetooth adapter to scan nearby devices.',
                Alert.alert(
                  'Powakaddy needs access to sacn nearby device',
                  'Your bluetooth is used for course updating on your Powakaddy device.',
                  [
                    {
                      text: translate('ok'),
                      onPress: () => {},
                    },
                  ],
                  {cancelable: false},
                );
              }
            });
          }
        });
      } else if (Platform.OS == 'android' && Platform.Version <= 30) {
        PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ).then(result => {
          if (result) {
            callback(true);
          } else {
            PermissionsAndroid.request(
              PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            ).then(result => {
              if (result) {
                callback(true);
              } else {
                callback(false);
                // 'TecTecTec needs access to search nearby courses',
                // 'Your location is used for local course search.',
                Alert.alert(
                  'Powakaddy needs access to sacn nearby device',
                  'Your location is used for local course search.',
                  [
                    {
                      text: translate('ok'),
                      onPress: () => {},
                    },
                  ],
                  {cancelable: false},
                );
              }
            });
          }
        });
      } else {
        callback(true);
      }
    } catch (error) {
      // console.log(error);
      callback(false);
    }
  }

  function checkPermission(callback = () => {}) {
    if (Platform.OS === 'android' && Platform.Version > 30) {
      PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADVERTISE,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      ).then(result => {
        if (result) {
          // console.log('Permission is OK', result);
          callback(true);
        } else {
          // console.log('Error');
          callback(false);
        }
      });
    } else if (Platform.OS == 'android' && Platform.Version <= 30) {
      PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ).then(result => {
        if (result) {
          callback(true);
        } else {
          callback(false);
        }
      });
    } else {
      callback(true);
    }
  }

  function getCurrentLocation(callback = () => {}) {
    if (Platform.OS == 'ios') {
      Geolocations.getCurrentPosition(
        position => {
          // setTimeout(() => {
          let obj = {
            latitude: position?.coords?.latitude,
            longitude: position?.coords?.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
            time: position?.timestamp,
          };
          global.currentRegion = obj;
          callback(obj);
          // }, 2000);
        },
        error => {
          callback({
            latitude: 0,
            longitude: 0,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
            time: new Date().getTime(),
          });
        },
        {
          enableHighAccuracy: false,
          timeout: 200000,
          maximumAge: 3600000,
        },
      );
    } else {
      Geolocation.getCurrentPosition(
        position => {
          global.currentRegion = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
            time: position.timestamp,
          };
          callback(global.currentRegion);
        },
        error => {
          console.log('error : ', error);
          callback({
            latitude: 0,
            longitude: 0,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
            time: new Date().getTime(),
          });
        },
        {
          enableHighAccuracy: false,
          timeout: 200000,
          maximumAge: 3600000,
        },
      );
    }
  }

  function autoConnectDevices(status) {
    var devices = realm.objects('bluetooth_devices');
    let arr = JSON.parse(JSON.stringify(devices));

    if (arr.length !== 0) {
      for (let i = 0; i < arr.length; i++) {
        if (arr[i]?.status == false) {
          autoConnection(arr[i]?.id, arr[i]?.bluetoothName, status);
        }
      }
    }
  }

  // Connect Device
  function autoConnection(id, name, status) {
    console.log('autoConnection : ');
    if (Platform.OS == 'android' && status) {
      connectionAndroid(id, name, status);
    } else if (Platform.OS == 'ios' && status) {
      connectionIos(id, name, status);
    } else {
      showErrorAlert('Please turn on your device bluetooth');
    }
  }

  // Connection ..
  function connectionAndroid(id, name, status) {
    connect(id, cr => {
      if (cr && status) {
        getAllBondedPeripherals(arr => {
          if (arr.length !== 0) {
            var result = arr.filter(i => i.id == id);

            if (!_.isEmpty(result)) {
              console.log('Connection Successfull');
              checkIosDevicePair(id, res => {
                if (res !== false) {
                  deviceUpdateStatus(id, true);
                }
              });
            } else if (status) {
              createBond(id, res => {
                if (res) {
                  console.log('Connection Successfull');

                  checkIosDevicePair(id, res => {
                    if (res !== false) {
                      deviceUpdateStatus(id, true);
                    }
                  });
                } else {
                  console.log('Connection Failed'); // --> Failed
                }
              });
            }
          } else if (status) {
            var result = arr.filter(i => i.id == id);
            createBond(id, res => {
              if (res) {
                // All func
                console.log('Connection Successfull');
                checkIosDevicePair(id, res => {
                  if (res !== false) {
                    deviceUpdateStatus(id, true);
                  }
                });
              } else {
                console.log('Connection Failed'); // --> Failed
              }
            });
          } else {
            console.log('Connection Failed'); // --> Failed
          }
        });
      } else {
        console.log('Connection Failed'); // --> Failed
      }
    });
  }

  function connectionIos(id, name, status) {
    connect(id, cr => {
      if (cr && status) {
        if (name == 'PowaKaddy Trolley' && status) {
          checkIosDevicePair(id, res => {
            if (res !== false) {
              console.log('Connection Successfully');
              deviceUpdateStatus(id, true);
            } else {
              console.log('Connection Failed'); // --> Failed
            }
          });
        } else if (name == 'PowaKaddy' && status) {
          // Working
        } else if (status) {
          // Others Devices
        } else {
          console.log('Connection Failed'); // --> Failed
        }
      } else {
        console.log('Connection Failed'); // --> Failed
      }
    });
  }

  // Check Ios Pair --> 'PowaKaddy Trolley'
  function checkIosDevicePair(id, callback = () => {}) {
    console.log('check --- ');
    let delay = Platform.OS == 'android' ? 35000 : 30000;
    let _ID;

    const _timeOut = setTimeout(() => {
      clearInterval(_ID);
      callback(false);
    }, delay);

    _ID = setInterval(() => {
      console.log('yyyy');
      getTrollyDeviceSettings(id, res => {
        if (res !== false) {
          clearInterval(_ID);
          clearTimeout(_timeOut);
          callback(res);
        } else {
          callback(false);
        }
      });
    }, 2500);
  }

  // Get Device Settings --> 'PowaKaddy Trolley'
  function getTrollyDeviceSettings(id, callback = () => {}) {
    readService(
      id,
      'FB340100-8000-0080-0010-0000433500CF', //Service ID
      'FB340103-8000-0080-0010-0000433500CF', //Characteristic UUID
      res => {
        console.log('Device Settings =====>', res);

        if (!_.isEmpty(res)) {
          callback(res);
        } else {
          callback(false);
        }
      },
    );
  }

  function deviceUpdateStatus(_, state) {
    console.log('Update auto ----');
    realm.write(() => {
      let obj = realm.objects('bluetooth_devices').find(item => {
        return item.id == _;
      });
      obj.status = state;
      // obj.auto_advance = state;
    });
  }

  function turnOnBluetooth(callBack = () => {}) {
    BleManager.enableBluetooth()
      .then(() => {
        // Success code
        // console.log('The bluetooth is already enabled or the user confirm');
        callBack(true);
      })
      .catch(error => {
        // Failure code
        // console.log('The user refuse to enable bluetooth');
        callBack(false);
      });
  }

  function startScan(callback = () => {}) {
    scanCallBack = callback;
    onScan();
  }

  const onScan = () => {
    peripherals = [];
    BleManager.scan([], 5, true)
      .then(results => {
        // console.log('Scanning...', results);
      })
      .catch(err => {
        scanCallBack([]);
      });
  };

  const handleStopScan = () => {
    scanCallBack(peripherals);
    // console.log('Scan stopped');
  };

  async function handleDisconnectedPeripheral(data) {
    console.log('handleDisconnectedPeripheral peripherals', data);
    // dispatch(getDisconnectedDevice(data));
    setTimeout(() => {
      // updateDetails();
      updateDB(data);
    }, 1000);

    console.log('global.isRequest 777: ', global.isRequest);
    if (global.isRequest == '') {
      setTimeout(() => {
        autoConnectDevices(true);
      }, 3000);
    } else if (global.isRequest !== data?.peripheral) {
      setTimeout(() => {
        console.log('++++SKSKSKS+++++');
        autoConnectDevices(true);
      }, 3000);
    }
  }

  function reset() {
    let id = null;
    clearTimeout(id);
    id = setTimeout(() => {
      global.isRequest = '';
    }, 30000);
  }

  function updateDB(data) {
    let obj = realm.objects('bluetooth_devices');
    console.log('OBJ', obj);

    let newObj = obj.find(d => d.id == data?.peripheral);
    // console.log('NewOBJ', newObj);

    if (newObj !== undefined) {
      connectionStatus(false, newObj?.id);
    }
  }

  function connectionStatus(state, id) {
    realm.write(() => {
      let obj = realm.objects('bluetooth_devices').find(item => {
        return item.id == id;
      });
      obj.status = state;
      console.log('Bluetooth status updated successfully');
    });
  }

  function handleUpdateValueForCharacteristic(data) {
    console.log('data : ', data);
  }

  function getAllBondedPeripherals(callBack = () => {}) {
    if (Platform.OS == 'android') {
      BleManager.getBondedPeripherals([])
        .then(bondedPeripheralsArray => {
          callBack(bondedPeripheralsArray);
        })
        .catch(() => {
          callBack([]);
        });
    } else {
      console.log('Not Supported');
    }
  }

  function removeBond(id, callBack = () => {}) {
    if (Platform.OS == 'android') {
      BleManager.removeBond(id)
        .then(() => {
          callBack(true);
        })
        .catch(() => {
          callBack(false);
          console.log('fail to bond');
        });
    } else {
      console.log('Not Supported');
    }
  }

  async function getPeripheralConnected(peripheralId, callBack = () => {}) {
    console.log('peripheralId : ', peripheralId);
    await BleManager.isPeripheralConnected(peripheralId, []).then(
      isConnected => {
        if (isConnected) {
          console.log('Peripheral is connected! : ', peripheralId);
          callBack(true);
        } else {
          console.log('Peripheral is NOT connected! ', peripheralId);
          callBack(false);
        }
      },
    );
  }

  function disconnect(peripheralId, callback = () => {}) {
    try {
      BleManager.disconnect(peripheralId)
        .then(() => {
          // console.log('Disconnected');
          if (Platform.OS == 'android') {
            // removePeripheral
            removeDevicePeripheral(peripheralId, rps => {
              if (rps) {
                callback(true);
              }
            });
          } else {
            callback(true);
          }
        })
        .catch(error => {
          // Failure code
          callback(false);
        });
    } catch (error) {
      callback(true);
    }
  }

  function removeDevicePeripheral(peripheralId, callback = () => {}) {
    try {
      BleManager.removePeripheral(peripheralId)
        .then(() => {
          // Success code
          // console.log('RemovePeripheral');
          callback(true);
        })
        .catch(error => {
          // Failure code
          callback(false);
        });
    } catch (error) {
      callback(true);
    }
  }

  // Connect Device
  async function connect(peripheralId, callback = () => {}) {
    console.log('Connection Establishig', peripheralId);

    const _timeOut = setTimeout(() => {
      callback(false);
    }, 40000);

    // if (Platform.OS == 'android') {
    //   setTimeout(() => {
    //     BleManager.isPeripheralConnected(peripheralId, []).then(isConnected => {
    //       //do not remove
    //       if (isConnected) {
    //         // console.log('Peripheral is connected!');
    //         clearTimeout(_timeOut);
    //         callback(true);
    //       }
    //     });
    //   }, 900);
    // }

    await BleManager.connect(peripheralId)
      .then(() => {
        console.log('Hurrah Connected');
        // callback(true);
        clearTimeout(_timeOut);
        retrieveService(peripheralId, rs => {
          if (rs) {
            callback(true);
            console.log('Retrieve Service Successfully..', rs);
          }
        });
      })
      .catch(err => {
        // console.log('connection error : --> ', err);
        callback(false);
      });

    // setTimeout(() => {
    //   // console.log('retrieveServices');

    //   BleManager.retrieveServices(peripheralId)
    //     .then(PeripheralInfo => {
    //       clearTimeout(_timeOut);
    //       callback(true);
    //       console.log('retrieveServices - ', PeripheralInfo);
    //     })
    //     .catch(error => {
    //       // console.log('error : ', error);
    //     });
    // }, 900);
  }

  function retrieveService(_id, callback = () => {}) {
    try {
      BleManager.retrieveServices(_id).then(peripheralInfo => {
        callback(peripheralInfo);
      });
    } catch (err) {
      callback(null);
    }
  }

  async function write(
    id,
    serviceId,
    characteristicUUID,
    data,
    callback = () => {},
  ) {
    try {
      if (Platform.OS == 'android') {
        await BleManager.writeWithoutResponse(
          id,
          serviceId,
          characteristicUUID,
          data,
        )
          .then(() => {
            // console.log('Wrote patch to device');
            callback(true);
          })
          .catch(error => {
            // Failure code
            callback(false);
          });
      } else {
        BleManager.writeWithoutResponse(id, serviceId, characteristicUUID, data)
          .then(() => {
            callback(true);
          })
          .catch(error => {
            // Failure code
            callback(false);
          });
      }
    } catch (err) {
      callback(false);
    }
  }

  async function onlyWrite(
    id,
    serviceId,
    characteristicUUID,
    data,
    callback = () => {},
  ) {
    console.log('WRITE ', id, serviceId, characteristicUUID, data);

    try {
      BleManager.write(id, serviceId, characteristicUUID, data)
        .then(() => {
          callback(true);
        })
        .catch(error => {
          // Failure code
          callback(false);
        });
    } catch (err) {
      callback(false);
    }
  }

  function writeWithoutResponse(
    id,
    serviceId,
    characteristicUUID,
    data,
    callback = () => {},
  ) {
    try {
      BleManager.writeWithoutResponse(id, serviceId, characteristicUUID, data)
        .then(() => {
          callback(true);
        })
        .catch(error => {
          // Failure code
          callback(false);
        });
    } catch (err) {
      callback(false);
    }
  }

  function readService(
    peripheral_id,
    serviceUUID,
    characteristicUUID,
    callback = () => {},
  ) {
    try {
      BleManager.read(peripheral_id, serviceUUID, characteristicUUID)
        .then(readData => {
          console.log('readData of Device: ', readData);
          // Success code

          callback(readData);
        })
        .catch(error => {
          // Failure code
          callback(null);
        });
    } catch (err) {
      callback(null);
    }
  }

  function updateDetails() {
    var devices = realm.objects('bluetooth_devices');
    let arr = JSON.parse(JSON.stringify(devices));

    if (arr.length !== 0) {
      for (let i = 0; i < arr.length; i++) {
        update(arr[i], false);
      }
    }
  }

  function update(_, state) {
    realm.write(() => {
      let obj = realm.objects('bluetooth_devices').find(item => {
        return item.id == _?.id;
      });
      obj.status = state;
      obj.auto_advance = state;
    });
  }

  // getConnectedPeripherals
  function getConnectedPeripherals(callback = () => {}) {
    try {
      BleManager.getConnectedPeripherals([]).then(peripheralsArray => {
        // Success code
        // console.log('Connected peripherals: ' + peripheralsArray.length);
        callback(peripheralsArray);
      });
    } catch (err) {
      // console.log('Error : ', err);
      callback(err);
    }
  }

  async function createBond(per_id, callBack = () => {}) {
    await BleManager.createBond(per_id)
      .then(() => { 
        console.log('Connection Success ');
        callBack(true);
      })
      .catch(err => {
        callBack(false);
        console.log('Connection Failed : ', err, 888); // --> Failed
        if (
          'Bond request has been denied' == err ||
          err == 'Create bond request fail'
        ) {
          global.isRequest = per_id;
          reset();
        }
      });
  }
  function getSerialNumber(res, val, callback = () => {}) {
    // console.log('Device Settings ====>', res, res?.length,val);
    let newArr = res?.slice(val, res?.length);
    // console.log('UsrStr', newArr);
    var result = '';
    for (let i = 0; i < newArr?.length; i++) {
      const num1 = newArr[i];
      const hex1 = num1.toString(16);
      // console.log('HEX', hex1);
      if (hex1?.length == 1) {
        let newHex = 0 + hex1;
        // console.log('NewHex', newHex);
        result += newHex;
      } else {
        result += hex1;
      }
    }

    callback(result);
    console.log('SERIAL NUMBER', result?.toUpperCase());
  }
  return (
    <BleContext.Provider
      value={{
        hasPermission: hasPermission,
        checkPermission: checkPermission,
        getCurrentLocation: getCurrentLocation,
        turnOnBluetooth: turnOnBluetooth,
        startScan: startScan,
        updateDetails: updateDetails,
        getAllBondedPeripherals: getAllBondedPeripherals,
        getPeripheralConnected: getPeripheralConnected,
        getConnectedPeripherals: getConnectedPeripherals,
        disconnect: disconnect,
        connect: connect,
        write: write,
        writeWithoutResponse: writeWithoutResponse,
        readService: readService,
        removeBond: removeBond,
        onlyWrite: onlyWrite,
        createBond: createBond,
        getSerialNumber: getSerialNumber,
      }}>
      {props.children}
    </BleContext.Provider>
  );
}

