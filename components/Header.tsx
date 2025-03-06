import { View, Text, TextInput } from 'react-native';
import React from 'react';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';

const Header = () => {
  const insets = useSafeAreaInsets();

  return (
   <SafeAreaView style={{paddingTop:insets.top}}className="p-4 bg-white flex-row items-center border-b border-gray-200">
           <Text className="text-3xl font-bold text-purple-600">SX</Text>
           <TextInput
             placeholder="Search"
             className="flex-1 bg-gray-100 rounded-full px-4 py-2 ml-4"
           />
           <MaterialIcons name="search" size={24} color="gray" style={{ marginLeft: -30 }} />
         </SafeAreaView>
  );
};

export default Header;
