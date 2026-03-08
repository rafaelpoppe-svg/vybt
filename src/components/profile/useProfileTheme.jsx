import { BACKGROUND_THEMES } from './BackgroundThemeSelector';

export const useProfileTheme = (theme = 'default') => {
  const themeConfig = BACKGROUND_THEMES[theme] || BACKGROUND_THEMES.default;

  const getBackgroundGradient = () => {
    const colors = themeConfig.gradient.replace('from-', '').replace('to-', '').split(' ');
    return `linear-gradient(135deg, var(--tw-gradient-stops))`;
  };

  const getBackgroundStyle = () => {
    const gradientClass = themeConfig.gradient;
    return {
      backgroundImage: `linear-gradient(135deg, rgb(11, 11, 11) 0%, rgba(11, 11, 11, 0.9) 100%)`,
      background: gradientClass
    };
  };

  const getEmoji = () => themeConfig.emoji;
  const getThemeName = () => themeConfig.name;

  return {
    emoji: getEmoji(),
    name: getThemeName(),
    gradient: themeConfig.gradient,
    getBackgroundStyle
  };
};