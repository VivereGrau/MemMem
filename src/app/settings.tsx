import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { StyleSheet, TouchableOpacity, useColorScheme, View, Appearance } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemedText } from "@/components/themed-text";
import { AppTheme, getTheme, saveTheme } from "@/utils/storage";
import { Spacing } from "@/constants/theme";

export default function SettingsScreen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const [currentTheme, setCurrentTheme] = useState<AppTheme>('system');

  useEffect(() => {
    getTheme().then(setCurrentTheme);
  }, []);

  const handleThemeChange = async (theme: AppTheme) => {
    setCurrentTheme(theme);
    await saveTheme(theme);
    Appearance.setColorScheme(theme === 'system' ? null : theme);
  };

  const renderMenuItem = (icon: any, title: string, path: any) => (
    <TouchableOpacity
      style={[
        styles.menuItem,
        { backgroundColor: isDark ? "#1C1C1E" : "#FFF" },
      ]}
      onPress={() => router.push(path)}
    >
      <View style={styles.menuItemLeft}>
        <Ionicons name={icon} size={24} color={isDark ? "#FFF" : "#000"} />
        <ThemedText style={styles.menuItemTitle}>{title}</ThemedText>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
    </TouchableOpacity>
  );

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
          Settings & Info
        </ThemedText>
        <View style={{ width: 44 }} />
      </View>

      <View style={styles.content}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Appearance
        </ThemedText>
        
        <View style={[styles.card, { backgroundColor: isDark ? "#1C1C1E" : "#FFF" }]}>
          <TouchableOpacity
            style={[styles.themeRow, styles.themeRowBorder]}
            onPress={() => handleThemeChange('system')}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name="phone-portrait-outline" size={24} color={isDark ? "#FFF" : "#000"} />
              <ThemedText style={styles.menuItemTitle}>System Default</ThemedText>
            </View>
            {currentTheme === 'system' && <Ionicons name="checkmark" size={24} color="#0274DF" />}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.themeRow, styles.themeRowBorder]}
            onPress={() => handleThemeChange('light')}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name="sunny-outline" size={24} color={isDark ? "#FFF" : "#000"} />
              <ThemedText style={styles.menuItemTitle}>Light Mode</ThemedText>
            </View>
            {currentTheme === 'light' && <Ionicons name="checkmark" size={24} color="#0274DF" />}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.themeRow}
            onPress={() => handleThemeChange('dark')}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name="moon-outline" size={24} color={isDark ? "#FFF" : "#000"} />
              <ThemedText style={styles.menuItemTitle}>Dark Mode</ThemedText>
            </View>
            {currentTheme === 'dark' && <Ionicons name="checkmark" size={24} color="#0274DF" />}
          </TouchableOpacity>
        </View>

        <ThemedText type="subtitle" style={[styles.sectionTitle, { marginTop: 16 }]}>
          Information
        </ThemedText>
        {renderMenuItem("information-circle-outline", "About Developer", "/about")}
        {renderMenuItem("shield-checkmark-outline", "Privacy Policy", "/privacy")}
      </View>
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
    gap: 8,
  },
  sectionTitle: {
    fontSize: 14,
    textTransform: "uppercase",
    color: "#8E8E93",
    marginBottom: 4,
    marginLeft: 8,
  },
  card: {
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    overflow: "hidden",
  },
  themeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  themeRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(150,150,150,0.2)",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: "500",
  },
});
