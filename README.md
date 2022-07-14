# FestivalManager

## Getting started

Clone repository
Open repository with MSV code
Open terminal

npm install

npm install express-flash --save<br>
npm install express-session --save<br>
npm install body-parser --save<br>
npm install mysql2 --save<br>
npm install cookie-parser --save<br>
npm install random-token --save <br>

npm run devstart

## Description
A webbased ordering tool for small festivals ("festl" in austrian). It manages food and drink orders for service personal. Automatically send food orders to assigned stations and tracks the order.

## Requirements
- MySQL Database, Nodejs
- Server (Laptop or Desktop PC)
  -  Preferably connected via Ethernet to the Network
- Interfaces for the stations
  - Tablets prefered, Laptops work too
- Smartphones for service personal
  - Somewhat new (min. 6" recommended)
- Good WiFi coverage 
  - 2.4 GHz recommended, higher range/ penetration
- Secured and protected WLAN
  - Important first line of defence -> Access restriction

## Installation
Clone Repo to Server and start webservice with: node app.js<br>
Access WebUI under localhost:3000 or IP-Address:3000

## Usage
Access WebUI

## ToDo Improvements

### General Improvements / Fixes
- :x: Timestamps at start of order state change (processing, delivering, finished, canceled)
- :x: Save who cancled an order
- :x: Order states tied to station
- :x: Update all UI to Bootstrap 5
- :x: Move all requests to Ajax and REST
- :x: Optional: DB Optimizations and DB side caching
- :x: Error Messages everywhere
  - :x: Admin UI
  - :x: Personal UI
  - :x: Station UI
  - :x: Table UI
- :x: Backend Refactoring -> move to English
- :x: Fix: Notification for recieved order
- :x: Versioning
- :x: Payment system overhaul -> generate real bills inside the DB
- :x: DB checks for consistancy
- :x: Fix DB tools
- :x: Consistant express validation
  - :x: Admin UI
  - :x: Personal UI
  - :x: Station UI
  - :x: Table UI
- :x: Session Management improvement

### Admin UI
- :x: Show state of the modules (DHCP, DNS, DB)
- :x: All source data (Stammdaten, in german) is editable via UI
- :x: Insight to orders by personal and detailed info for a order
- :x: DB config is read from file and editable via ui (IP,Port,User and PW)

### Personal UI
- :x: Show details of an order
- :x: Group finished orders by type/name
 -   3x Sausage instead of 
 -   1x Sausage
 -   1x Sausage
 -   1x Sausage

### New Features
- :x: Product States -> hidden, disabled, etc.
- :x: More order states
- :x: Package-to-Executable -> .exe
- :x: Group by Product Categories for Personal -> (Alk, Anti, Grill, Kitchen)
- :x: Product Variations -> Wine (Red or White)
- :x: PDF-Generator -> Generate PDF with stats per day or for all days incl. sold products, general load, details per station
- :x: DHCP-Server -> All-in-one with DNS for resolving the domain in unconfigurable networks




## Authors 
Michael Selinger<br>
~~Saul Ptrondl~~

## Project status
early development
