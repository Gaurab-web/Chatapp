import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  ScrollView,
  Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Images from '../../themes/Images';
import auth from '@react-native-firebase/auth';
import Fonts from '../../themes/Fonts';
import showErrorAlert from '../../utils/helpers/Toast';
import Loader from '../../utils/helpers/Loader';
import firestore from '@react-native-firebase/firestore';

const Login = ({ navigation }) => {
  const [show, setShow] = useState(true);
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [loaderVisible, setLoader] = useState(false);

  const handleLogin = () => {
    if (email == '') {
      showErrorAlert('Please put your email address')
    } else if (pass == '') {
      showErrorAlert('Please put your password')
    } else {
      setLoader(true)
      auth()
        .signInWithEmailAndPassword(email, pass)
        .then(res => {
          setLoader(false)
          showErrorAlert('Logged in successfully');
          firestore().collection('users').doc(res.user.uid).update({
            isStatus : false,
            createdAt : new Date()
          })
          setTimeout(() => {
            navigation.navigate('Home', {senderID : res.user.uid, isStatus : true})
          }, 1000);
        })
        .catch(error => {
          if (error.code === 'auth/email-already-in-use') {
            showErrorAlert('That email address is already in use!');
            setLoader(false)
          }

          if (error.code === 'auth/invalid-email') {
            showErrorAlert('That email address is invalid!');
            setLoader(false)
          }

          console.error(error);
        });
    }
  };
  return (
    <KeyboardAvoidingView
      style={{
        height: Dimensions.get('screen').height,
      }}
      behavior={Platform.OS == 'ios' ? 'padding' : 'height'}>
      <Loader visible={loaderVisible} />
      <LinearGradient
        colors={['#fa7d6f', '#fa636f', '#fa446f']}
        style={styles.container}>
        <ScrollView
          style={{
            width: '100%',
          }}
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: 'center',
            alignItems: 'center',
          }}>
          <View style={styles.box}>
            <Image
              source={Images.loginIcon}
              resizeMode="contain"
              style={styles.icon}
            />
          </View>
          <View
            style={{
              marginTop: 60,
              marginBottom: 60,
            }}>
            <Text
              style={{
                color: '#fff',
                textTransform: 'uppercase',
                fontSize: 35,
                fontFamily: Fonts.bold_font
              }}>
              QUICK Chat
            </Text>
          </View>
          <View
            style={{
              width: '85%',
            }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                width: '100%',
                backgroundColor: 'rgba(0,0,0,0.1)',
                borderRadius: 30,
                marginBottom: 20,
              }}>
              <View
                style={{
                  height: 55,
                  backgroundColor: '#fff',
                  width: '16%',
                  borderRadius: 30,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                <Image
                  source={Images.emailIcon}
                  resizeMode="contain"
                  style={{
                    width: 20,
                    height: 20,
                  }}
                />
              </View>
              <TextInput
                placeholder="Enter your email address"
                placeholderTextColor={'#fff'}
                style={[styles.textBox, { width: '80%' }]}
                value={email}
                onChangeText={newEmail => setEmail(newEmail)}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                width: '100%',
                backgroundColor: 'rgba(0,0,0,0.1)',
                borderRadius: 30,
                marginBottom: 20,
              }}>
              <View
                style={{
                  height: 55,
                  backgroundColor: '#fff',
                  width: '16%',
                  borderRadius: 30,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                <Image
                  source={Images.passIcon}
                  resizeMode="contain"
                  style={{
                    width: 20,
                    height: 20,
                  }}
                />
              </View>
              <TextInput
                placeholder="Enter your password"
                placeholderTextColor={'#fff'}
                style={styles.textBox}
                secureTextEntry={show}
                value={pass}
                onChangeText={newPass => setPass(newPass)}
              />
              <TouchableOpacity
                style={{
                  height: 55,
                  backgroundColor: 'rgba(255,255,255,0.5)',
                  width: '16%',
                  borderRadius: 30,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
                onPress={() => setShow(!show)}>
                <Image
                  source={!show ? Images.eyeIcon : Images.eyeClose}
                  resizeMode="contain"
                  style={{
                    width: 25,
                    height: 25,
                  }}
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.btn} onPress={() => handleLogin()}>
              <Text
                style={{
                  color: '#000',
                  textTransform: 'uppercase',
                  fontSize: 15,
                  fontFamily: Fonts.semiBold_font
                }}>
                Login
              </Text>
            </TouchableOpacity>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                alignSelf: 'center',
                marginTop: 12,
              }}>
              <Text
                style={{
                  color: '#000',
                  marginRight: 3,
                  textTransform: 'uppercase',
                  fontSize: 12,
                  fontFamily: Fonts.extraLight_font
                }}>
                Don't have an account?
              </Text>
              <Text
                style={{
                  color: '#000',
                  marginRight: 3,
                  textTransform: 'uppercase',
                  fontFamily: Fonts.semiBold_font
                }}
                onPress={() => navigation.navigate('SignUp')}>
                Sign Up Now
              </Text>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
};

export default Login;

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
  },
  box: {
    width: 220,
    height: 220,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 20,
    transform: [{ rotate: '45deg' }],
    justifyContent: 'center',
    alignItems: 'center',
    borderTopWidth: 2,
    borderTopColor: '#fff',
  },
  icon: {
    width: 100,
    height: 100,
    transform: [{ rotate: '-45deg' }],
    tintColor: '#fff',
  },
  textBox: {
    width: '68%',
    height: 55,
    paddingHorizontal: 12,
    color: '#fff',
    fontSize: 12,
    fontFamily: Fonts.medium_font
  },
  btn: {
    backgroundColor: '#fff',
    height: 55,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
    width: '100%',
    borderRadius: 30,
  },
});
