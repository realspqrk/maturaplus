@echo off
rem Startet den KPI-Rechner in einem eigenen App-Fenster (ohne Tabs und Adressleiste).
rem Nutzt Microsoft Edge (in Windows enthalten) oder Google Chrome, sonst den Standardbrowser.
setlocal
set "APP=%~dp0app\kpi-rechner.html"
if not exist "%APP%" (
  echo Die Datei "%APP%" wurde nicht gefunden.
  echo Bitte lade den kompletten Ordner herunter bzw. entpacke ihn und versuche es erneut.
  pause
  exit /b 1
)
set "URL=file:///%APP:\=/%"

for %%B in (msedge.exe chrome.exe) do (
  for %%K in (HKCU HKLM) do (
    reg query "%%K\SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\%%B" >nul 2>&1 && (
      start "" %%B --app="%URL%" --window-size=1280,900
      exit /b 0
    )
  )
)
start "" "%APP%"
