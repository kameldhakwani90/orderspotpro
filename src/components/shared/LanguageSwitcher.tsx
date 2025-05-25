
"use client";

import { useLanguage } from "@/context/LanguageContext";
import type { LanguageCode } from "@/lib/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Globe } from "lucide-react";

// Define language options directly in the component or import from a shared constants file
const languageOptions: Array<{ value: LanguageCode; label: string, flag?: string }> = [
  { value: "fr", label: "Français", flag: "🇫🇷" },
  { value: "en", label: "English", flag: "🇬🇧" },
  { value: "ar", label: "العربية", flag: "🇦🇪" }, // Example flag, adjust as needed
];

export function LanguageSwitcher() {
  const { language, setLanguage, t } = useLanguage();

  const handleLanguageChange = (value: string) => {
    setLanguage(value as LanguageCode);
  };

  return (
    <Select value={language} onValueChange={handleLanguageChange}>
      <SelectTrigger 
        className="w-auto h-9 px-2 sm:px-3 bg-card border-border hover:bg-accent focus:ring-primary"
        aria-label={t('selectLanguage')}
      >
        <div className="flex items-center gap-1.5">
          <Globe className="h-4 w-4 text-muted-foreground" />
          <SelectValue />
        </div>
      </SelectTrigger>
      <SelectContent>
        {languageOptions.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            <div className="flex items-center">
              {option.flag && <span className="mr-2">{option.flag}</span>}
              {option.label}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
