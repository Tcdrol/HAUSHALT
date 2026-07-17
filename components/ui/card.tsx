import { useColorScheme } from '@/hooks/use-color-scheme';
import { cn } from '@/utils/cn';
import React from 'react';
import { View, ViewStyle } from 'react-native';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  className?: string;
  variant?: 'default' | 'outlined' | 'elevated';
  padding?: 'none' | 'small' | 'medium' | 'large';
}

export function Card({
  children,
  style,
  className,
  variant = 'default',
  padding = 'medium',
}: CardProps) {
  const colorScheme = useColorScheme();

  const variantStyles = {
    default: 'bg-card rounded-xl overflow-hidden',
    outlined: 'bg-card rounded-xl overflow-hidden border border-border',
    elevated: cn(
      'bg-card rounded-xl overflow-hidden',
      colorScheme === 'dark'
        ? 'shadow-lg shadow-black/20'
        : 'shadow-lg shadow-black/10'
    ),
  };

  const paddingStyles = {
    none: 'p-0',
    small: 'p-3',
    medium: 'p-5',
    large: 'p-6',
  };

  return (
    <View
      className={cn(variantStyles[variant], paddingStyles[padding], className)}
      style={style}
    >
      {children}
    </View>
  );
}
