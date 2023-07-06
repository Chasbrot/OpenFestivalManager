# OpenFestivalManager
Welcome to the OpenFestivalManager! <br> <br>
This software is intended to help service personal at small festivals (in austrian "festl") where they serve a variaty of foods and drinks. It is a digital ordering system that manages all foods and drinks and sends requests for meals to the assigned stations where they are presented as tickets. It tracks every order and generates digital bills for the service personal. This should drastically reduce the workload of the personal, improve customer satisfaction and generate visibility to the "management" what goes well. 

## Requirements
- Server (Laptop or Desktop PC)
  -  Preferably connected via Ethernet (Cable) to the Network
- Interfaces for the stations
  - Tablets prefered, Laptops work too
- Smartphones for service personal
  - Somewhat new (min. 6" recommended)
  - Chrome Webbrowser (for app like state) or any up-to-date browser
- Good WiFi coverage 
  - 2.4 GHz recommended, higher range/ penetration
  - low latency is important
- Secured and protected WLAN
  - Important first line of defence -> Access restriction

## Installation
Download newest .exe from releases and start. </br>

    usage: festivalmanager [options] --dbpath PATH_TO_DB_FILE
      options:
        -p --port         Port the server listens to
        --rest_cache_time The time (in s) rest requests are cached by the client
        -s --secure       Enables security headers
        --key             Key required for HTTPS
        --cert            Certificate required for HTTPS
        --dbpath          Path to the database
    
Access WebUI under localhost:3000 or IP-Address:3000 <br>
You can save the login page to your home screen which enables a webapp like state with no address bar. This enhances the experiance. <br>
[HowTo](https://android.gadgethacks.com/how-to/google-chrome-101-save-webpages-pwas-your-home-screen-for-instant-access-0184470/)

## Getting started on dev
If you want to modify the source:
- Install nodejs
- Clone 
- Use Microsoft Visual Code
- Open Termianl in the directoy root
  - npm install
  - npm run dev

The webserver should start.

## Usage
Please refer to the wiki.<br>
[Wiki Link](https://github.com/Chasbrot/OpenFestivalManager/wiki)

## Licence
Anyone can use the source code and packged executeable for their personal and non-profit use (a business can use it for their own but not sell it or sell it as a service) as intended. Any modifications or integrations into other projects/software are only allowed after explicit authorization. Copyright Michael Selinger 2023

## Authors 
Michael Selinger<br>
~~Saul Ptrondl~~
## Contributors
Thanks Hannah and Jojo for their knowledge and expertise during development. Thanks Julian Springer for bug testing and some new ideas.

## Project status
early development
