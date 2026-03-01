import { useState, useEffect, useCallback } from 'react';

const SETTINGS_KEY = 'app_settings';
const COMPANY_KEY = 'orderly_company_settings';

export interface CompanySettings {
  name: string;
  address: string;
  phone: string;
  email: string;
  taxId: string;
  website: string;
}

export interface AppSettings {
  company: CompanySettings;
  pdfIntroduction: string;
  pdfFooter: string;
}

const defaultSettings: AppSettings = {
  company: {
    name: '',
    address: '',
    phone: '',
    email: '',
    taxId: '',
    website: '',
  },
  pdfIntroduction: '',
  pdfFooter: '',
};

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  // Load settings from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Merge with defaults to handle new fields
        setSettings({
          ...defaultSettings,
          ...parsed,
          company: {
            ...defaultSettings.company,
            ...parsed.company,
          },
        });
      } catch (e) {
        console.error('Error parsing settings:', e);
        setSettings(defaultSettings);
      }
    } else {
      setSettings(defaultSettings);
    }
    setIsLoading(false);
  }, []);

  // Save settings to localStorage
  const updateSettings = useCallback((newSettings: Partial<AppSettings>) => {
    setSettings(prev => {
      const updated = {
        ...prev,
        ...newSettings,
        company: {
          ...prev.company,
          ...(newSettings.company || {}),
        },
      };
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const updateCompany = useCallback((company: Partial<CompanySettings>) => {
    // Load existing company data
    const existingData = localStorage.getItem(COMPANY_KEY);
    const existing = existingData ? JSON.parse(existingData) : {};
    
    // Merge with new data
    const updated = {
      ...existing,
      ...company,
    };
    
    // Save to company-specific key
    localStorage.setItem(COMPANY_KEY, JSON.stringify(updated));
    
    // Also update the main settings for compatibility
    updateSettings({ company });
  }, [updateSettings]);

  return {
    settings,
    isLoading,
    updateSettings,
    updateCompany,
  };
}
