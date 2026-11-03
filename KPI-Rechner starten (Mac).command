#!/bin/sh
# Startet den KPI-Rechner in einem eigenen App-Fenster (ohne Tabs und Adressleiste).
# Nutzt Google Chrome, Microsoft Edge oder Brave, falls installiert, sonst den Standardbrowser (z. B. Safari).
DIR="$(cd "$(dirname "$0")" && pwd)"
APP="$DIR/app/kpi-rechner.html"
URL="file://$(printf '%s' "$APP" | sed 's/ /%20/g')"

for BROWSER in "Google Chrome" "Microsoft Edge" "Brave Browser" "Chromium"; do
  if [ -d "/Applications/$BROWSER.app" ] || [ -d "$HOME/Applications/$BROWSER.app" ]; then
    open -na "$BROWSER" --args --app="$URL" --window-size=1280,900
    exit 0
  fi
done
open "$APP"
