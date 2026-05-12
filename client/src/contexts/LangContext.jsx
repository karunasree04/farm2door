import { createContext, useContext, useState } from 'react'
import { translations } from '../locales/translations'

const LangContext = createContext(null)

export function LangProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('f2d_lang') || 'en')

  const toggleLang = () => {
    const next = lang === 'en' ? 'te' : 'en'
    setLang(next)
    localStorage.setItem('f2d_lang', next)
  }

  const t = (key, vars = {}) => {
    let str = translations[lang]?.[key] || translations.en[key] || key
    Object.entries(vars).forEach(([k, v]) => { str = str.replace(`{${k}}`, v) })
    return str
  }

  return (
    <LangContext.Provider value={{ lang, toggleLang, t }}>
      {children}
    </LangContext.Provider>
  )
}

export const useLang = () => useContext(LangContext)
