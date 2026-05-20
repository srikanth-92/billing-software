import { useWindowDimensions } from 'react-native';

export function useTablet() {
  const { width } = useWindowDimensions();
  return width >= 768;
}

export function useLayout() {
  const { width, height } = useWindowDimensions();
  return { width, height, isTablet: width >= 768 };
}
