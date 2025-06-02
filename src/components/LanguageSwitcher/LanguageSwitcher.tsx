import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';

const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' }
];

export const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  const handleLanguageChange = (languageCode: string) => {
    i18n.changeLanguage(languageCode);
    setIsOpen(false);
  };

  return (
    <div className="fixed bottom-5 left-5 z-50">
      <div className="relative">
        <Button
          onClick={() => setIsOpen(!isOpen)}
          variant="outline"
          size="icon"
          className="rounded-full bg-spdm-dark border-spdm-green/40 hover:bg-spdm-green/10"
        >
          <Globe className="h-5 w-5 text-spdm-green" />
        </Button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute bottom-full left-0 mb-2 bg-spdm-dark border border-spdm-green/40 rounded-lg shadow-lg overflow-hidden min-w-[150px]"
            >
              {languages.map((language) => (
                <button
                  key={language.code}
                  onClick={() => handleLanguageChange(language.code)}
                  className={`w-full px-4 py-2 text-left hover:bg-spdm-green/10 flex items-center gap-2 ${
                    language.code === currentLanguage.code ? 'text-spdm-green bg-spdm-green/5' : 'text-gray-300'
                  }`}
                >
                  <span className="text-xl">{language.flag}</span>
                  <span>{language.name}</span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};