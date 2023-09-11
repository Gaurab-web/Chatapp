import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  Image,
  TouchableOpacity,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ImageBackground,
  StatusBar
} from 'react-native';
import Images from '../../themes/Images';
import moment from 'moment';
import firestore from '@react-native-firebase/firestore';
import normalize from '../../utils/helpers/dimen'
import Fonts from '../../themes/Fonts';
import EmojiPicker, { no } from 'rn-emoji-keyboard'
import ImagePicker from 'react-native-image-crop-picker';
import Modal from "react-native-modal";
import LinearGradient from 'react-native-linear-gradient';
import Loader from '../../utils/helpers/Loader';
import storage from '@react-native-firebase/storage';
import MyStatusBar from '../../utils/MyStatusBar';

const Chatscreen = props => {
  const { item, senderID, senderPhoto } = props.route.params;
  const [messages, setMessages] = useState([]);
  const flatlistRef = useRef();
  const [text, setText] = useState('');
  const [emojiKeyOpen, setEmojiOpen] = useState(false);
  const [imageURL, setImageUrl] = useState('');
  const [image, setImage] = useState('');
  const [isAttachVisible, setAttachVisible] = useState(false);
  const [receiveStat, setReceiveStat] = useState('');
  const [isStat, setStat] = useState(false);
  const [upURL, setUpURL] = useState('')

  const toggleModal = () => {
    setAttachVisible(!isAttachVisible);
  };
  const docID =
    item.uid > senderID ? senderID + '-' + item.uid : item.uid + '-' + senderID;

  useEffect(() => {
    const subscription = setInterval(() => {
      firestore().collection('users').doc(senderID).update({
        createdAt: new Date()
      })
      firestore()
        .collection('users').doc(item.uid)
        .get()
        .then(querySnapshot => {
          setReceiveStat(querySnapshot.data().createdAt.toDate());
          setStat(querySnapshot.data().isStatus)
        });
    }, 1000);

    return () => {
      clearInterval(subscription)
    };
  }, []);


  const getAllMsg = () => {
    const querySnap = firestore()
      .collection('chatrooms')
      .doc(docID)
      .collection('messages')
      .orderBy('createdAt', 'desc');
    querySnap.onSnapshot(snapshot => {
      const allMsg = snapshot.docs.map(snap => {
        return {
          ...snap.data(),
          createdAt: snap.data().createdAt.toDate(),
        };
      });
      setMessages(allMsg);
      firestore().collection('users').doc(item.uid).update({
        lastMsg: allMsg.length == 0 ? {} : allMsg?.[0]
      })
    });
  };

  useEffect(() => {
    getAllMsg();
  }, []);

  const typeFunc = (txt) => {
    if (txt.length !== 0) {
      firestore().collection('users').doc(senderID).update({
        isStatus: true,
      })
    }
    else {
      firestore().collection('users').doc(senderID).update({
        isStatus: false,
      })
    }
  }


  const handleSend = () => {
    const msg = messages[0];
    const myMsg = {
      ...msg,
      senderID: senderID,
      receiverID: item.uid,
      text: text,
      createdAt: new Date(),
      profilePic: senderPhoto,
      imageDoc: upURL,
      imageName: image?.modificationDate + '.' + image?.mime?.slice(6, 10)
    };
    setMessages([
      ...messages,
      {
        senderID: senderID,
        receiverID: item.uid,
        text: text,
        createdAt: new Date(),
        profilePic: senderPhoto,
        imageDoc: upURL,
        imageName: image?.modificationDate + '.' + image?.mime?.slice(6, 10)
      },
    ]);

    firestore()
      .collection('chatrooms')
      .doc(docID)
      .collection('messages')
      .add(myMsg);


    firestore().collection('users').doc(item.uid).update({
      lastMsg: myMsg,
    });
    firestore().collection('users').doc(senderID).update({
      isStatus: false,
    })
    setText('');
  };

  const openCameraFunc = () => {
    ImagePicker.openCamera({
      width: 300,
      height: 400,
      cropping: true,
    }).then(image => {
      setImageUrl(image.path);
      uploadImage(image);
      setImage(image)
    });
  };

  const uploadImage = async (img) => {
    const fileName = 'Image' + Date.now() + '.' + img.mime;
    const refernce = storage().ref(fileName);
    const pathToFile = img.path;
    await refernce.putFile(pathToFile);

    const url = await storage().ref(fileName).getDownloadURL();
    firestore()
      .collection('chatrooms')
      .doc(docID)
      .collection('messages')
      .add({
        senderID: senderID,
        receiverID: item.uid,
        text: text,
        createdAt: new Date(),
        profilePic: senderPhoto,
        imageDoc: url,
        imageName: image?.modificationDate + '.' + image?.mime?.slice(6, 10)
      });
    setUpURL(url)
  }
  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: '#fff',
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0
      }}>
      <MyStatusBar backgroundColor={'#242e38'} />
      <Loader visible={receiveStat == ''} />
      <View
        style={{
          height: 55,
          shadowColor: '#000',
          borderBottomWidth: 1,
          flexDirection: 'row',
          alignItems: 'center',
          borderBottomColor: '#fff',
          backgroundColor: '#242e38'
        }}>
        <TouchableOpacity
          style={{
            width: '12%',
            height: '100%',
            justifyContent: 'center',
            alignItems: 'center',
          }}
          onPress={() => props.navigation.goBack()}>
          <Image
            source={Images.leftArr}
            resizeMode="contain"
            style={{
              width: 15,
              height: 15,
              tintColor: '#fff'
            }}
          />
        </TouchableOpacity>
        <View style={{
          width: '88%',
          height: '100%',
          flexDirection: 'row',
          alignItems: 'center'
        }}>
          <View style={{
            width: '12%',
            height: '100%',
            justifyContent: "center",
            alignItems: 'center',
            marginRight:normalize(3)
          }}>
            <Image
              source={{ uri: item.profilepic }}
              resizeMode='contain'
              style={{
                width: normalize(25),
                height: normalize(25),
                borderRadius: normalize(20)
              }}
            />
          </View>
          <View style={{
            // backgroundColor:'red'
          }}>
            <Text
              style={{
                fontSize: 12,
                fontFamily: Fonts.regular_font,
                color: '#fff',
              }}>
              {item.name}
            </Text>
            {isStat ?
              <Text style={{
                fontSize: 8,
                fontFamily: Fonts.regular_font,
                color: '#fff',
              }}>Typing...</Text>
              : <Text
                style={{
                  fontSize: 8,
                  fontFamily: Fonts.regular_font,
                  color: '#fff',
                }}>
                {new Date().getTime() - new Date(receiveStat).getTime() > 30000 ||
                  isNaN(new Date().getTime() - new Date(receiveStat).getTime()) ?
                  'last seen at ' + moment(receiveStat).fromNow() : 'Online'
                }
              </Text>}
          </View>
        </View>
      </View>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS == 'ios' ? 'padding' : undefined}>
        <ImageBackground
          style={{
            flex: 1,
          }}
          source={Images.bckImage}
          blurRadius={10}
        >
          <FlatList
            data={messages}
            ref={flatlistRef}
            contentContainerStyle={{
              paddingTop: 50,
            }}
            style={{
              flex: 1,
            }}
            keyExtractor={(item, index) => index.toString()}
            inverted={true}
            renderItem={({ item, index }) => (
              <View
                style={{
                  flexDirection: 'row',
                  alignSelf:
                    item.senderID == senderID ? 'flex-end' : 'flex-start',
                  marginRight: item.senderID == senderID ? 10 : 0,
                  marginLeft: item.senderID == senderID ? 0 : 10,
                  justifyContent: 'center',
                  alignItems: 'center'
                }}>
                <View
                  style={{
                    backgroundColor: item.senderID == senderID ? '#075e54' : '#242e38',
                    paddingHorizontal: 15,
                    paddingVertical: 10,
                    maxWidth: '90%',
                    borderTopLeftRadius: item.senderID == senderID ? 10 : 0,
                    borderBottomLeftRadius: 10,
                    borderBottomRightRadius: 10,
                    borderTopRightRadius: item.senderID == senderID ? 0 : 10,
                    marginBottom: messages[0] ? normalize(10) : 0
                  }}
                >
                  {item?.imageDoc == '' && item?.text !== '' ? <Text
                    style={{
                      color: '#fff',
                      fontSize: 12,
                      textAlign: 'left',
                      marginBottom: 3,
                      fontFamily: Fonts.regular_font
                    }}>
                    {item.text}
                  </Text> :
                    <Image
                      source={{ uri: item?.imageDoc }}
                      resizeMode='cover'
                      style={{
                        width: normalize(110),
                        height: normalize(150),
                        borderRadius: normalize(5),
                        marginBottom: normalize(2)
                      }}
                    />
                  }

                  <Text
                    style={{
                      color: '#fff',
                      fontSize: 9,
                      textAlign: item.senderID == senderID ? 'right' : 'left',
                      fontFamily: Fonts.light_font
                    }}>
                    {moment(item.createdAt).format('hh:mm A')}
                  </Text>
                </View>
              </View>
            )}
            showsVerticalScrollIndicator={false}
          />
          <ImageBackground
            style={{
              flex: 1,
              position: 'absolute',
              bottom: 0,
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: normalize(8),
              justifyContent: 'space-between',
              height: text.length > 30 ? 'auto' : normalize(50)
            }}
            source={Images.textBack}
            blurRadius={10}
          >
            <View style={{
              width: '85%',
              height: '85%',
            }}>
              <TouchableOpacity style={{
                width: normalize(30),
                height: '100%',
                position: 'absolute',
                top: 0,
                left: 8,
                zIndex: 1,
                justifyContent: 'center',
                alignItems: 'center',
                borderRadius: normalize(50),
              }}
                onPress={() => setEmojiOpen(true)}
              >
                <Image
                  source={Images.emoji}
                  resizeMode='contain'
                  style={{
                    width: normalize(15),
                    height: normalize(15),
                    tintColor: '#aaa'
                  }}
                />
              </TouchableOpacity>
              {text?.length == 0 && <TouchableOpacity style={{
                width: normalize(30),
                height: '100%',
                position: 'absolute',
                top: 0,
                right: 8,
                zIndex: 1,
                justifyContent: 'center',
                alignItems: 'center',
                borderRadius: normalize(50)
              }}
                onPress={() => openCameraFunc()}
              >
                <Image
                  source={Images.cameraIcon}
                  resizeMode='contain'
                  style={{
                    width: normalize(15),
                    height: normalize(15),
                    tintColor: '#aaa'
                  }}
                />
              </TouchableOpacity>}
              <TouchableOpacity style={{
                width: normalize(30),
                height: '100%',
                position: 'absolute',
                top: 0,
                right: text?.length == 0 ? 50 : 8,
                zIndex: 1,
                justifyContent: 'center',
                alignItems: 'center',
                borderRadius: normalize(50)
              }}
                onPress={() => toggleModal()}
              >
                <Image
                  source={Images.attachIcon}
                  resizeMode='contain'
                  style={{
                    width: normalize(15),
                    height: normalize(15),
                    tintColor: '#aaa'
                  }}
                />
              </TouchableOpacity>
              <TextInput
                placeholder="Type your message..."
                placeholderTextColor={'#aaa'}
                value={text}
                onChangeText={newText => {
                  setText(newText);
                  typeFunc(newText)
                }}
                style={{
                  width: '100%',
                  height: text.length > 50 ? 'auto' : normalize(43),
                  fontSize: 14,
                  color: '#fff',
                  backgroundColor: '#242e38',
                  paddingLeft: normalize(38),
                  paddingRight: normalize(65),
                  borderRadius: text.length > 50 ? normalize(20) : normalize(50),
                  fontFamily: Fonts.light_font,
                  paddingTop: normalize(9.5)
                }}
                multiline={true}
              />
            </View>
            <TouchableOpacity
              style={{
                width: normalize(40),
                height: normalize(40),
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: text == '' ? '#242e38' : '#075e54',
                borderRadius: normalize(200),
                marginLeft: normalize(5)
              }}
              onPress={() => handleSend()}
              disabled={text == '' ? true : false}
            >
              <Image
                source={Images.sendMsg}
                resizeMode="contain"
                style={{
                  width: normalize(15),
                  height: normalize(15),
                  tintColor: '#fff',
                  marginLeft: normalize(3)
                }}
              />
            </TouchableOpacity>
          </ImageBackground>
          <EmojiPicker
            open={emojiKeyOpen}
            onClose={() => setEmojiOpen(false)}
            onEmojiSelected={(res) => {
              setText(res.emoji)
            }}
          />
          <Modal isVisible={isAttachVisible}
            onBackdropPress={toggleModal}
            backdropOpacity={0}
            style={{
              margin: 0,
            }}
            animationIn={'slideInUp'}
            animationOut={'slideOutDown'}
            animationInTiming={600}
            animationOutTiming={600}
          >
            <View
              style={{
                height: '30%',
                width: '90%',
                position: 'absolute',
                bottom: normalize(50),
                backgroundColor: '#101d25',
                justifyContent: 'center',
                alignItems: 'center',
                borderRadius: normalize(20),
                alignSelf: 'center'
              }}>
              <View style={{
                // backgroundColor: 'red',
                width: '60%',
                height: '40%',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <LinearGradient colors={['#C79DF1', '#9C6BCD', '#5A05AF']}
                  style={{
                    width: normalize(45),
                    height: normalize(45),
                    borderRadius: normalize(100),
                    alignItems: 'center'
                  }}
                >
                  <TouchableOpacity
                    style={{
                      width: '100%',
                      height: '100%',
                      justifyContent: 'center',
                      alignItems: 'center'
                    }}
                  >
                    <Image
                      source={Images.fileIcon}
                      resizeMode='contain'
                      style={{
                        width: normalize(15),
                        height: normalize(15),
                        tintColor: '#fff'
                      }}
                    />
                  </TouchableOpacity>
                  <Text style={{
                    color: '#aaa',
                    fontFamily: Fonts.regular_font,
                    fontSize: normalize(7)
                  }}>Document</Text>
                </LinearGradient>
                <LinearGradient colors={['#FC7979', '#F74747', '#EE0505']}
                  style={{
                    width: normalize(45),
                    height: normalize(45),
                    borderRadius: normalize(100),
                    alignItems: 'center'
                  }}
                >
                  <TouchableOpacity
                    style={{
                      width: '100%',
                      height: '100%',
                      justifyContent: 'center',
                      alignItems: 'center'
                    }}
                  >
                    <Image
                      source={Images.cameraIcon}
                      resizeMode='contain'
                      style={{
                        width: normalize(15),
                        height: normalize(15),
                        tintColor: '#fff'
                      }}
                    />
                  </TouchableOpacity>
                  <Text style={{
                    color: '#aaa',
                    fontFamily: Fonts.regular_font,
                    fontSize: normalize(7)
                  }}>Camera</Text>
                </LinearGradient>
                <LinearGradient colors={['#DB81ED', '#A14DB2', '#9205AF']}
                  style={{
                    width: normalize(45),
                    height: normalize(45),
                    borderRadius: normalize(100),
                    alignItems: 'center'
                  }}
                >
                  <TouchableOpacity
                    style={{
                      width: '100%',
                      height: '100%',
                      justifyContent: 'center',
                      alignItems: 'center'
                    }}
                  >
                    <Image
                      source={Images.galleryIcon}
                      resizeMode='contain'
                      style={{
                        width: normalize(15),
                        height: normalize(15),
                        tintColor: '#fff'
                      }}
                    />
                  </TouchableOpacity>
                  <Text style={{
                    color: '#aaa',
                    fontFamily: Fonts.regular_font,
                    fontSize: normalize(7)
                  }}>Gallery</Text>
                </LinearGradient>
              </View>
              <View style={{
                // backgroundColor: 'red',
                width: '60%',
                height: '45%',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <LinearGradient colors={['#FE9C77', '#FA6E39', '#F74604']}
                  style={{
                    width: normalize(45),
                    height: normalize(45),
                    borderRadius: normalize(100),
                    alignItems: 'center'
                  }}
                >
                  <TouchableOpacity
                    style={{
                      width: '100%',
                      height: '100%',
                      justifyContent: 'center',
                      alignItems: 'center'
                    }}
                  >
                    <Image
                      source={Images.hdPhne}
                      resizeMode='contain'
                      style={{
                        width: normalize(15),
                        height: normalize(15),
                        tintColor: '#fff'
                      }}
                    />
                  </TouchableOpacity>
                  <Text style={{
                    color: '#aaa',
                    fontFamily: Fonts.regular_font,
                    fontSize: normalize(7)
                  }}>Audio</Text>
                </LinearGradient>
                <LinearGradient colors={['#71C19B', '#3FAB78', '#02A056']}
                  style={{
                    width: normalize(45),
                    height: normalize(45),
                    borderRadius: normalize(100),
                    alignItems: 'center'
                  }}
                >
                  <TouchableOpacity
                    style={{
                      width: '100%',
                      height: '100%',
                      justifyContent: 'center',
                      alignItems: 'center'
                    }}
                  >
                    <Image
                      source={Images.location}
                      resizeMode='contain'
                      style={{
                        width: normalize(15),
                        height: normalize(15),
                        tintColor: '#fff'
                      }}
                    />
                  </TouchableOpacity>
                  <Text style={{
                    color: '#aaa',
                    fontFamily: Fonts.regular_font,
                    fontSize: normalize(7)
                  }}>Location</Text>
                </LinearGradient>
                <LinearGradient colors={['#84B8F6', '#4B96F0', '#006BEB']}
                  style={{
                    width: normalize(45),
                    height: normalize(45),
                    borderRadius: normalize(100),
                    alignItems: 'center'
                  }}
                >
                  <TouchableOpacity
                    style={{
                      width: '100%',
                      height: '100%',
                      justifyContent: 'center',
                      alignItems: 'center'
                    }}
                  >
                    <Image
                      source={Images.contact_icon}
                      resizeMode='contain'
                      style={{
                        width: normalize(15),
                        height: normalize(15),
                        tintColor: '#fff'
                      }}
                    />
                  </TouchableOpacity>
                  <Text style={{
                    color: '#aaa',
                    fontFamily: Fonts.regular_font,
                    fontSize: normalize(7)
                  }}>Contact</Text>
                </LinearGradient>
              </View>
            </View>
          </Modal>
        </ImageBackground>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default Chatscreen;
