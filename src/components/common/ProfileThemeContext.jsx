import React, { createContext, useContext, useState } from 'react';

const ProfileThemeContext = createContext();

export function ProfileThemeProvider({ children }) {
  const [profileTheme, setProfileTheme] = useState(null);

  return (
    <ProfileThemeContext.Provider value={{ profileTheme, setProfileTheme }}>
      {children}
    </ProfileThemeContext.Provider>
  );
}

export function useProfileThemeContext() {
  const ctx = useContext(ProfileThemeContext);
  if (!ctx) throw new Error('useProfileThemeContext must be used within ProfileThemeProvider');
  return ctx;
}