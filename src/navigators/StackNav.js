import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import Login from '../screens/AuthScreen/Login';
import SignUp from '../screens/AuthScreen/SignUp';
import Home from '../screens/HomeScreen/Home';
import Chatscreen from '../screens/HomeScreen/Chatscreen';

const StackNav = () => {
  const Stack = createStackNavigator();
  const Screens = {
    Login: Login,
    SignUp:SignUp,
    Home:Home,
    Chatscreen:Chatscreen
  };

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{headerShown: false}}>
        {Object.entries({
          ...Screens,
        }).map(([name, component]) => {
          return <Stack.Screen key={name} name={name} component={component} />;
        })}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default StackNav;
