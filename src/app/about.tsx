import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Image, StyleSheet, TouchableOpacity, useColorScheme, View, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Constants from "expo-constants";
import { ThemedText } from "@/components/themed-text";

export default function AboutScreen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const isDark = scheme === "dark";

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: isDark ? "#000" : "#F5F5F5" }]}
      edges={["top"]}
    >
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color={isDark ? "#FFF" : "#000"} />
        </TouchableOpacity>
        <ThemedText type="subtitle" style={styles.headerTitle}>
          About Developer
        </ThemedText>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.logoContainer}>
          <Image
            source={require("../../assets/images/demo_icon.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <ThemedText type="title" style={styles.appName}>
            MemMem
          </ThemedText>
          <ThemedText style={styles.version}>Version {Constants.expoConfig?.version || "1.0.0"}</ThemedText>
        </View>

        <View style={[styles.card, { backgroundColor: isDark ? "#1C1C1E" : "#FFF" }]}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Developer
          </ThemedText>
          <ThemedText style={styles.paragraph}>
            Developed by VivereGrau
          </ThemedText>
          <ThemedText style={styles.paragraph}>
            This application was created with the intention of providing a simple, offline-first tool for learning and memorizing Japanese vocabulary without relying on an internet connection or compromising user privacy.
          </ThemedText>
        </View>
        
        <View style={[styles.card, { backgroundColor: isDark ? "#1C1C1E" : "#FFF" }]}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            ผู้พัฒนา
          </ThemedText>
          <ThemedText style={styles.paragraph}>
            พัฒนาโดย VivereGrau
          </ThemedText>
          <ThemedText style={styles.paragraph}>
            แอปพลิเคชันนี้สร้างขึ้นเพื่อเป็นเครื่องมือช่วยจำคำศัพท์ภาษาญี่ปุ่นที่เรียบง่าย ใช้งานได้โดยไม่ต้องต่ออินเทอร์เน็ต และเน้นเรื่องความเป็นส่วนตัวของผู้ใช้เป็นหลัก
          </ThemedText>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(150,150,150,0.2)",
  },
  backBtn: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  logoContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 32,
    marginBottom: 40,
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 24,
    marginBottom: 16,
  },
  appName: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 4,
  },
  version: {
    fontSize: 14,
    color: "#8E8E93",
  },
  card: {
    padding: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    marginBottom: 12,
    fontWeight: "bold",
    color: "#0274DF",
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 12,
    opacity: 0.9,
  },
});
