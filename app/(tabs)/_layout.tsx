import React from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { MyTabBar } from "@/components/TabBar";
import Header from "@/components/Header";
export default function TabLayout() {
  return (
    <Tabs tabBar={(props) => <MyTabBar {...props} />}screenOptions={{
      headerShown:false
    }}>
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          headerShown:true,
          header:()=><Header/>
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          headerShown:false
        }}
  
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: "Cart",
          tabBarBadge: 3,
         
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          headerShown:false        
        }}
      />
    </Tabs>
  );
}
