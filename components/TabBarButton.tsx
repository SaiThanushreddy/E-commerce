import { View, Text, Pressable } from "react-native";
import React from "react";
import { Colors } from "@/constants/Colors";
import Icons from "@/constants/Icons"; 

type IconKeys = keyof typeof Icons; 

type Props = {
  onPress: () => void;
  onLongpress: () => void;
  isFocused: boolean;
  label: string;
  routeName: IconKeys; 
};

const TabBarButton = ({ onPress, onLongpress, isFocused, label, routeName }: Props) => {
  return (
    <Pressable
      className="flex-1 items-center justify-center"
      accessibilityState={isFocused ? { selected: true } : {}}
      onPress={onPress}
      onLongPress={onLongpress}
    >
      
      {Icons[routeName] && Icons[routeName]({ 
        color: isFocused ? Colors.primary : Colors.black,
        size: 24, 
      })}

      <Text className={isFocused ? "text-primary font-bold" : "text-gray-500"}>
        {label}
      </Text>
    </Pressable>
  );
};

export default TabBarButton;
