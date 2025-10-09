import React, { useMemo } from 'react';
import Input, { InputProps } from './Input';

export type NumberInputProps = Omit<InputProps, 'type' | 'inputMode' | 'onChange' | 'value'> & {
  value: string | number;
  onChange: (value: string) => void;
  step?: string | number;
  min?: string | number;
  max?: string | number;
};

export default function NumberInput({
  value,
  onChange,
  step = '0.01',
  min,
  max,
  ...rest
}: NumberInputProps) {
  const v = useMemo(() => (value ?? '').toString(), [value]);
  return (
    <Input
      {...rest}
      type="number"
      inputMode="decimal"
      step={step as any}
      min={min as any}
      max={max as any}
      value={v}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}
