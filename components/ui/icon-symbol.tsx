import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolWeight, SymbolViewProps } from "expo-symbols";
import { ComponentProps } from "react";
import { OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";

type IconMapping = Record<SymbolViewProps["name"], ComponentProps<typeof MaterialIcons>["name"]>;
type IconSymbolName = keyof typeof MAPPING;

const MAPPING = {
  // Navigation
  "house.fill": "home",
  "paperplane.fill": "send",
  "chevron.left.forwardslash.chevron.right": "code",
  "chevron.right": "chevron-right",
  "chevron.left": "chevron-left",
  // Tabs
  "clipboard.fill": "assignment",
  "checkmark.circle.fill": "task-alt",
  "chart.bar.fill": "bar-chart",
  "gearshape.fill": "settings",
  // Actions
  "plus.circle.fill": "add-circle",
  "plus": "add",
  "camera.fill": "camera-alt",
  "photo.fill": "photo-library",
  "trash.fill": "delete",
  "pencil": "edit",
  "xmark": "close",
  "checkmark": "check",
  "checkmark.circle": "check-circle-outline",
  "xmark.circle": "cancel",
  "exclamationmark.triangle.fill": "warning",
  "arrow.right.circle.fill": "arrow-circle-right",
  "square.and.arrow.up": "share",
  "doc.text.fill": "description",
  "clock.fill": "schedule",
  "person.fill": "person",
  "mappin.fill": "location-on",
  "star.fill": "star",
  "info.circle.fill": "info",
  "arrow.clockwise": "refresh",
  "ellipsis": "more-horiz",
  "line.3.horizontal.decrease.circle": "filter-list",
} as unknown as IconMapping;

export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
