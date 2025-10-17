import { View, type ViewProps } from 'react-native';

interface SpacerProps extends ViewProps {
  height?: number;
  width?: number;
}

export function Spacer({ height, width, style, ...otherProps }: SpacerProps) {
  return (
    <View
      style={[
        {
          height: height ?? 0,
          width: width ?? 0,
        },
        style,
      ]}
      {...otherProps}
    />
  );
}