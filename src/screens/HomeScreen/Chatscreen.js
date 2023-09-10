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
  Platform
} from 'react-native';
import Images from '../../themes/Images';
import moment from 'moment';
import firestore from '@react-native-firebase/firestore';
import normalize from '../../utils/helpers/dimen'
import Fonts from '../../themes/Fonts';
import EmojiPicker from 'rn-emoji-keyboard'
import ImagePicker from 'react-native-image-crop-picker';
import Modal from "react-native-modal";
import LinearGradient from 'react-native-linear-gradient';
import Loader from '../../utils/helpers/Loader';
import storage from '@react-native-firebase/storage';

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

  const typeFunc = (txt)=>{
    if(txt.length !== 0 ){
      firestore().collection('users').doc(senderID).update({
        isStatus : true,
      })
    }
    else{
      firestore().collection('users').doc(senderID).update({
        isStatus : false,
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
      lastMsg: myMsg
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

  const uploadImage = async(img)=>{
    const fileName = 'Image'+ Date.now() + '.' + img.mime;
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
      }}>
      <Loader visible={receiveStat == ''} />
      <View
        style={{
          height: 55,
          shadowColor: '#000',
          borderBottomWidth: 0.4,
          flexDirection: 'row',
          alignItems: 'center',
          borderBottomColor: '#ccc',
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
            alignItems: 'center'
          }}>
            <Image
              source={{ uri: item.profilepic }}
              resizeMode='contain'
              style={{
                width: normalize(20),
                height: normalize(20),
                borderRadius: normalize(20)
              }}
            />
          </View>
          <View style={{
            // backgroundColor:'red'
          }}>
            <Text
              style={{
                fontSize: 14,
                fontFamily: Fonts.regular_font,
                color: '#000',
              }}>
              {item.name}
            </Text>
            { isStat ? 
            <Text style={{
                fontSize: 10,
                fontFamily: Fonts.regular_font,
                color: '#000',
              }}>Typing...</Text>
            : <Text
              style={{
                fontSize: 10,
                fontFamily: Fonts.regular_font,
                color: '#000',
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
        <View
          style={{
            flex: 1,
          }}>
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
                    backgroundColor: item.senderID == senderID ? '#fa636f' : '#ccc',
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
          <View
            style={{
              width: '100%',
              height: 'auto',
              backgroundColor: '#fff',
              position: 'absolute',
              bottom: 0,
              flexDirection: 'row',
              alignItems: 'center',
              marginHorizontal: normalize(8),
            }}>
            <View style={{
              width: '82%',
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
                borderRadius: normalize(50)
              }}
                onPress={() => setEmojiOpen(true)}
              >
                <Image
                  source={Images.emoji}
                  resizeMode='contain'
                  style={{
                    width: normalize(15),
                    height: normalize(15),
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
                placeholderTextColor={'#000'}
                value={text}
                onChangeText={newText => {
                  setText(newText);
                  typeFunc(newText)
                }}
                style={{
                  width: '100%',
                  height: '100%',
                  fontSize: 14,
                  color: '#000',
                  backgroundColor: '#eee',
                  paddingLeft: normalize(38),
                  paddingRight: normalize(65),
                  borderRadius: normalize(50),
                  fontFamily: Fonts.light_font
                }}
                multiline={true}
              />
            </View>
            <TouchableOpacity
              style={{
                width: '15%',
                height: '100%',
                justifyContent: 'center',
                alignItems: 'center',
              }}
              onPress={() => handleSend()}
              disabled={text == '' ? true : false}
            >
              <Image
                source={Images.sendMsg}
                resizeMode="contain"
                style={{
                  width: '100%',
                  height: normalize(50),
                  transform: [{ rotate: '180deg' }],
                  tintColor: text == '' ? '#ccc' : '#fa636f',
                }}
              />
            </TouchableOpacity>
          </View>
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
          >
            <View
              style={{
                height: '10%',
                width: '95%',
                position: 'absolute',
                bottom: normalize(50),
                backgroundColor: 'rgba(0,0,0,0.5)',
                justifyContent: 'center',
                alignItems: 'center',
                borderRadius: normalize(20),
                alignSelf: 'center'
              }}>
              <View style={{
                // backgroundColor: 'red',
                width: '60%',
                height: '100%',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <LinearGradient colors={['#fff', '#ddd', '#ccc']}
                  style={{
                    width: normalize(50),
                    height: normalize(50),
                    borderRadius: normalize(100)
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
                        width: normalize(18),
                        height: normalize(18),
                        tintColor: '#fa446f'
                      }}
                    />
                  </TouchableOpacity>
                </LinearGradient>
                <LinearGradient colors={['#fff', '#ddd', '#ccc']}
                  style={{
                    width: normalize(50),
                    height: normalize(50),
                    borderRadius: normalize(100)
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
                        width: normalize(18),
                        height: normalize(18),
                        tintColor: '#fa446f'
                      }}
                    />
                  </TouchableOpacity>
                </LinearGradient>
                <LinearGradient colors={['#fff', '#ddd', '#ccc']}
                  style={{
                    width: normalize(50),
                    height: normalize(50),
                    borderRadius: normalize(100)
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
                        width: normalize(18),
                        height: normalize(18),
                        tintColor: '#fa446f'
                      }}
                    />
                  </TouchableOpacity>
                </LinearGradient>
              </View>
            </View>
          </Modal>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default Chatscreen;
