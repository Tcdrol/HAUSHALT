import { cn } from '@/utils/cn';
import React from 'react';
import {
    Text,
    TextInput,
    TextInputProps,
    View
} from 'react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerClassName?: string;
  inputClassName?: string;
}

export function Input({
  label,
  error,
  leftIcon,
  rightIcon,
  containerClassName,
  inputClassName,
  style,
  ...textInputProps
}: InputProps) {
  return (
    <View className={cn('mb-4', containerClassName)}>
      {label && (
        <Text className="text-base font-semibold mb-2 text-text">{label}</Text>
      )}
      
      <View className="relative">
        {leftIcon && (
          <View className="absolute left-4 top-3 z-10">{leftIcon}</View>
        )}
        
        <TextInput
          className={cn(
            'border rounded-lg text-base h-12 py-3 bg-background text-text',
            error ? 'border-error' : 'border-border',
            leftIcon ? 'pl-12' : 'pl-4',
            rightIcon ? 'pr-12' : 'pr-4',
            inputClassName
          )}
          style={style}
          placeholderTextColor="#666666"
          {...textInputProps}
        />
        
        {rightIcon && (
          <View className="absolute right-4 top-3 z-10">{rightIcon}</View>
        )}
      </View>
      
      {error && (
        <Text className="text-sm mt-1 text-error">{error}</Text>
      )}
    </View>
  );
}
