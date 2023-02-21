# FestivalManager

## Getting started

Clone repository
Open repository with MSV code
Open terminal

npm install 
    express
    express-session
    express-validator
    typeorm
    body-parser
    cookie-parser
    dotenv
    ejs
    multer
    mysqldump
    pg
    rand-token
    reflect-metadata
    @types/cookie-parser
    @types/ejs
    @types/express-session
    @types/multer

npm run devstart

## Description
A webbased ordering tool for small festivals ("festl" in austrian). It manages food and drink orders for service personal. Automatically send food orders to assigned stations and tracks the order.

## Requirements
- Postgres Database
- Server (Laptop or Desktop PC)
  -  Preferably connected via Ethernet (Cable) to the Network
- Interfaces for the stations
  - Tablets prefered, Laptops work too
- Smartphones for service personal
  - Somewhat new (min. 6" recommended)
- Good WiFi coverage 
  - 2.4 GHz recommended, higher range/ penetration
- Secured and protected WLAN
  - Important first line of defence -> Access restriction

## Installation
Download newest .exe from releases and start. Config file is passed via --env #PATH#. 
Access WebUI under localhost:3000 or IP-Address:3000

## Usage
Access WebUI

## Architecture
![alt text](<./Architecture.PNG>) 
For the Server Node.Js with Express is used, the database backend is provided by a PostgreSQL database. On the mobile client the UI is styled with Bootstrap 5.2 and the framework is provided by Vue.js. Frontend communication is handeled via REST API calls.

## Finished UI Pages
Move all UI to client-side rendering with REST-based communication to the service.
- :x: Index
- :x: Personal
  - :x: Login
  - :x: Overview
- :x: Session
  - :heavy_check_mark: New
  - :x: Move
  - :x: Overview (Ordering Page)
  - :x: Bill (Billing Page)
  - :heavy_check_mark: Bills (Overview of all Bills)
  - :x: Order details
- :x: Station
  - :x: Login
  - :x: Overview (Main Page)
- :x: Admin
  - :x: Login
  - :x: Overview (Dashboard)
  - :x: Statistics
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
- :x: Error Messages everywhere
  - :x: Admin UI
  - :x: Personal UI
  - :x: Station UI
  - :x: Table UI
- :heavy_check_mark: Backend Refactoring -> move to English
- :heavy_check_mark: Fix: Notification for recieved order
- :x: Versioning
- :heavy_check_mark: Payment system overhaul -> generate real bills inside the DB
- :x: DB checks for consistancy
- :x: Fix DB tools
- :arrows_counterclockwise: Consistant express validation
  - :x: Admin UI
  - :x: Personal UI
  - :x: Station UI
  - :x: Table UI
- :heavy_check_mark: Session Management improvement

### Admin UI
- :x: Show state of the modules (DHCP, DNS, DB)
- :arrows_counterclockwise: All source data (Stammdaten, in german) is editable via UI
  - :heavy_check_mark: Add
  - :x: Remove
  - :x: Modify
- :arrows_counterclockwise: Insight to orders by personal and detailed info for a order
- :x: DB config is read from file and editable via ui (IP,Port,User and PW)

### Personal UI
- :heavy_check_mark: Show details of an order
- :heavy_check_mark: Group finished/canceled orders by type/name

### New Features
- :x: Product States -> hidden, disabled, etc.
- :heavy_check_mark: More order states
- :x: Package-to-Executable -> .exe
- :arrows_counterclockwise: Group by Product Categories for Personal -> (Alk, Anti, Grill, Kitchen)
- :heavy_check_mark: Product Variations -> Wine (Red or White)
- :x: PDF-Generator -> Generate PDF with stats per day or for all days incl. sold products, general load, details per station
- :x: DHCP-Server -> All-in-one with DNS for resolving the domain in unconfigurable networks

## Authors 
Michael Selinger<br>
Julian Springer<br>
~~Saul Ptrondl~~
## Contributors
Thanks Hannah and Jojo for their knowledge and expertise during development.

## Project status
early development
