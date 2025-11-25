/**
 * theme.ts
 * 
 * @author Adam Mechouate
 * @company OPTIMI Solutions GmbH
 * @email adam.mechouate7@gmail.com
 * @date 2025-11-06
 */
export const BRAND_LIGHT_BLUE = '#00AEEF';
export const BRAND_DARK_BLUE = '#0072BC';

// React Native Paper theme (minimal override)
export const paperTheme = {
  colors: {
    primary: BRAND_DARK_BLUE,
    secondary: BRAND_LIGHT_BLUE,
  },
} as const;

// Navigation theme overrides
export const navigationColors = {
  headerBackground: BRAND_DARK_BLUE,
  headerTint: '#ffffff',
  tabBarBackground: BRAND_DARK_BLUE,
  tabBarActive: BRAND_LIGHT_BLUE,
  tabBarInactive: '#b3dff3',
} as const;
