// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolWeight } from 'expo-symbols';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

// Extend the mapping to include our custom icons
const EXTENDED_MAPPING = {
  'house.fill': 'home',
  'home': 'home',
  'paperplane.fill': 'send',
  'chevron.left.forwardslash.chevron.right': 'code',
  'person.fill': 'person',
  'person.2.fill': 'group',
  'chart.bar.fill': 'bar-chart',
  'line.3.horizontal': 'menu',
  'plus.circle.fill': 'add-circle',
  'cart.fill': 'shopping-cart',
  'phone.fill': 'phone',
  'car.fill': 'directions-car',
  'bolt.fill': 'flash-on',
  'xmark.circle.fill': 'cancel',
  'arrow.up.circle': 'arrow-upward',
  'arrow.down.circle': 'arrow-downward',
  'arrow.up.circle.fill': 'arrow-upward',
  'arrow.down.circle.fill': 'arrow-downward',
  'checkmark.circle.fill': 'check-circle',
  'dollarsign.circle.fill': 'attach-money',
  'calendar': 'calendar-today',
  'exclamationmark.triangle.fill': 'warning',
  'exclamationmark.circle.fill': 'error',
  'lightbulb.fill': 'lightbulb',
  'trending.up.fill': 'trending-up',
  'trending.down.fill': 'trending-down',
  'alert.fill': 'notifications',
  'clock.fill': 'schedule',
  'circle.fill': 'radio-button-checked',
  'location.fill': 'location-on',
  'gear.fill': 'settings',
  'download.fill': 'download',
  'shield.fill': 'security',
  'questionmark.circle.fill': 'help',
  'arrow.up.square.fill': 'logout',
  'info.circle.fill': 'info',
  'chevron.right': 'chevron-right',
  'chevron.left': 'chevron-left',
  'bell.fill': 'notifications',
  'lock.fill': 'lock',
  'key.fill': 'vpn-key',
  'trash.fill': 'delete',
  'mail.fill': 'email',
  'chat.fill': 'chat',
  'star.fill': 'star',
  'list.bullet': 'list',
  'chevron.up': 'expand-less',
  'chevron.down': 'expand-more',
  'minus.circle.fill': 'remove-circle',
  'fork.knife': 'restaurant',
  'gamecontroller.fill': 'sports-esports',
  'heart.fill': 'favorite',
  'bag.fill': 'shopping-bag',
  'book.fill': 'menu-book',
} as const;

type IconSymbolName = keyof typeof EXTENDED_MAPPING;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
  weight,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={EXTENDED_MAPPING[name]} style={style} />;
}
