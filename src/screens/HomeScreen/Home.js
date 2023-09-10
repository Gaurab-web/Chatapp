import React, { useEffect, useState } from "react";
import { View, Text, SafeAreaView, Image, TextInput, TouchableOpacity, FlatList } from "react-native";
import normalize from '../../utils/helpers/dimen'
import Fonts from "../../themes/Fonts";
import Images from "../../themes/Images";
import firestore from '@react-native-firebase/firestore';
import Loader from "../../utils/helpers/Loader";
import moment from "moment";
import { useIsFocused } from "@react-navigation/native";

const Home = (props) => {
    const { senderID } = props.route.params;
    const [data, setData] = useState([]);
    let newArr = [];
    const isFocused = useIsFocused()

    const [senderData, setSenderData] = useState({});

    useEffect(() => {
        firestore()
            .collection('users')
            .get()
            .then(querySnapshot => {
                querySnapshot.forEach(documentSnapshot => {
                    newArr.push(documentSnapshot.data());
                    let updateArr = newArr.filter(item => item.uid !== senderID).map(i => {
                        return {
                            ...i,
                            createdAt: i?.createdAt.toDate()
                        }
                    });
                    setData(updateArr);
                    let sendData = newArr.find(item => item.uid == senderID);
                    setSenderData(sendData)
                });
            });
    }, [isFocused]);

    const nextScreen = (i) => {
        props.navigation.navigate('Chatscreen', {
            item: i,
            senderID: senderData.uid,
            senderPhoto: senderData.profilepic
        })
    }

    return (
        <View style={{
            flex: 1
        }}>
            <Loader visible={data.length == 0} />
            <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                height: normalize(55),
                justifyContent: 'space-between',
                paddingHorizontal: normalize(10),
                marginBottom: normalize(10)
            }}>
                <View style={{
                    width: '90%',
                    // backgroundColor:'green',
                    height: '100%',
                    justifyContent: 'center',
                    alignItems: 'center'
                }}>
                    <Text style={{
                        color: '#000',
                        fontSize: normalize(14),
                        fontFamily: Fonts.semiBold_font,
                        textTransform: 'capitalize',
                        textAlign: 'center',
                        // backgroundColor:'red',
                        marginLeft: normalize(15),
                        marginTop: normalize(5)
                    }}>Chat room</Text>
                </View>
                <TouchableOpacity style={{
                    width: '10%',
                    height: '100%',
                    justifyContent: 'center',
                    alignItems: 'center',
                    // backgroundColor:'blue'
                }}>
                    <Image
                        source={Images.threeDots}
                        resizeMode="contain"
                        style={{
                            width: normalize(15),
                            height: normalize(15)
                        }}
                    />
                </TouchableOpacity>
            </View>

            <View style={{
                width: '90%',
                height: normalize(45),
                backgroundColor: '#ddd',
                alignSelf: 'center',
                borderRadius: normalize(30),
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: normalize(5),
                marginBottom: normalize(30)
            }}>
                <View style={{
                    width: '15%',
                    height: '100%',
                    justifyContent: 'center',
                    alignItems: 'center',
                    // backgroundColor:'red'
                }}>
                    <Image
                        source={Images.searchBar}
                        resizeMode="contain"
                        style={{
                            width: normalize(15),
                            height: normalize(15)
                        }}
                    />
                </View>
                <TextInput
                    placeholder="Search"
                    placeholderTextColor={'#000'}
                    style={{
                        width: '85%',
                        height: '100%',
                        fontSize: normalize(12),
                        fontFamily: Fonts.regular_font,
                        color: '#000',
                        paddingRight: normalize(10)
                        // backgroundColor:'blue'
                    }}
                />
            </View>

            <FlatList
                data={data}
                renderItem={({ item, index }) => (
                    <TouchableOpacity style={{
                        width: '90%',
                        height: normalize(75),
                        backgroundColor: 'rgba(0,0,0,0.1)',
                        alignSelf: 'center',
                        flexDirection: 'row',
                        alignItems: 'center',
                        borderRadius: normalize(10),
                        marginBottom: normalize(10)
                    }}
                        key={index}
                        onPress={() => nextScreen(item)}
                    >
                        <View style={{
                            width: '25%',
                            height: '100%',
                            justifyContent: 'center',
                            alignItems: 'center',
                            borderRadius: normalize(10)
                        }}>
                            <Image
                                source={item.profilepic == '' ? Images.profilePic : { uri: item.profilepic }}
                                resizeMode="cover"
                                style={{
                                    width: normalize(50),
                                    height: normalize(50),
                                    borderRadius: normalize(60)
                                }}
                            />
                        </View>
                        <View style={{
                            width: '20%',
                            height: normalize(15),
                            backgroundColor: '#eee',
                            position: 'absolute',
                            top: 10,
                            right: 10,
                            justifyContent: 'center',
                            alignItems: 'center',
                            flexDirection: 'row',
                            borderRadius: normalize(5)
                        }}>
                            <Image
                                source={Images.eyeIcon}
                                resizeMode="contain"
                                style={{
                                    width: normalize(10),
                                    height: normalize(10),
                                    marginRight: normalize(3),
                                    tintColor: '#aaa'
                                }}
                            />
                            <Text style={{
                                color: '#000',
                                fontFamily: Fonts.light_font,
                                fontSize: normalize(6),
                                marginTop: normalize(1)
                            }}>{moment(item?.createdAt).format('hh:mm A')}</Text>
                        </View>
                        <View style={{
                            width: '75%',
                            height: '100%',
                            // backgroundColor:'green',
                            justifyContent: 'center',
                            paddingHorizontal: normalize(5)
                        }}>
                            <Text style={{
                                color: '#000',
                                fontFamily: Fonts.medium_font,
                                fontSize: normalize(11),
                                marginBottom: normalize(5)
                            }}>{item.name}</Text>
                            <Text style={{
                                color: '#000',
                                fontFamily: Fonts.light_font,
                                fontSize: normalize(7)
                            }}>{item?.lastMsg?.imageDoc == '' ? (item?.lastMsg?.text?.length > 25 ? item?.lastMsg?.text?.length?.slice(0, 25) : item?.lastMsg?.text) : item?.lastMsg?.imageName}</Text>
                        </View>
                    </TouchableOpacity>
                )}
            />
        </View>
    )
}

export default Home;