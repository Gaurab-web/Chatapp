import React from "react"
import { Platform } from "react-native"

import firebase from 'react-native-firebase';
import AsyncStorage from '@react-native-community/async-storage';

const DUMMY_TOKEN = ""
var deviceToken = "deviceToken"

export const getToken = () => {
    return new Promise((resolve, reject) => {
        AsyncStorage.getItem(deviceToken)
            .then((value) => {
                if (value)
                    resolve(value)
                else
                    resolve(DUMMY_TOKEN)
            }).catch((error) => {
                reject("Token could not be generated")
            })
    })
}

export const generateDeviceToken = () => {
    return new Promise((resolve, reject) => {

        if (Platform.OS === 'ios') {

            firebase.messaging().requestPermission().then(() =>{
                firebase.messaging()
                .ios
                .getAPNSToken()
                .then((value) => {
                    console.log("TOKEN: ",value)
                    if (value) {
                        //alert("Token:\n"+value)
                        AsyncStorage.setItem(deviceToken, value)
                        resolve(value)
                    } else {
                        AsyncStorage.getItem(deviceToken)
                            .then((value) => {
                                if (value)
                                    resolve(value)
                                else
                                    resolve(DUMMY_TOKEN)
                            }).catch((error) => {
                                reject("Token could not be generated")
                            })
                    }
                }).catch(() => {
                    AsyncStorage.getItem(deviceToken)
                        .then((value) => {
                            if (value)
                                resolve(value)
                            else
                                resolve(DUMMY_TOKEN)
                        }).catch((error2) => {
                            reject("Token could not be generated")
                        })

                })
            }).catch((error) =>{
                reject(error)
            })
            
        } else {

            fcmToken = firebase.messaging().getToken()
                .then((value) => {
                    if (value) {
                        AsyncStorage.setItem(deviceToken, value)
                        resolve(value)
                    } else {
                        AsyncStorage.getItem(deviceToken)
                            .then((value) => {
                                if (value)
                                    resolve(value)
                                else
                                    resolve(DUMMY_TOKEN)
                            }).catch((error) => {
                                reject("Token could not be generated")
                            })
                    }
                })
                .catch((error) => {
                    AsyncStorage.getItem(deviceToken)
                        .then((value) => {
                            if (value)
                                resolve(value)
                            else
                                resolve(DUMMY_TOKEN)
                        }).catch((error) => {
                            reject("Token could not be generated")
                        })
                })
        }
    })
}