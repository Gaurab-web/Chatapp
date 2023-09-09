import React, { useState } from 'react';
import {
  View,
  Text,
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  Dimensions,
  Image,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Images from '../../themes/Images';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import Fonts from '../../themes/Fonts';
import showErrorAlert from '../../utils/helpers/Toast';
import normalize from '../../utils/helpers/dimen'
import Modal from "react-native-modal";
import ImagePicker from 'react-native-image-crop-picker';
import Loader from '../../utils/helpers/Loader';

const SignUp = ({ navigation }) => {
  const [show, setShow] = useState(true);
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [name, setName] = useState('');
  const [isModalVisible, setModalVisible] = useState(false);
  const [imageURL, setImageUrl] = useState('');
  const [loaderVisible, setLoader] = useState(false);

  const handleSignUp = () => {
    if (name == '') {
      showErrorAlert('Please put your full name')
    } else if (email == '') {
      showErrorAlert('Please put your email address')
    } else if (pass == '') {
      showErrorAlert('Please put your password')
    } else {
      setLoader(true)
      auth()
        .createUserWithEmailAndPassword(email, pass)
        .then(res => {
          setLoader(false)
          firestore().collection('users').doc(res.user.uid).set({
            name: name,
            profilepic : imageURL,
            email: res.user.email,
            uid: res.user.uid,
            isStatus : false,
            lastMsg : {},
            createdAt : new Date()
          })
          showErrorAlert('Account created successfully');
          setEmail('');
          setName('');
          setPass('');
          setImageUrl('')
        })
        .catch(error => {
          if (error.code === 'auth/email-already-in-use') {
            Alert.alert('That email address is already in use!');
            setLoader(false)
          }

          if (error.code === 'auth/invalid-email') {
            Alert.alert('That email address is invalid!');
            setLoader(false)
          }

          console.error(error);
        });
    }
  };

  const toggleModal = () => {
    setModalVisible(!isModalVisible);
  };

  const openGallery = ()=>{
    ImagePicker.openPicker({
      width: 300,
      height: 400,
      cropping: true
    }).then(image => {
      setImageUrl(image.path);
      setModalVisible(false)
    });
  };

  const openCameraFunc = ()=>{
    ImagePicker.openCamera({
      width: 300,
      height: 400,
      cropping: true,
    }).then(image => {
      setImageUrl(image.path);
      setModalVisible(false)
    });
  }
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
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              width: '80%',
              // borderWidth:1,
              height: 160,
              marginBottom: 60,
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
                height: 55,
                flexGrow: 1,
                justifyContent: 'center',
              }}>
              <Text
                style={{
                  textTransform: 'uppercase',
                  color: '#fff',
                  fontSize: 26,
                  fontFamily: Fonts.bold_font
                }}>
                quick chat
              </Text>
              <Text
                style={{
                  textTransform: 'uppercase',
                  color: '#fff',
                  fontSize: 10,
                  fontFamily: Fonts.extraLight_font
                }}>
                a interactive chat app
              </Text>
            </View>
          </View>

          <TouchableOpacity style={{
            borderWidth:1,
            width:100,
            height:100,
            marginBottom:normalize(50),
            borderRadius:normalize(50),
            borderColor:'#fff',
            position:'relative',
            justifyContent:'center',
            alignItems:'center'
          }}
          onPress={()=> toggleModal()}
          >
          <Image 
            source={ imageURL == '' ? Images.profilePic : {uri : imageURL}}
            resizeMode= 'contain'
            style={{
              width:normalize(70),
              height:normalize(70),
              borderRadius: imageURL == '' ? 0 : normalize(60)

            }}
          />
            <View style={{
              backgroundColor:'#fff',
              width:normalize(20),
              height:normalize(20),
              alignItems:'center',
              justifyContent:'center',
              borderRadius:normalize(50),
              position:'absolute',
              bottom:0,
              right:0
            }}><Text style={{
              color:'#000',
              fontSize:normalize(14),
              fontFamily:Fonts.regular_font
            }}>+</Text></View>
          </TouchableOpacity>

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
                  source={Images.userIcon}
                  resizeMode="contain"
                  style={{
                    width: 20,
                    height: 20,
                  }}
                />
              </View>
              <TextInput
                placeholder="Enter your full name"
                placeholderTextColor={'#fff'}
                style={[styles.textBox, { width: '80%' }]}
                value={name}
                onChangeText={newName => setName(newName)}
                keyboardType="default"
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
            <TouchableOpacity style={styles.btn} onPress={() => handleSignUp()}>
              <Text
                style={{
                  color: '#000',
                  textTransform: 'uppercase',
                  fontSize: 15,
                  fontFamily: Fonts.semiBold_font
                }}>
                Register
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
                Already have an account?
              </Text>
              <Text
                style={{
                  color: '#000',
                  marginRight: 3,
                  textTransform: 'uppercase',
                  fontFamily: Fonts.semiBold_font
                }}
                onPress={() => navigation.navigate('Login')}>
                Login
              </Text>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>

      <Modal isVisible={isModalVisible}
      onBackdropPress={toggleModal}
      style={{
        margin:0,
      }}
      >
        <View style={{ 
        height:'30%',
        width:'100%',
        position:'absolute',
        bottom:0,
        backgroundColor:'rgba(255,255,255,0.8)',
        justifyContent:'center',
        alignItems:'center',
        borderTopLeftRadius:normalize(20),
        borderTopRightRadius:normalize(20),
         }}>
          <LinearGradient colors={['#fa7d6f', '#fa636f', '#fa446f']}
          style={{
            width:'80%',
            height:normalize(55),
            borderRadius:normalize(40),
            marginBottom:normalize(20),
            shadowColor:'#000',
            shadowOffset:{width:0,height:normalize(10)},
            shadowOpacity:5,
            shadowRadius:0.6,
            elevation:normalize(10)
          }}
          >
            <TouchableOpacity style={{
              width:'100%',
              height:normalize(55),
              justifyContent:'center',
              alignItems:'center',
            }}
            onPress={()=> openCameraFunc()}
            >
              <Text style={{
                color:'#fff',
                fontSize:normalize(15),
                fontFamily:Fonts.regular_font
              }}>Open camera</Text>
            </TouchableOpacity>
          </LinearGradient>
          <LinearGradient colors={['#fa7d6f', '#fa636f', '#fa446f']}
          style={{
            width:'80%',
            height:normalize(55),
            borderRadius:normalize(40),
            shadowColor:'#000',
            shadowOffset:{width:0,height:normalize(10)},
            shadowOpacity:5,
            shadowRadius:0.6,
            elevation:normalize(10)
          }}
          >
            <TouchableOpacity style={{
              width:'100%',
              height:normalize(55),
              justifyContent:'center',
              alignItems:'center',
            }}
            onPress={()=> openGallery()}
            >
              <Text style={{
                color:'#fff',
                fontSize:normalize(15),
                fontFamily:Fonts.regular_font
              }}>Image from gallery</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

export default SignUp;

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
  },
  box: {
    width: 120,
    height: 120,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 20,
    transform: [{ rotate: '45deg' }],
    justifyContent: 'center',
    alignItems: 'center',
    borderTopWidth: 2,
    borderTopColor: '#fff',
    marginRight: 30,
  },
  icon: {
    width: 70,
    height: 70,
    transform: [{ rotate: '-45deg' }],
    tintColor: '#fff',
  },
  textBox: {
    width: '68%',
    height: 55,
    paddingHorizontal: 12,
    color: '#fff',
    fontSize: 12,
    fontFamily: Fonts.medium_font,
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
