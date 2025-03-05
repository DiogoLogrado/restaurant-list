import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Link } from "expo-router";
import { ThemedText } from "@/components/ThemedText";
import { useColorScheme } from "@/hooks/useColorScheme";

export default function SplashScreen() {
  const colorScheme = useColorScheme();
  const textStyle = {
    color: colorScheme === "dark" ? "#FFF" : "#000",
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.welcomeText, textStyle]}>
        Welcome to the Restaurant App!
      </Text>
      <Link href={"/(tabs)/Restaurants"} style={styles.link}>
        <ThemedText type="link">Check the restaurant list here!</ThemedText>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  welcomeText: {
    fontSize: 24,
    marginBottom: 20,
    textAlign: "center",
    color: "white",
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
});
