import { cn } from '@/utils/cn';
import React from 'react';
import {
    ActivityIndicator,
    Text,
    TextStyle,
    TouchableOpacity,
    View,
    ViewStyle,
} from 'react-native';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  className?: string;
  textClassName?: string;
  icon?: React.ReactNode;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  style,
  textStyle,
  className,
  textClassName,
  icon,
}: ButtonProps) {
  const variantStyles = {
    primary: disabled
      ? 'bg-gray-300'
      : 'bg-primary',
    secondary: 'bg-background-secondary border border-primary',
    outline: 'bg-transparent border border-primary',
    ghost: 'bg-transparent',
  };

  const textStyles = {
    primary: 'text-white',
    secondary: disabled ? 'text-gray-300' : 'text-primary',
    outline: disabled ? 'text-gray-300' : 'text-primary',
    ghost: disabled ? 'text-gray-300' : 'text-primary',
  };

  const sizeStyles = {
    small: 'px-4 py-2 min-h-[36px]',
    medium: 'px-6 py-3 min-h-[44px]',
    large: 'px-8 py-4 min-h-[52px]',
  };

  const textSizeStyles = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg',
  };

  return (
    <TouchableOpacity
      className={cn(
        'rounded-xl items-center justify-center flex-row',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      style={style}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? '#ffffff' : '#0a7ea4'}
        />
      ) : (
        <>
          {icon && <View className="mr-1">{icon}</View>}
          <Text
            className={cn(
              'font-semibold text-center',
              textStyles[variant],
              textSizeStyles[size],
              icon && 'ml-2',
              textClassName
            )}
            style={textStyle}
          >
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}
