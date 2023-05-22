# OpenFestivalManager
Welcome to the OpenFestivalManager! <br> <br>
This software is intended to help service personal at small festivals (in austrian "festl") where they serve a variaty of foods and drinks. It is a digital ordering system that manages all foods and drinks and sends requests for meals to the assigned stations where they are presented as tickets. It tracks every order and generates digital bills for the service personal. This should drastically reduce the workload of the personal, improve customer satisfaction and generate visibility to the "management" what goes well. 

## Requirements
- Postgres Database (maybe i switch sometime to  integrated sqlite)
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
Download newest .exe from releases and start. Config file is passed via --env #PATH#. </br>
Access WebUI under localhost:3000 or IP-Address:3000 <br>
You can save the login page to your home screen which enables a webapp like state with no address bar. This enhances the experiance. 
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
Please refer to the wiki.

## Finished UI Pages
Move all UI to client-side rendering with REST-based communication to the service.
- :heavy_check_mark: Index
- :heavy_check_mark: Personal
  - :heavy_check_mark: Login
  - :heavy_check_mark: Overview
- :arrows_counterclockwise: Session
  - :heavy_check_mark: New
  - :heavy_check_mark: Move
  - :arrows_counterclockwise: Overview (Ordering Page)
  - :arrows_counterclockwise: Bill (Billing Page)
  - :heavy_check_mark: Bills (Overview of all Bills)
  - :heavy_check_mark: Order details
- :heavy_check_mark: Station
  - :heavy_check_mark: Login
  - :heavy_check_mark: Overview (Main Page)
- :arrows_counterclockwise: Admin
  - :heavy_check_mark: Login
  - :arrows_counterclockwise: Overview (Dashboard)
  - :arrows_counterclockwise: Statistics
  - :heavy_check_mark: Data Insight
  - :x: Data Source
  - :heavy_check_mark: Configuration

## ToDo Improvements

### General Improvements / Fixes
- :heavy_check_mark: Timestamps at start of order state change (processing, delivering, finished, canceled)
- :heavy_check_mark: Save who cancled an order
- :heavy_check_mark: Order states tied to station
- :heavy_check_mark: Update all UI to Bootstrap 5
- :arrows_counterclockwise: Move all requests to Ajax and REST
- :x: Optional: DB Optimizations and DB side caching
- :arrows_counterclockwise: Error Messages everywhere
  - :x: Admin UI
  - :x: Personal UI
  - :x: Station UI
  - :x: Table UI
- :heavy_check_mark: Backend Refactoring -> move to English
- :heavy_check_mark: Fix: Notification for recieved order
- :heavy_check_mark: Versioning
- :heavy_check_mark: Payment system overhaul -> generate real bills inside the DB
- :x: DB checks for consistancy
- :x: Fix DB tools
- :heavy_check_mark: Consistant express validation
  - :heavy_check_mark: Admin UI
  - :heavy_check_mark: Personal UI
  - :heavy_check_mark: Station UI
  - :heavy_check_mark: Table UI
- :heavy_check_mark: Session Management improvement
- :x: Multi-language support (english/german)

### Admin UI
- :x: Show state of the modules (DHCP, DNS, DB)
- :arrows_counterclockwise: All source data (Stammdaten, in german) is editable via UI
  - :heavy_check_mark: Add
  - :heavy_check_mark: Remove
  - :x: Modify
- :arrows_counterclockwise: Insight to orders by personal and detailed info for a order
- :x: DB config is read from file and editable via ui (IP,Port,User and PW)

### Personal UI
- :heavy_check_mark: Show details of an order
- :heavy_check_mark: Group finished/canceled orders by type/name
- :x: Reorder Button, Reorders a specific item
- :x: Close all open orders by type button e.g. close 5 drinks at once instead of 5times one

### New Features
- :x: Product States -> hidden, disabled, etc.
- :heavy_check_mark: More order states
- :heavy_check_mark: Package-to-Executable -> .exe
- :heavy_check_mark: Group by Product Categories for Personal -> (Alk, Anti, Grill, Kitchen)
- :heavy_check_mark: Product Variations -> Wine (Red or White)
- :x: PDF-Generator -> Generate PDF with stats per day or for all days incl. sold products, general load, details per station
- :x: DHCP-Server -> All-in-one with DNS for resolving the domain in unconfigurable networks


## Authors 
Michael Selinger<br>
~~Julian Springer~~<br>
~~Saul Ptrondl~~
## Contributors
Thanks Hannah and Jojo for their knowledge and expertise during development.

## Project status
early development
