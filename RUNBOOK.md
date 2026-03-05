# bard-buddy Runbook

## Příprava prostředí

### Předpoklady
- Node.js 20+ (máš verzi 22)
- npm (máš verzi 10.9)
- GEMINI_API_KEY nastavena v prostředí
- gemini CLI CLI dostupné v PATH

Ověření:
```bash
node --version       # v22.22.0 ✓
npm --version        # 10.9.4 ✓
echo $GEMINI_API_KEY # měl by být nastaven
which gemini         # /home/alfred/.npm-global/bin/gemini ✓
```

## Instalace

```bash
cd /home/alfred/.openclaw/workspace/bard-buddy
npm install
```

## Spuštění

### Development server
```bash
npm run dev
```

Výstup:
```
> bard-buddy@0.1.0 dev
> next dev

▲ Next.js 15.x.x
- Local:   http://localhost:3000
```

Otevři http://localhost:3000 v prohlížeči.

## Testování funkcí

### 1. Editor + Auto-save
- Opiš nějaký text
- Verifikuj: "Ukládám..." se krátce zobrazí (každé 3 sekundy)
- Zkontroluj: `bard.db` soubor byl vytvořen v `/home/alfred/.openclaw/workspace/bard-buddy/`

### 2. Metriky
- V editoru piš český text (řádky)
- Vlevo by se měly zobrazit metriky: počet slabik, zpěvnost, rýmové konce
- Zkus: "Modrá obloha visí nad mnou" (6 slabik)

### 3. Asistance (Gemini)
- Vyber text v editoru
- Klikni "Vygeneruj" (režim: Alternativy)
- Měl by se objevit návrh alternativního verše
- Pokud je chyba "Failed to generate", ověř GEMINI_API_KEY

### 4. Verze
- Napiš něco
- Počkej 3 sekundy (auto-save)
- V pravém sloupci "Verze" by se měla objevit verze
- Klikni na verzi: obsah se obnoví

## Troubleshooting

### "GEMINI_API_KEY is not set"
```bash
export GEMINI_API_KEY="your-api-key-here"
npm run dev
```

### "gemini: command not found"
```bash
# Zkontroluj cestu
which gemini
/home/alfred/.npm-global/bin/gemini

# Nebo je-li gemini v ~/.npm-global/, přidej do PATH
export PATH="$HOME/.npm-global/bin:$PATH"
```

### SQLite chyby
```bash
# Smaž bard.db a začni znovu
rm bard.db
npm run dev
```

### Port 3000 už je v použití
```bash
npm run dev -- -p 3001
```

## Build produkce

```bash
npm run build
npm start
```

## Struktura projektu

```
bard-buddy/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Hlavní stránka
│   │   ├── layout.tsx            # Root layout
│   │   ├── globals.css           # Tailwind CSS
│   │   └── api/
│   │       ├── assist/           # /api/assist (Gemini)
│   │       ├── metrics/          # /api/metrics (výpočty)
│   │       └── versions/         # /api/versions (databáze)
│   ├── components/
│   │   ├── Editor.tsx            # Textový editor
│   │   ├── MetricsPanel.tsx      # Metriky (slabiky, zpěvnost)
│   │   ├── AssistPanel.tsx       # Gemini návrhy
│   │   └── VersionSidebar.tsx    # Historie verzí
│   ├── lib/
│   │   ├── czech-metrics.ts      # Algoritmy pro češtinu
│   │   ├── db.ts                 # Drizzle + SQLite init
│   │   └── gemini.ts             # Gemini integrace
│   └── db/
│       └── schema.ts             # Drizzle ORM schéma
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── next.config.js
├── RUNBOOK.md                    # Tento soubor
├── decisions.md                  # Architekturní rozhodnutí
└── bard.db                       # SQLite databáze (generováno)
```

## Next steps

- [ ] Přidat importy inspirativních textů
- [ ] Grafické mapování tónu/emocí
- [ ] Detekce plagiátu (anti-copycat)
- [ ] Rytmický pattern matching
- [ ] Experimentální režim (A/B testy)
