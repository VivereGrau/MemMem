import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, TouchableOpacity, useColorScheme, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemedText } from "@/components/themed-text";

export default function PrivacyScreen() {
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
          Privacy Policy
        </ThemedText>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.card, { backgroundColor: isDark ? "#1C1C1E" : "#FFF" }]}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Privacy Policy
          </ThemedText>
          <ThemedText style={styles.paragraph}>
            MemMem is designed to work 100% offline. We respect your privacy and do not collect, store, or transmit any of your personal data or vocabulary data to any external servers. All of your data is saved locally on your device.
          </ThemedText>
          <ThemedText style={styles.paragraph}>
            This application does not use any third-party analytics or tracking services. Your vocabulary sets and learning progress remain entirely on your phone.
          </ThemedText>
        </View>

        <View style={[styles.card, { backgroundColor: isDark ? "#1C1C1E" : "#FFF" }]}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            นโยบายความเป็นส่วนตัว
          </ThemedText>
          <ThemedText style={styles.paragraph}>
            แอปพลิเคชัน MemMem ถูกออกแบบมาให้ทำงานแบบออฟไลน์ 100% ทางเราเคารพในความเป็นส่วนตัวของคุณและไม่มีการเก็บรวบรวม บันทึก หรือส่งต่อข้อมูลส่วนตัวรวมถึงข้อมูลคำศัพท์ใดๆ ของคุณไปยังเซิร์ฟเวอร์ภายนอก ข้อมูลทั้งหมดของคุณจะถูกบันทึกไว้ในอุปกรณ์ของคุณเท่านั้น
          </ThemedText>
          <ThemedText style={styles.paragraph}>
            แอปนี้ไม่มีการใช้งานระบบติดตาม (Tracking) หรือเครื่องมือวิเคราะห์ (Analytics) จากบุคคลที่สาม ชุดคำศัพท์และประวัติการทบทวนของคุณจะอยู่แค่ภายในเครื่องมือถือของคุณอย่างปลอดภัยครับ
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
    gap: 16,
    paddingBottom: 40,
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
