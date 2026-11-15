# EARTHSONG — NASA POWER web demo

## Features
- Fetches hourly near-real-time meteorological data from NASA POWER.
- Shows T2M (2-metre air temperature), RH2M (relative humidity), and WS10M (wind speed at 10 metres).
- Plots the last 24 available hourly temperature values.
- Converts hourly temperature values into tones using the browser Web Audio API.
- Refreshes the NASA request every 30 minutes.
- Includes editable latitude/longitude and optional browser geolocation.

## Scientific accuracy note
NASA POWER hourly data is available from 2001 to Near Real Time (NRT). It is NOT a second-by-second live thermometer feed and is not a direct local weather-station reading. It is gridded/model/reanalysis-based meteorological data. The dashboard displays the newest observation returned by NASA and its timestamp.

Official hourly API documentation:
https://power.larc.nasa.gov/docs/services/api/temporal/hourly/

## Run
1. Extract this ZIP.
2. Open the folder in Visual Studio Code.
3. Install the VS Code extension "Live Server".
4. Right-click index.html → Open with Live Server.
5. Keep the internet on (NASA API, Chart.js and Google Fonts need internet).

Alternative: run `python -m http.server 8000` inside the folder and open http://localhost:8000.

Default coordinates 9.50, 76.30 are an approximate Kerala demo point, not a precise address. Change coordinates or use the location button.

## Sonification mapping
Temperature from 0–40 °C maps to approximately 180–620 Hz. This is an artistic data-to-sound mapping, not a physical conversion of temperature into sound.

Before submission, test the API from the hackathon venue network and keep a recorded backup demo.
