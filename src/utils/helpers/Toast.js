import { Alert, ToastAndroid } from 'react-native'
import Toast from 'react-native-simple-toast'



export default function showErrorAlert(message) {

    if (Platform.OS == "android") {
      ToastAndroid.show(message, ToastAndroid.SHORT);
    } else {
      // Alert.alert(title, message, { text: 'OK', onPress: () => { } }, { cancelable: true })
     Toast.show(message,Toast.SHORT)
    }
  }