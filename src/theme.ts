import { Platform, type TextStyle, type ViewStyle } from 'react-native';

export const colors = {
  primary: '#4F614E',
  secondary: '#7A886E',
  accent: '#D4A85B',
  background: '#F5F3EA',
  surface: '#F5F3EA',
  surfaceRaised: '#FFFEF8',
  ink: '#1F241E',
  muted: '#586052',
  border: '#CAD0C2',
  borderStrong: '#AAB4A0',
  primaryDark: '#394938',
  primarySoft: '#DFE5DA',
  secondarySoft: '#E7EADF',
  accentSoft: '#F3E4C4',
  warning: '#73561F',
  warningBackground: '#F3E4C4',
  danger: '#944B43',
  dangerDark: '#71362F',
  dangerSoft: '#F2DEDA',
  today: '#D4A85B',
  todaySoft: '#F3E4C4',
  upcoming: '#4F614E',
  upcomingSoft: '#DFE5DA',
  success: '#4F614E',
  successSoft: '#DFE5DA',
  disabled: '#AAB1A3',
  monochromeBlack: '#000000',
  monochromeInk: '#222222',
  monochromeMuted: '#555555',
  monochromeBorder: '#9A9A9A',
  monochromeSurface: '#FFFFFF',
  transparent: 'transparent',
  overlay: 'rgba(31, 36, 30, 0.44)',
} as const;

export const fonts = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  extraBold: 'Inter_800ExtraBold',
} as const;

export const typography = {
  display: { fontFamily: fonts.extraBold, fontSize: 44, lineHeight: 48, letterSpacing: -1.5 },
  h1: { fontFamily: fonts.extraBold, fontSize: 38, lineHeight: 42, letterSpacing: -1.1 },
  h2: { fontFamily: fonts.semibold, fontSize: 26, lineHeight: 32, letterSpacing: -0.4 },
  h3: { fontFamily: fonts.bold, fontSize: 21, lineHeight: 27 },
  body: { fontFamily: fonts.regular, fontSize: 18, lineHeight: 26 },
  bodyStrong: { fontFamily: fonts.semibold, fontSize: 18, lineHeight: 25 },
  button: { fontFamily: fonts.bold, fontSize: 18, lineHeight: 23 },
  caption: { fontFamily: fonts.medium, fontSize: 14, lineHeight: 19 },
  overline: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    lineHeight: 19,
    letterSpacing: 2.1,
    textTransform: 'uppercase',
  },
} satisfies Record<string, TextStyle>;

export const spacing = {
  none: 0,
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
  huge: 48,
} as const;

export const radii = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 28,
  pill: 999,
} as const;

export const shadows = {
  soft: Platform.select<ViewStyle>({
    ios: {
      shadowColor: colors.ink,
      shadowOpacity: 0.06,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 5 },
    },
    android: { elevation: 2 },
    default: { boxShadow: '0 5px 14px rgba(31,36,30,0.06)' },
  }) ?? {},
} as const;

export const sizes = {
  tapMin: 56,
  control: 64,
  sidebar: 248,
  iconSm: 18,
  iconMd: 22,
  iconLg: 28,
  iconXl: 40,
  banner: 320,
  contentMax: 1180,
} as const;

export const layout = {
  radius: radii.md,
  tapHeight: sizes.control,
  pagePadding: spacing.xxl,
} as const;

export const cardStyle: ViewStyle = {
  backgroundColor: colors.surface,
  borderColor: colors.border,
  borderRadius: radii.lg,
  borderWidth: 1,
  ...shadows.soft,
};
