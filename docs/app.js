const STORAGE_KEY = 'owge_v17_northern_shield_default';
const PLAYER_CLAIM_KEY = `${STORAGE_KEY}_playerClaim`;
const PLAYER_INSTANCE_KEY = `${STORAGE_KEY}_playerInstance`;
const STATE_CHANNEL_NAME = `${STORAGE_KEY}_state_channel`;
let stateChannel = null;
let syncPollTimer = null;
let lastKnownSyncToken = null;

const DEFAULT_TEMPLATE = {
  scenario: {
  "name": "Blank Maritime Scenario",
  "overview": "Start from an empty chart. Facilitator places zones and assets manually, then saves the setup as a scenario package.",
  "turn": 1,
  "timeLabel": "H+0",
  "movementPressure": 0,
  "timePressure": 0,
  "assetPressure": 0,
  "shippingConfidence": 6,
  "zoneControlScore": 0,
  "objectiveScore": 0,
  "failureState": "",
  "currentSituation": "No scenario geometry yet. Build the battlespace by placing zones and assets on the map.",
  "overlayMode": "openseamap",
  "redDoctrine": "manual",
  "rememberLastMapView": true,
  "lastMapView": {
    "center": [
      53.40298,
      5.01938
    ],
    "zoom": 10
  },
  "pinnedMapView": null,
  "turnDurationHours": 1,
  "symbolStyle": "ntds",
  "statusUpdateIntervalHours": 6
},
  zones: {}
};

const DEFAULT_STATE = {
  "version": 17,
  "scenario": {
    "name": "Blank Maritime Scenario",
    "overview": "Start from an empty chart. Facilitator places zones and assets manually, then saves the setup as a scenario package.",
    "turn": 1,
    "timeLabel": "H+0",
    "movementPressure": 0,
    "timePressure": 0,
    "assetPressure": 0,
    "shippingConfidence": 6,
    "zoneControlScore": 0,
    "objectiveScore": 0,
    "failureState": "",
    "currentSituation": "No scenario geometry yet. Build the battlespace by placing zones and assets on the map.",
    "overlayMode": "openseamap",
    "redDoctrine": "manual",
    "rememberLastMapView": true,
    "lastMapView": {
      "center": [
        53.40298,
        5.01938
      ],
      "zoom": 10
    },
    "pinnedMapView": null,
    "turnDurationHours": 1,
    "symbolStyle": "ntds",
    "statusUpdateIntervalHours": 6
  },
  "zones": {},
  "selectedZoneId": "",
  "selectedAssetId": "asset-13",
  "mapMode": "select",
  "session": {
    "cells": [
      {
        "id": "blue-maritime",
        "name": "Blue Maritime",
        "domain": "maritime"
      },
      {
        "id": "blue-port",
        "name": "Blue Port Authority",
        "domain": "logistics"
      }
    ],
    "initialStatusSentByCell": {},
    "lastRoutineStatusBucketByCell": {}
  },
  "assets": [
    {
      "id": "asset-1",
      "name": "MV Mercury",
      "type": "container_ship",
      "affiliation": "unknown",
      "representation": "unit",
      "status": "available",
      "zone": "",
      "fuel": 10,
      "readiness": 4,
      "assignedCell": "",
      "lat": 53.227413,
      "lon": 4.523621,
      "heading": 167,
      "speed": 14.8,
      "trackQuality": "q2",
      "sensorProfile": {
        "radar": 12,
        "visual": 8,
        "inspection": 0.5
      },
      "waypoints": [
        {
          "lat": 53.30975,
          "lon": 4.630737,
          "label": "WP1"
        }
      ]
    },
    {
      "id": "asset-2",
      "name": "MV Iron Crest",
      "type": "bulk_carrier",
      "affiliation": "neutral",
      "representation": "unit",
      "status": "available",
      "zone": "",
      "fuel": 10,
      "readiness": 4,
      "assignedCell": "",
      "lat": 53.554179,
      "lon": 4.588165,
      "heading": 253.4,
      "speed": 15.5,
      "trackQuality": "q2",
      "sensorProfile": {
        "radar": 12,
        "visual": 8,
        "inspection": 0.5
      },
      "waypoints": [
        {
          "lat": 53.413215,
          "lon": 4.570313,
          "label": "WP1"
        }
      ]
    },
    {
      "id": "asset-3",
      "name": "MT Sea Spirit",
      "type": "tanker",
      "affiliation": "neutral",
      "representation": "unit",
      "status": "available",
      "zone": "",
      "fuel": 10,
      "readiness": 4,
      "assignedCell": "",
      "lat": 53.560705,
      "lon": 5.373688,
      "heading": 163.3,
      "speed": 12.1,
      "trackQuality": "q2",
      "sensorProfile": {
        "radar": 12,
        "visual": 8,
        "inspection": 0.5
      },
      "waypoints": [
        {
          "lat": 53.577627,
          "lon": 5.448532,
          "label": "WP1"
        }
      ]
    },
    {
      "id": "asset-4",
      "name": "LNG Arctic Flow",
      "type": "lng_carrier",
      "affiliation": "neutral",
      "representation": "unit",
      "status": "available",
      "zone": "",
      "fuel": 10,
      "readiness": 4,
      "assignedCell": "",
      "lat": 53.579461,
      "lon": 4.9823,
      "heading": 193.2,
      "speed": 15.9,
      "trackQuality": "q3",
      "sensorProfile": {
        "radar": 12,
        "visual": 8,
        "inspection": 0.5
      },
      "waypoints": [
        {
          "lat": 53.494378,
          "lon": 4.689789,
          "label": "WP1"
        }
      ]
    },
    {
      "id": "asset-5",
      "name": "MV Channel Runner",
      "type": "ro_ro_ferry",
      "affiliation": "suspect",
      "representation": "unit",
      "status": "available",
      "zone": "",
      "fuel": 10,
      "readiness": 4,
      "assignedCell": "",
      "lat": 53.538709,
      "lon": 4.766963,
      "heading": 66.8,
      "speed": 13.2,
      "trackQuality": "q4",
      "sensorProfile": {
        "radar": 12,
        "visual": 8,
        "inspection": 0.5
      },
      "waypoints": [
        {
          "lat": 53.618376,
          "lon": 4.85527,
          "label": "WP1"
        }
      ]
    },
    {
      "id": "asset-6",
      "name": "MV Island Star",
      "type": "passenger_ferry",
      "affiliation": "suspect",
      "representation": "track",
      "status": "available",
      "zone": "",
      "fuel": 10,
      "readiness": 4,
      "assignedCell": "",
      "lat": 53.334973,
      "lon": 4.484482,
      "heading": 352.2,
      "speed": 15,
      "trackQuality": "q2",
      "sensorProfile": {
        "radar": 12,
        "visual": 8,
        "inspection": 0.5
      },
      "waypoints": [
        {
          "lat": 53.254328,
          "lon": 4.463196,
          "label": "WP1"
        },
        {
          "lat": 53.168797,
          "lon": 4.408264,
          "label": "WP2"
        },
        {
          "lat": 53.139563,
          "lon": 4.347153,
          "label": "WP3"
        }
      ]
    },
    {
      "id": "asset-7",
      "name": "FV North Net",
      "type": "fishing_vessel",
      "affiliation": "neutral",
      "representation": "track",
      "status": "available",
      "zone": "",
      "fuel": 10,
      "readiness": 4,
      "assignedCell": "",
      "lat": 53.626724,
      "lon": 5.204773,
      "heading": 101.4,
      "speed": 13.6,
      "trackQuality": "q3",
      "sensorProfile": {
        "radar": 10,
        "visual": 6,
        "inspection": 0.4
      },
      "waypoints": [
        {
          "lat": 53.569472,
          "lon": 5.042725,
          "label": "WP1"
        }
      ]
    },
    {
      "id": "asset-8",
      "name": "TB Harbor Hand",
      "type": "tug_workboat",
      "affiliation": "neutral",
      "representation": "unit",
      "status": "available",
      "zone": "",
      "fuel": 10,
      "readiness": 4,
      "assignedCell": "",
      "lat": 53.4717,
      "lon": 4.905396,
      "heading": 98,
      "speed": 14.7,
      "trackQuality": "q2",
      "sensorProfile": {
        "radar": 10,
        "visual": 6,
        "inspection": 0.3
      },
      "waypoints": [
        {
          "lat": 53.497237,
          "lon": 5.065384,
          "label": "WP1"
        }
      ]
    },
    {
      "id": "asset-9",
      "name": "DV Channel Maker",
      "type": "dredger",
      "affiliation": "suspect",
      "representation": "track",
      "status": "available",
      "zone": "",
      "fuel": 10,
      "readiness": 4,
      "assignedCell": "",
      "lat": 53.797406,
      "lon": 4.729614,
      "heading": 276.9,
      "speed": 13.3,
      "trackQuality": "q4",
      "sensorProfile": {
        "radar": 10,
        "visual": 6,
        "inspection": 0.3
      },
      "waypoints": []
    },
    {
      "id": "asset-10",
      "name": "PB Pilot One",
      "type": "pilot_boat",
      "affiliation": "unknown",
      "representation": "unit",
      "status": "available",
      "zone": "",
      "fuel": 10,
      "readiness": 4,
      "assignedCell": "",
      "lat": 53.25289,
      "lon": 4.557953,
      "heading": 321.8,
      "speed": 13.8,
      "trackQuality": "q4",
      "sensorProfile": {
        "radar": 10,
        "visual": 6,
        "inspection": 0.3
      },
      "waypoints": [
        {
          "lat": 53.311391,
          "lon": 4.639664,
          "label": "WP1"
        }
      ]
    },
    {
      "id": "asset-11",
      "name": "RV Ocean Quest",
      "type": "research_survey_vessel",
      "affiliation": "neutral",
      "representation": "unit",
      "status": "available",
      "zone": "",
      "fuel": 10,
      "readiness": 4,
      "assignedCell": "",
      "lat": 53.399707,
      "lon": 4.671936,
      "heading": 151.4,
      "speed": 14.7,
      "trackQuality": "q3",
      "sensorProfile": {
        "radar": 12,
        "visual": 7,
        "inspection": 0.4
      },
      "waypoints": [
        {
          "lat": 53.426515,
          "lon": 4.829865,
          "label": "WP1"
        }
      ]
    },
    {
      "id": "asset-12",
      "name": "MV Atlas",
      "type": "container_ship",
      "affiliation": "neutral",
      "representation": "track",
      "status": "available",
      "zone": "",
      "fuel": 10,
      "readiness": 4,
      "assignedCell": "",
      "lat": 53.517451,
      "lon": 5.166321,
      "heading": 138.9,
      "speed": 10.3,
      "trackQuality": "q4",
      "sensorProfile": {
        "radar": 12,
        "visual": 8,
        "inspection": 0.5
      },
      "waypoints": [
        {
          "lat": 53.539695,
          "lon": 5.281677,
          "label": "WP1"
        }
      ]
    },
    {
      "id": "asset-13",
      "name": "Patrol Vessel",
      "type": "patrol_vessel",
      "affiliation": "friend",
      "representation": "unit",
      "status": "available",
      "zone": "",
      "fuel": 10,
      "readiness": 5,
      "assignedCell": "blue-maritime",
      "lat": 53.161594,
      "lon": 4.492035,
      "heading": 90,
      "speed": 12,
      "trackQuality": "q2",
      "sensorProfile": {
        "radar": 14,
        "visual": 8,
        "inspection": 0.5
      },
      "waypoints": [
        {
          "lat": 53.306673,
          "lon": 4.647217,
          "label": "WP1"
        },
        {
          "lat": 53.418126,
          "lon": 4.785919,
          "label": "WP2"
        },
        {
          "lat": 53.491722,
          "lon": 5.07431,
          "label": "WP3"
        },
        {
          "lat": 53.58313,
          "lon": 5.539856,
          "label": "WP4"
        },
        {
          "lat": 53.658068,
          "lon": 5.870819,
          "label": "WP5"
        }
      ]
    }
  ],
  "incidents": [],
  "releasedInjects": [],
  "selectedActions": {},
  "playerFeedByCell": {
    "blue-maritime": [],
    "blue-port": []
  },
  "actionLogByCell": {
    "blue-maritime": [],
    "blue-port": []
  },
  "timeline": [],
  "inspections": [],
  "boardingRequests": [],
  "ui": {
    "assetFilters": {
      "affiliations": [
        "friend",
        "assumed_friend",
        "neutral",
        "hostile",
        "suspect",
        "unknown"
      ],
      "representations": [
        "unit",
        "track"
      ],
      "scope": "all"
    }
  }
};

let state = loadState();
let injectLibrary = [];
let templates = {};
let map, playerMap, seaLayer, playerSeaLayer;
let zoneLayers = [], assetLayers = [], zoneCenterLayers = [], waypointGuideLayers = [];
let playerZoneLayers = [], playerAssetLayers = [];
let lastHoveredLatLng = null;
let playerMapMode = 'select';
let playerSelectedAssetId = '';
let playerSelectedContactId = '';
let playerLastHoveredLatLng = null;
let facilitatorMeasure = { active: false, start: null, end: null, line: null, tooltip: null };
let playerMeasure = { active: false, start: null, end: null, line: null, tooltip: null };

const ASSET_TYPE_OPTIONS = [
  { value: 'frigate', label: 'Frigate' },
  { value: 'corvette', label: 'Corvette' },
  { value: 'destroyer', label: 'Destroyer' },
  { value: 'cruiser', label: 'Cruiser' },
  { value: 'air_defence_destroyer', label: 'Air Defence Destroyer' },
  { value: 'air_defence_frigate', label: 'Air Defence Frigate' },
  { value: 'patrol_vessel', label: 'Patrol Vessel' },
  { value: 'attack_submarine', label: 'Attack Submarine' },
  { value: 'ballistic_missile_submarine', label: 'Ballistic Missile Submarine' },
  { value: 'submarine', label: 'Submarine' },
  { value: 'aircraft_carrier', label: 'Aircraft Carrier' },
  { value: 'amphibious_assault_ship', label: 'Amphibious Assault Ship' },
  { value: 'amphibious_ship', label: 'Amphibious Ship' },
  { value: 'landing_craft', label: 'Landing Craft' },
  { value: 'auxiliary_ship', label: 'Auxiliary Ship' },
  { value: 'replenishment_ship', label: 'Replenishment Ship' },
  { value: 'intelligence_ship', label: 'Intelligence / AGI Ship' },
  { value: 'mine_warfare_vessel', label: 'Mine Warfare Vessel' },
  { value: 'maritime_helicopter', label: 'Maritime Helicopter' },
  { value: 'isr_drone', label: 'ISR Drone' },
  { value: 'boarding_team', label: 'Boarding Team' },
  { value: 'port_support_unit', label: 'Port Support Unit' },
  { value: 'command_element', label: 'Command Element' },
  { value: 'arleigh_burke_ddg', label: 'Arleigh Burke-class DDG (NATO)' },
  { value: 'type_45_ddg', label: 'Type 45 Destroyer (NATO)' },
  { value: 'de_zeven_provincien_lcf', label: 'De Zeven Provinciën-class LCF (NATO)' },
  { value: 'fremm_frigate', label: 'FREMM Frigate (NATO)' },
  { value: 'holland_opv', label: 'Holland-class OPV (NATO)' },
  { value: 'queen_elizabeth_carrier', label: 'Queen Elizabeth-class Carrier (NATO)' },
  { value: 'admiral_gorshkov_frigate', label: 'Admiral Gorshkov-class Frigate (Russia)' },
  { value: 'admiral_grigorovich_frigate', label: 'Admiral Grigorovich-class Frigate (Russia)' },
  { value: 'project_636_submarine', label: 'Project 636.3 Kilo SS (Russia)' },
  { value: 'slava_cruiser', label: 'Slava-class Cruiser (Russia)' },
  { value: 'type_052d_destroyer', label: 'Type 052D Destroyer (China)' },
  { value: 'type_055_destroyer', label: 'Type 055 Large Destroyer (China)' },
  { value: 'type_054a_frigate', label: 'Type 054A Frigate (China)' },
  { value: 'type_071_amphib', label: 'Type 071 Amphibious Transport Dock (China)' },
  { value: 'type_075_lhd', label: 'Type 075 LHD (China)' },
  { value: 'container_ship', label: 'Container Ship' },
  { value: 'bulk_carrier', label: 'Bulk Carrier' },
  { value: 'tanker', label: 'Tanker' },
  { value: 'lng_carrier', label: 'LNG Carrier' },
  { value: 'ro_ro_ferry', label: 'Ro-Ro Ferry' },
  { value: 'passenger_ferry', label: 'Passenger Ferry' },
  { value: 'fishing_vessel', label: 'Fishing Vessel' },
  { value: 'tug_workboat', label: 'Tug / Workboat' },
  { value: 'dredger', label: 'Dredger' },
  { value: 'pilot_boat', label: 'Pilot Boat' },
  { value: 'research_survey_vessel', label: 'Research / Survey Vessel' }
];

const ASSET_AFFILIATION_OPTIONS = [
  { value: 'friend', label: 'Friendly' },
  { value: 'assumed_friend', label: 'Assumed Friendly' },
  { value: 'neutral', label: 'Neutral' },
  { value: 'hostile', label: 'Hostile' },
  { value: 'suspect', label: 'Suspect' },
  { value: 'unknown', label: 'Unknown' }
];

const ASSET_REPRESENTATION_OPTIONS = [
  { value: 'unit', label: 'Confirmed Unit' },
  { value: 'track', label: 'Track' }
];

const TRACK_QUALITY_OPTIONS = [
  { value: 'q1', label: 'Q1 - High confidence' },
  { value: 'q2', label: 'Q2 - Good confidence' },
  { value: 'q3', label: 'Q3 - Fair confidence' },
  { value: 'q4', label: 'Q4 - Poor confidence' },
  { value: 'q5', label: 'Q5 - Fragmentary / weak' }
];

const COMMERCIAL_ASSET_TYPES = [
  'container_ship', 'bulk_carrier', 'tanker', 'lng_carrier', 'ro_ro_ferry', 'passenger_ferry',
  'fishing_vessel', 'tug_workboat', 'dredger', 'pilot_boat', 'research_survey_vessel'
];

const COMMERCIAL_NAME_PARTS = {
  container_ship: { prefix: 'MV', nouns: ['Mercury', 'Atlas', 'Mariner', 'Horizon', 'Northstar', 'Venturer'] },
  bulk_carrier: { prefix: 'MV', nouns: ['Iron Crest', 'Blue Ore', 'Harbor Stone', 'Baltic Grain', 'Ocean Bulk'] },
  tanker: { prefix: 'MT', nouns: ['Sea Spirit', 'Silver Current', 'Ocean Pioneer', 'North Fuel', 'Blue Terminal'] },
  lng_carrier: { prefix: 'LNG', nouns: ['Arctic Flow', 'Gas Meridian', 'Polar Flame', 'Blue Vapor'] },
  ro_ro_ferry: { prefix: 'MV', nouns: ['Channel Runner', 'Sea Lift', 'Roadbridge', 'Harbor Link'] },
  passenger_ferry: { prefix: 'MV', nouns: ['Island Star', 'Sea Bridge', 'Coastal Wave', 'Port Express'] },
  fishing_vessel: { prefix: 'FV', nouns: ['North Net', 'Silver Herring', 'Deep Line', 'Morning Catch'] },
  tug_workboat: { prefix: 'TB', nouns: ['Harbor Hand', 'Dock Assist', 'Mooring One', 'Towline'] },
  dredger: { prefix: 'DV', nouns: ['Channel Maker', 'Delta Sand', 'Harbor Cut', 'Deep Cutter'] },
  pilot_boat: { prefix: 'PB', nouns: ['Pilot One', 'Harbor Pilot', 'Channel Guide', 'Approach Lead'] },
  research_survey_vessel: { prefix: 'RV', nouns: ['Ocean Quest', 'Surveyor', 'Sea Vector', 'Blue Datum'] }
};

const NAVAL_CLASS_LIBRARY = [
  {
    value: 'arleigh_burke_ddg', label: 'USS Arleigh Burke / DDG-51 family', baseType: 'destroyer', faction: 'NATO', roleTags: ['AAW', 'BMD', 'ASW', 'Surface Action'], affiliation: 'friend', assignedCell: 'blue-maritime', speed: 18, readiness: 96, fuel: 100, fuelCapacity: 14, heading: 90,
    sensorProfile: { radar: 24, visual: 10, inspection: 0.8, ew: 18 }, notes: 'Multi-mission AEGIS destroyer with strong area-air and BMD profile.'
  },
  {
    value: 'type_45_ddg', label: 'HMS Daring / Type 45', baseType: 'air_defence_destroyer', faction: 'NATO', roleTags: ['AAW', 'Area Air Defence', 'Escort'], affiliation: 'friend', assignedCell: 'blue-maritime', speed: 17, readiness: 94, fuel: 100, fuelCapacity: 14, heading: 90,
    sensorProfile: { radar: 25, visual: 10, inspection: 0.7, ew: 16 }, notes: 'Area-air-defence escort with long-range radar picture.'
  },
  {
    value: 'de_zeven_provincien_lcf', label: 'De Zeven Provinciën LCF', baseType: 'air_defence_frigate', faction: 'NATO', roleTags: ['AAW', 'Command', 'Escort'], affiliation: 'friend', assignedCell: 'blue-maritime', speed: 16, readiness: 93, fuel: 100, fuelCapacity: 14, heading: 90,
    sensorProfile: { radar: 23, visual: 10, inspection: 0.7, ew: 16 }, notes: 'Dutch command-capable air-defence frigate.'
  },
  {
    value: 'fremm_frigate', label: 'FREMM frigate', baseType: 'frigate', faction: 'NATO', roleTags: ['ASW', 'General Purpose', 'Escort'], affiliation: 'friend', assignedCell: 'blue-maritime', speed: 16, readiness: 90, fuel: 100, fuelCapacity: 13, heading: 90,
    sensorProfile: { radar: 20, visual: 10, inspection: 0.7, ew: 14 }, notes: 'Balanced multi-role frigate with strong ASW profile.'
  },
  {
    value: 'holland_opv', label: 'Holland OPV', baseType: 'patrol_vessel', faction: 'NATO', roleTags: ['Patrol', 'Maritime Security', 'Presence'], affiliation: 'friend', assignedCell: 'blue-maritime', speed: 14, readiness: 88, fuel: 100, fuelCapacity: 12, heading: 90,
    sensorProfile: { radar: 16, visual: 11, inspection: 0.9, ew: 8 }, notes: 'Low-intensity patrol and maritime security platform.'
  },
  {
    value: 'queen_elizabeth_carrier', label: 'Queen Elizabeth carrier', baseType: 'aircraft_carrier', faction: 'NATO', roleTags: ['Carrier', 'Air Power', 'Command'], affiliation: 'friend', assignedCell: 'blue-maritime', speed: 16, readiness: 95, fuel: 100, fuelCapacity: 18, heading: 90,
    sensorProfile: { radar: 22, visual: 11, inspection: 0.6, ew: 18 }, notes: 'High-value aviation command platform.'
  },
  {
    value: 'admiral_gorshkov_frigate', label: 'Admiral Gorshkov frigate', baseType: 'frigate', faction: 'Russia', roleTags: ['Strike', 'Escort', 'ASuW'], affiliation: 'hostile', assignedCell: '', speed: 16, readiness: 84, fuel: 100, fuelCapacity: 13, heading: 270,
    sensorProfile: { radar: 20, visual: 10, inspection: 0.6, ew: 13 }, notes: 'Modern Russian frigate with credible strike profile.'
  },
  {
    value: 'admiral_grigorovich_frigate', label: 'Admiral Grigorovich frigate', baseType: 'frigate', faction: 'Russia', roleTags: ['General Purpose', 'Escort'], affiliation: 'hostile', assignedCell: '', speed: 15, readiness: 82, fuel: 100, fuelCapacity: 12, heading: 270,
    sensorProfile: { radar: 18, visual: 10, inspection: 0.6, ew: 12 }, notes: 'General-purpose Russian frigate.'
  },
  {
    value: 'project_636_submarine', label: 'Project 636.3 Kilo submarine', baseType: 'attack_submarine', faction: 'Russia', roleTags: ['Subsurface', 'Ambush', 'ASuW'], affiliation: 'hostile', assignedCell: '', speed: 10, readiness: 80, fuel: 100, fuelCapacity: 12, heading: 270,
    sensorProfile: { radar: 6, visual: 5, inspection: 0.2, ew: 6 }, notes: 'Diesel-electric submarine with low-signature ambush role.'
  },
  {
    value: 'slava_cruiser', label: 'Slava-class cruiser', baseType: 'cruiser', faction: 'Russia', roleTags: ['Strike', 'Command', 'Area Air Defence'], affiliation: 'hostile', assignedCell: '', speed: 15, readiness: 72, fuel: 100, fuelCapacity: 15, heading: 270,
    sensorProfile: { radar: 22, visual: 10, inspection: 0.5, ew: 14 }, notes: 'Legacy but still high-signature command / strike cruiser.'
  },
  {
    value: 'type_052d_destroyer', label: 'Type 052D destroyer', baseType: 'destroyer', faction: 'China', roleTags: ['AAW', 'ASuW', 'Escort'], affiliation: 'hostile', assignedCell: '', speed: 17, readiness: 88, fuel: 100, fuelCapacity: 14, heading: 110,
    sensorProfile: { radar: 22, visual: 10, inspection: 0.6, ew: 14 }, notes: 'Modern PLA Navy destroyer with balanced escort profile.'
  },
  {
    value: 'type_055_destroyer', label: 'Type 055 large destroyer', baseType: 'cruiser', faction: 'China', roleTags: ['Command', 'Area Air Defence', 'Strike'], affiliation: 'hostile', assignedCell: '', speed: 17, readiness: 92, fuel: 100, fuelCapacity: 15, heading: 110,
    sensorProfile: { radar: 24, visual: 10, inspection: 0.6, ew: 16 }, notes: 'Large multi-role combatant with command potential.'
  },
  {
    value: 'type_054a_frigate', label: 'Type 054A frigate', baseType: 'frigate', faction: 'China', roleTags: ['General Purpose', 'Escort', 'ASW'], affiliation: 'hostile', assignedCell: '', speed: 15, readiness: 87, fuel: 100, fuelCapacity: 13, heading: 110,
    sensorProfile: { radar: 18, visual: 10, inspection: 0.6, ew: 12 }, notes: 'Workhorse PLA Navy escort frigate.'
  },
  {
    value: 'type_071_amphib', label: 'Type 071 amphibious transport dock', baseType: 'amphibious_ship', faction: 'China', roleTags: ['Amphibious', 'Sealift', 'Command Support'], affiliation: 'hostile', assignedCell: '', speed: 14, readiness: 85, fuel: 100, fuelCapacity: 15, heading: 110,
    sensorProfile: { radar: 14, visual: 10, inspection: 0.7, ew: 10 }, notes: 'Amphibious transport dock for lift and command support.'
  },
  {
    value: 'type_075_lhd', label: 'Type 075 LHD', baseType: 'amphibious_assault_ship', faction: 'China', roleTags: ['Amphibious Assault', 'Aviation', 'Command'], affiliation: 'hostile', assignedCell: '', speed: 14, readiness: 89, fuel: 100, fuelCapacity: 16, heading: 110,
    sensorProfile: { radar: 18, visual: 10, inspection: 0.7, ew: 12 }, notes: 'Aviation-capable amphibious assault ship.'
  }
];

const NAVAL_CLASS_LIBRARY_BY_KEY = Object.fromEntries(NAVAL_CLASS_LIBRARY.map(item => [item.value, item]));

function clone(o) { return JSON.parse(JSON.stringify(o)); }
function escapeHtml(value) { return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function randomWithin(min, max) {
  const a = Number(min);
  const b = Number(max);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return 0;
  const low = Math.min(a, b);
  const high = Math.max(a, b);
  return low + Math.random() * (high - low);
}

function clampPercent(value, fallback = 100) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, Math.min(100, Number(n.toFixed(1))));
}
function modernPresetForType(type) {
  return NAVAL_CLASS_LIBRARY_BY_KEY[normalizeAssetType(type)] || null;
}
function roleTagsForAsset(asset) {
  return Array.isArray(asset?.roleTags) && asset.roleTags.length ? asset.roleTags : (modernPresetForType(asset?.type)?.roleTags || []);
}
function fuelCapacityForAsset(asset) {
  const preset = modernPresetForType(asset?.type);
  const own = Number(asset?.fuelCapacity);
  if (Number.isFinite(own) && own > 0) return own;
  if (preset?.fuelCapacity) return preset.fuelCapacity;
  return defaultFuelCapacityForAssetType(asset?.type);
}
function fuelPercentLabel(asset) {
  return `${clampPercent(asset?.fuel, 100).toFixed(0)}%`;
}
function readinessPercentLabel(asset) {
  return `${clampPercent(asset?.readiness, 100).toFixed(0)}%`;
}
function fuelTagClass(asset) {
  return clampPercent(asset?.fuel, 100) < 20 ? 'tag tag-critical' : 'tag';
}
function readinessTagClass(asset) {
  return clampPercent(asset?.readiness, 100) < 50 ? 'tag tag-critical' : 'tag';
}
function operationalSystemsSummary(asset) {
  const readiness = clampPercent(asset?.readiness, 100);
  const profile = sensorProfileForAsset(asset);
  const working = ['Navigation', 'Engineering', 'Communications'];
  const limited = [];
  const offline = [];
  if ((profile.radar || 0) > 0) {
    if (readiness >= 55) working.push('Radar');
    else if (readiness >= 35) limited.push('Radar');
    else offline.push('Radar');
  }
  if ((profile.visual || 0) > 0) working.push('Visual watch');
  if ((profile.ew || 0) > 0) {
    if (readiness >= 65) working.push('EW');
    else if (readiness >= 45) limited.push('EW');
    else offline.push('EW');
  }
  if ((profile.inspection || 0) > 0) {
    if (readiness >= 70) working.push('Boarding team');
    else if (readiness >= 45) limited.push('Boarding team');
    else offline.push('Boarding team');
  }
  if (readiness < 70) limited.push('Damage control');
  if (readiness < 40) offline.push('Flight ops');
  const uniq = arr => [...new Set(arr.filter(Boolean))];
  return { working: uniq(working), limited: uniq(limited), offline: uniq(offline) };
}
function assetStatusReportLine(asset) {
  const systems = operationalSystemsSummary(asset);
  const segments = [
    `<strong>${escapeHtml(asset.name || 'Asset')}</strong> (${escapeHtml(assetTypeLabel(asset.type))})`,
    `status ${escapeHtml(asset.status || 'available')}`,
    `fuel ${fuelPercentLabel(asset)}`,
    `readiness ${readinessPercentLabel(asset)}`,
    `heading ${normalizeHeading(asset.heading)}°`,
    `speed ${normalizeSpeed(asset.speed)} kt`
  ];
  const details = [];
  if (systems.working.length) details.push(`working: ${escapeHtml(systems.working.join(', '))}`);
  if (systems.limited.length) details.push(`limited: ${escapeHtml(systems.limited.join(', '))}`);
  if (systems.offline.length) details.push(`offline: ${escapeHtml(systems.offline.join(', '))}`);
  return `${segments.join(' · ')}${details.length ? ' · ' + details.join(' · ') : ''}`;
}
function pushStatusUpdateToCell(cellId, label = 'Status update', options = {}) {
  const cell = state.session.cells.find(c => c.id === cellId);
  if (!cell) return;
  ensureSessionMaps();
  const time = state.scenario.timeLabel || 'H+0';
  const assets = state.assets.filter(a => a.assignedCell === cellId);
  const header = `${label} for ${cell.name}`;
  const body = assets.length ? assets.map(assetStatusReportLine).join('<br>') : 'No assigned assets available for this cell at this time.';
  state.playerFeedByCell[cellId].push({ time, text: `${header}<br>${body}` });
  if (options.logTimeline !== false) state.timeline.push({ time, text: `${label} sent to ${cell.name}.` });
}
function maybeQueueInitialStatusUpdate(cellId) {
  if (!cellId) return;
  ensureSessionMaps();
  if (state.session.initialStatusSentByCell[cellId]) return;
  pushStatusUpdateToCell(cellId, 'Initial status update', { logTimeline: false });
  state.session.initialStatusSentByCell[cellId] = true;
}
function maybeSendRoutineStatusUpdates(previousLabel, currentLabel) {
  ensureSessionMaps();
  const interval = Math.max(1, Math.min(24, Number(state.scenario.statusUpdateIntervalHours || 6) || 6));
  const prevHours = timeLabelToHours(previousLabel);
  const currentHours = timeLabelToHours(currentLabel);
  state.session.cells.forEach(cell => {
    const currentBucket = Math.floor(currentHours / interval);
    const prevBucket = Number.isFinite(prevHours) ? Math.floor(prevHours / interval) : -1;
    const lastSentBucket = Number(state.session.lastRoutineStatusBucketByCell[cell.id]);
    const baselineBucket = Number.isFinite(lastSentBucket) ? lastSentBucket : prevBucket;
    if (currentHours > 0 && currentBucket > baselineBucket) {
      pushStatusUpdateToCell(cell.id, `Routine status update (${interval}h)`);
      state.session.lastRoutineStatusBucketByCell[cell.id] = currentBucket;
    }
  });
}
function sensorProfileForAsset(asset) {
  const preset = modernPresetForType(asset?.type);
  const base = preset?.sensorProfile || defaultSensorProfileForAssetType(asset?.type);
  return Object.assign({}, base, asset?.sensorProfile || {});
}
function normalizeLegacyFuelToPercent(value, type, existingCapacity) {
  const capacity = Number(existingCapacity) > 0 ? Number(existingCapacity) : defaultFuelCapacityForAssetType(type);
  const raw = Number(value);
  if (!Number.isFinite(raw)) return 100;
  if (raw <= 20) return clampPercent((raw / Math.max(1, capacity)) * 100, 100);
  return clampPercent(raw, 100);
}
function normalizeLegacyReadinessToPercent(value) {
  const raw = Number(value);
  if (!Number.isFinite(raw)) return 100;
  if (raw <= 5) return clampPercent((raw / 5) * 100, 100);
  return clampPercent(raw, 100);
}
function assetProfileSummary(asset) {
  const preset = modernPresetForType(asset?.type);
  const sensor = sensorProfileForAsset(asset);
  const tags = roleTagsForAsset(asset);
  return {
    faction: asset?.faction || preset?.faction || (normalizeAssetAffiliation(asset?.affiliation) === 'hostile' ? 'Red / Opposed' : 'Blue / Friendly'),
    roleTags: tags,
    notes: asset?.classNotes || preset?.notes || '',
    sensor,
    fuelCapacity: fuelCapacityForAsset(asset)
  };
}
function renderModernAssetLibraryInfo() {
  const select = document.getElementById('modernAssetLibrarySelect');
  const panel = document.getElementById('modernAssetLibraryInfo');
  if (!select || !panel) return;
  if (!select.options.length) {
    select.innerHTML = NAVAL_CLASS_LIBRARY.map(item => `<option value="${item.value}">${item.label}</option>`).join('');
  }
  const preset = NAVAL_CLASS_LIBRARY_BY_KEY[select.value] || NAVAL_CLASS_LIBRARY[0];
  if (!preset) { panel.innerHTML = ''; return; }
  const tags = (preset.roleTags || []).map(tag => `<span class="tag">${tag}</span>`).join(' ');
  panel.innerHTML = `
    <div class="card" style="margin-top:8px">
      <strong>${preset.label}</strong>
      <div class="row" style="margin-top:6px">
        <span class="tag">${preset.faction}</span>
        <span class="tag">${assetTypeLabel(preset.baseType)}</span>
        <span class="tag">Default affiliation: ${assetAffiliationLabel(preset.affiliation)}</span>
        <span class="tag">Fuel 100% = ${preset.fuelCapacity} endurance units</span>
        <span class="tag">Readiness ${preset.readiness}%</span>
      </div>
      <div class="row" style="margin-top:6px">${tags}</div>
      <div class="small" style="margin-top:8px">Sensors: radar ${preset.sensorProfile.radar} nm · visual ${preset.sensorProfile.visual} nm · EW ${preset.sensorProfile.ew} · boarding / inspection ${preset.sensorProfile.inspection}</div>
      <div class="small" style="margin-top:6px">${preset.notes}</div>
    </div>`;
}
function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return clone(DEFAULT_STATE);
  try {
    return migrateState(JSON.parse(raw));
  } catch (e) {
    return clone(DEFAULT_STATE);
  }
}
function saveState() {
  state.meta = Object.assign({}, state.meta, { syncToken: Date.now() });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  lastKnownSyncToken = state.meta?.syncToken || lastKnownSyncToken;
  if (stateChannel) {
    try { stateChannel.postMessage({ type: 'state-updated', ts: Date.now() }); } catch (_) {}
  }
}
function migrateState(pkg) {
  const merged = Object.assign(clone(DEFAULT_STATE), pkg || {});
  merged.version = 17;
  merged.scenario = Object.assign(clone(DEFAULT_STATE.scenario), pkg?.scenario || {});
  merged.scenario.statusUpdateIntervalHours = Math.max(1, Math.min(24, Number(merged.scenario.statusUpdateIntervalHours || 6) || 6));
  merged.zones = pkg?.zones || {};
  merged.assets = Array.isArray(pkg?.assets) ? pkg.assets : [];
  merged.selectedZoneId = merged.selectedZoneId && merged.zones[merged.selectedZoneId] ? merged.selectedZoneId : (Object.keys(merged.zones)[0] || '');
  merged.selectedAssetId = merged.selectedAssetId && merged.assets.find(a => a.id === merged.selectedAssetId) ? merged.selectedAssetId : (merged.assets[0]?.id || '');
  merged.mapMode = merged.mapMode || 'select';
  ensureSessionMaps(merged);
  merged.session.initialStatusSentByCell = merged.session.initialStatusSentByCell || {};
  merged.session.lastRoutineStatusBucketByCell = merged.session.lastRoutineStatusBucketByCell || {};
  merged.scenario.rememberLastMapView = merged.scenario.rememberLastMapView !== false;
  merged.scenario.lastMapView = normalizeMapView(merged.scenario.lastMapView) || { center: [54.8, 7.55], zoom: 8 };
  merged.scenario.pinnedMapView = normalizeMapView(merged.scenario.pinnedMapView);
  Object.entries(merged.zones).forEach(([id, z]) => {
    merged.zones[id] = Object.assign({ name: id, center: [54.8, 7.55], radius: 12000, kind: 'sea' }, z);
  });
  merged.assets = merged.assets.map(a => {
    const normalizedType = normalizeAssetType(a?.type);
    const preset = modernPresetForType(normalizedType);
    const capacity = Number(a?.fuelCapacity) > 0 ? Number(a.fuelCapacity) : (preset?.fuelCapacity || defaultFuelCapacityForAssetType(normalizedType));
    const roleTags = Array.isArray(a?.roleTags) && a.roleTags.length ? a.roleTags : (preset?.roleTags || []);
    return Object.assign({
      id: `asset-${Math.random().toString(36).slice(2, 8)}`,
      name: 'New Asset',
      type: 'patrol_vessel',
      affiliation: 'friend',
      representation: 'unit',
      status: 'available',
      zone: '',
      fuel: 100,
      fuelCapacity: capacity,
      readiness: 100,
      assignedCell: merged.session.cells[0]?.id || '',
      lat: null,
      lon: null,
      heading: 90,
      speed: 12,
      trackQuality: 'q2',
      roleTags,
      faction: preset?.faction || '',
      classNotes: preset?.notes || '',
      sensorProfile: clone(preset?.sensorProfile || defaultSensorProfileForAssetType(normalizedType))
    }, a, {
      type: normalizedType,
      affiliation: normalizeAssetAffiliation(a?.affiliation),
      representation: normalizeAssetRepresentation(a?.representation || a?.classification),
      trackQuality: normalizeTrackQuality(a?.trackQuality),
      lat: normalizeCoord(a?.lat),
      lon: normalizeCoord(a?.lon),
      heading: normalizeHeading(a?.heading),
      speed: normalizeSpeed(a?.speed),
      fuelCapacity: capacity,
      fuel: normalizeLegacyFuelToPercent(a?.fuel, normalizedType, capacity),
      readiness: normalizeLegacyReadinessToPercent(a?.readiness),
      roleTags,
      faction: a?.faction || preset?.faction || '',
      classNotes: a?.classNotes || preset?.notes || '',
      sensorProfile: Object.assign({}, preset?.sensorProfile || defaultSensorProfileForAssetType(normalizedType), a?.sensorProfile || {})
    });
  });
  merged.boardingRequests = Array.isArray(pkg?.boardingRequests) ? pkg.boardingRequests.map(r => Object.assign({ status: 'pending', facilitatorModifier: 0, envDifficulty: 'moderate', rationale: '', adjudication: null }, r || {})) : [];
  merged.turnHistory = Array.isArray(pkg?.turnHistory) ? pkg.turnHistory : [];
  merged.turnFuture = Array.isArray(pkg?.turnFuture) ? pkg.turnFuture : [];
  return merged;
}
function ensureSessionMaps(targetState = state) {
  targetState.session = targetState.session || { cells: [] };
  targetState.session.cells = Array.isArray(targetState.session.cells) && targetState.session.cells.length ? targetState.session.cells : clone(DEFAULT_STATE.session.cells);
  targetState.session.cellLocks = targetState.session.cellLocks || {};
  targetState.playerFeedByCell = targetState.playerFeedByCell || {};
  targetState.actionLogByCell = targetState.actionLogByCell || {};
  targetState.session.cells.forEach(c => {
    if (!targetState.playerFeedByCell[c.id]) targetState.playerFeedByCell[c.id] = [];
    if (!targetState.actionLogByCell[c.id]) targetState.actionLogByCell[c.id] = [];
  });
  ensureCellLocations();
}
function getPlayerInstanceId() {
  try {
    let id = sessionStorage.getItem(PLAYER_INSTANCE_KEY);
    if (!id) {
      id = `player-${Math.random().toString(36).slice(2,10)}`;
      sessionStorage.setItem(PLAYER_INSTANCE_KEY, id);
    }
    return id;
  } catch (_) {
    return 'player-single';
  }
}
function getStoredPlayerClaim() {
  try { return sessionStorage.getItem(PLAYER_CLAIM_KEY) || ''; } catch (_) { return ''; }
}
function setStoredPlayerClaim(cellId) {
  try {
    if (cellId) sessionStorage.setItem(PLAYER_CLAIM_KEY, cellId);
    else sessionStorage.removeItem(PLAYER_CLAIM_KEY);
  } catch (_) {}
}
function cellLockFor(cellId) {
  return state.session?.cellLocks?.[cellId] || null;
}
function isCellClaimedByCurrentPlayer(cellId) {
  const lock = cellLockFor(cellId);
  return !!lock && lock.ownerId === getPlayerInstanceId();
}
function canClaimCell(cellId) {
  const lock = cellLockFor(cellId);
  return !lock || lock.ownerId === getPlayerInstanceId();
}
function claimPlayerCell(cellId) {
  if (!cellId) return false;
  ensureSessionMaps();
  const existing = getStoredPlayerClaim();
  if (existing && existing !== cellId) return false;
  if (!canClaimCell(cellId)) return false;
  state.session.cellLocks[cellId] = { ownerId: getPlayerInstanceId(), claimedAt: new Date().toISOString() };
  setStoredPlayerClaim(cellId);
  maybeQueueInitialStatusUpdate(cellId);
  saveState();
  return true;
}
function syncPlayerClaimFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const requested = params.get('cell') || '';
  if (!getStoredPlayerClaim() && requested && canClaimCell(requested)) claimPlayerCell(requested);
}
function defaultCellPosition(idx) {
  const anchor = state?.scenario?.pinnedMapView?.center || state?.scenario?.lastMapView?.center || [54.8, 7.2];
  return [Number((anchor[0] + ((idx % 3) * 0.08)).toFixed(6)), Number((anchor[1] + ((Math.floor(idx / 3)) * 0.12)).toFixed(6))];
}

function ensureCellLocations() {
  state.session = state.session || { cells: [] };
  state.session.cells = Array.isArray(state.session.cells) ? state.session.cells : [];
  state.session.cells.forEach((c, idx) => {
    if (!Number.isFinite(Number(c.lat)) || !Number.isFinite(Number(c.lon))) {
      const pos = defaultCellPosition(idx);
      c.lat = pos[0];
      c.lon = pos[1];
    } else {
      c.lat = Number(Number(c.lat).toFixed(6));
      c.lon = Number(Number(c.lon).toFixed(6));
    }
  });
}

function getPlayerCell() {
  const claimed = getStoredPlayerClaim();
  if (claimed) return claimed;
  const params = new URLSearchParams(window.location.search);
  const requested = params.get('cell') || '';
  if (requested && canClaimCell(requested)) return requested;
  return document.getElementById('playerCellSelect')?.value || '';
}
function updatePlayerNavLinks() {
  const cellId = getPlayerCell();
  const suffix = cellId ? `?cell=${encodeURIComponent(cellId)}` : '';
  const scenarioLink = document.getElementById('playerScenarioNavLink');
  const opsLink = document.getElementById('playerOpsNavLink');
  const mapLink = document.getElementById('playerMapNavLink');
  if (scenarioLink) scenarioLink.href = `./player-scenario.html${suffix}`;
  if (opsLink) opsLink.href = `./player-ops.html${suffix}`;
  if (mapLink) mapLink.href = `./player.html${suffix}`;
}
function renderPlayerCellSelector() {
  const sel = document.getElementById('playerCellSelect');
  if (!sel) return;
  const claimed = getStoredPlayerClaim();
  const requested = new URLSearchParams(window.location.search).get('cell') || '';
  const current = claimed || requested || '';
  const placeholder = `<option value="">Choose your cell…</option>`;
  const options = state.session.cells.map(c => {
    const lock = cellLockFor(c.id);
    const mine = lock && lock.ownerId === getPlayerInstanceId();
    const disabled = !!lock && !mine;
    const selected = c.id === current;
    const suffix = mine ? ' (locked by you)' : (lock ? ' (locked)' : '');
    return `<option value="${c.id}" ${selected ? 'selected' : ''} ${disabled ? 'disabled' : ''}>${c.name}${suffix}</option>`;
  }).join('');
  sel.innerHTML = placeholder + options;
  sel.disabled = !!claimed;
  if (claimed) sel.value = claimed;
  updatePlayerNavLinks();
}
function prettyZone(zoneId) { return state.zones[zoneId]?.name || (zoneId || 'Unplaced'); }
function assetTypeLabel(type) { return ASSET_TYPE_OPTIONS.find(o => o.value === type)?.label || type || 'Asset'; }
function assetAffiliationLabel(value) { return ASSET_AFFILIATION_OPTIONS.find(o => o.value === value)?.label || 'Friendly'; }
function normalizeAssetAffiliation(value) {
  return ASSET_AFFILIATION_OPTIONS.some(o => o.value === value) ? value : 'friend';
}
function normalizeAssetType(type) {
  const legacy = {
    isr: 'isr_drone',
    port_cell: 'port_support_unit'
  };
  return legacy[type] || (ASSET_TYPE_OPTIONS.some(o => o.value === type) ? type : 'patrol_vessel');
}

function assetRepresentationLabel(value) { return ASSET_REPRESENTATION_OPTIONS.find(o => o.value === value)?.label || 'Confirmed Unit'; }
function normalizeAssetRepresentation(value) {
  return ASSET_REPRESENTATION_OPTIONS.some(o => o.value === value) ? value : 'unit';
}

function trackQualityLabel(value) { return TRACK_QUALITY_OPTIONS.find(o => o.value === value)?.label || 'Q2 - Good confidence'; }
function trackQualityShort(value) { return (TRACK_QUALITY_OPTIONS.find(o => o.value === value)?.label || 'Q2').split(' ')[0]; }
function normalizeTrackQuality(value) { return TRACK_QUALITY_OPTIONS.some(o => o.value === value) ? value : 'q2'; }
function normalizeCoord(value) {
  if (value === '' || value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? Number(n.toFixed(6)) : null;
}
function normalizeHeading(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 90;
  const h = ((n % 360) + 360) % 360;
  return Number(h.toFixed(1));
}
function normalizeSpeed(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Number(n.toFixed(1));
}


function isCommercialAssetType(type) {
  return COMMERCIAL_ASSET_TYPES.includes(normalizeAssetType(type));
}

function assetScopeLabel(scope) { return ({ all: 'All assets', commercial: 'Commercial only', military: 'Non-commercial only' })[scope] || 'All assets'; }
function normalizeAssetScope(scope) { return ['all','commercial','military'].includes(scope) ? scope : 'all'; }

function assetOwningGroupLabel(asset) {
  if (isCommercialAssetType(asset?.type) || normalizeAssetAffiliation(asset?.affiliation) === 'neutral') return 'Commercial Vessels';
  return state.session.cells.find(c => c.id === asset?.assignedCell)?.name || 'Unassigned';
}

function groupedAssetSections(assets) {
  const sections = [];
  const assigned = [];
  const commercial = [];
  const contacts = [];
  const other = [];
  assets.forEach(a => {
    const aff = normalizeAssetAffiliation(a.affiliation);
    if (isCommercialAssetType(a.type) || aff === 'neutral') commercial.push(a);
    else if (a.assignedCell) assigned.push(a);
    else if (['unknown','suspect','hostile'].includes(aff)) contacts.push(a);
    else other.push(a);
  });
  if (assigned.length) sections.push({ title: 'Blue / Assigned Units', assets: assigned });
  if (commercial.length) sections.push({ title: 'Commercial Vessels', assets: commercial });
  if (contacts.length) sections.push({ title: 'Other Contacts', assets: contacts });
  if (other.length) sections.push({ title: 'Other Assets', assets: other });
  return sections;
}
function getAssetFilters() {
  state.ui = state.ui || clone(DEFAULT_STATE.ui);
  state.ui.assetFilters = Object.assign(clone(DEFAULT_STATE.ui.assetFilters), state.ui.assetFilters || {});
  state.ui.assetFilters.affiliations = Array.isArray(state.ui.assetFilters.affiliations) && state.ui.assetFilters.affiliations.length
    ? state.ui.assetFilters.affiliations.filter(v => ASSET_AFFILIATION_OPTIONS.some(o => o.value === v))
    : clone(DEFAULT_STATE.ui.assetFilters.affiliations);
  state.ui.assetFilters.representations = Array.isArray(state.ui.assetFilters.representations) && state.ui.assetFilters.representations.length
    ? state.ui.assetFilters.representations.filter(v => ASSET_REPRESENTATION_OPTIONS.some(o => o.value === v))
    : clone(DEFAULT_STATE.ui.assetFilters.representations);
  state.ui.assetFilters.scope = normalizeAssetScope(state.ui.assetFilters.scope);
  state.ui.assetFilters.search = String(state.ui.assetFilters.search || '').trim();
  return state.ui.assetFilters;
}
function assetSearchText(asset) {
  const zoneName = state.zones?.[asset?.zone]?.name || '';
  const cellName = state.session.cells.find(c => c.id === asset?.assignedCell)?.name || '';
  return [asset?.name, assetTypeLabel(asset?.type), assetAffiliationLabel(normalizeAssetAffiliation(asset?.affiliation)), assetRepresentationLabel(normalizeAssetRepresentation(asset?.representation)), zoneName, cellName, asset?.status].join(' ').toLowerCase();
}
function assetMatchesFilters(asset, filters = getAssetFilters()) {
  const aff = normalizeAssetAffiliation(asset?.affiliation);
  const rep = normalizeAssetRepresentation(asset?.representation);
  const type = normalizeAssetType(asset?.type);
  if (!filters.affiliations.includes(aff)) return false;
  if (!filters.representations.includes(rep)) return false;
  if (filters.scope === 'commercial' && !(isCommercialAssetType(type) || aff === 'neutral')) return false;
  if (filters.scope === 'military' && (isCommercialAssetType(type) || aff === 'neutral')) return false;
  if (filters.search && !assetSearchText(asset).includes(filters.search.toLowerCase())) return false;
  return true;
}
function resetAssetFilters() {
  state.ui = state.ui || {};
  state.ui.assetFilters = clone(DEFAULT_STATE.ui.assetFilters);
  saveState();
  renderAssets();
}
function bindAssetFilterControls() {
  const filters = getAssetFilters();
  const affWrap = document.getElementById('assetAffiliationFilters');
  const repWrap = document.getElementById('assetRepresentationFilters');
  const scopeEl = document.getElementById('assetScopeFilter');
  const searchEl = document.getElementById('assetFilterSearch');
  const resetBtn = document.getElementById('resetAssetFiltersBtn');
  if (searchEl) {
    searchEl.value = filters.search || '';
    searchEl.oninput = () => { filters.search = String(searchEl.value || '').trim(); saveState(); renderAssets(); };
  }
  if (scopeEl) {
    scopeEl.value = filters.scope;
    scopeEl.onchange = () => { filters.scope = normalizeAssetScope(scopeEl.value); saveState(); renderAssets(); };
  }
  if (affWrap) {
    affWrap.innerHTML = ASSET_AFFILIATION_OPTIONS.map(o => `<label class="filter-check"><input type="checkbox" data-aff="${o.value}" ${filters.affiliations.includes(o.value) ? 'checked' : ''}> ${o.label}</label>`).join('');
    affWrap.querySelectorAll('input[type=checkbox]').forEach(cb => cb.onchange = () => {
      const vals = Array.from(affWrap.querySelectorAll('input[type=checkbox]:checked')).map(n => n.getAttribute('data-aff'));
      filters.affiliations = vals.length ? vals : clone(DEFAULT_STATE.ui.assetFilters.affiliations);
      saveState();
      renderAssets();
    });
  }
  if (repWrap) {
    repWrap.innerHTML = ASSET_REPRESENTATION_OPTIONS.map(o => `<label class="filter-check"><input type="checkbox" data-rep="${o.value}" ${filters.representations.includes(o.value) ? 'checked' : ''}> ${o.label}</label>`).join('');
    repWrap.querySelectorAll('input[type=checkbox]').forEach(cb => cb.onchange = () => {
      const vals = Array.from(repWrap.querySelectorAll('input[type=checkbox]:checked')).map(n => n.getAttribute('data-rep'));
      filters.representations = vals.length ? vals : clone(DEFAULT_STATE.ui.assetFilters.representations);
      saveState();
      renderAssets();
    });
  }
  if (resetBtn) resetBtn.onclick = resetAssetFilters;
  const summary = document.getElementById('assetFilterSummary');
  if (summary) {
    const searchPart = filters.search ? ` · Search: “${filters.search}”` : '';
    summary.textContent = `${filters.affiliations.map(assetAffiliationLabel).join(', ')} · ${filters.representations.map(assetRepresentationLabel).join(', ')} · ${assetScopeLabel(filters.scope)}${searchPart}`;
  }
}

function shouldAutoRenameAsset(name) {
  const s = String(name || '').trim();
  if (!s) return true;
  return /^(new asset|asset\s*\d+|unit\s*\d+|track\s*\d+|vessel\s*\d+)$/i.test(s);
}

function autoNameForAssetType(type, existingNames = []) {
  const normalized = normalizeAssetType(type);
  const existing = new Set((existingNames || []).map(v => String(v || '').trim()).filter(Boolean));
  if (COMMERCIAL_NAME_PARTS[normalized]) {
    const part = COMMERCIAL_NAME_PARTS[normalized];
    for (const noun of part.nouns) {
      const candidate = `${part.prefix} ${noun}`;
      if (!existing.has(candidate)) return candidate;
    }
    let i = 2;
    while (existing.has(`${part.prefix} ${assetTypeLabel(normalized)} ${i}`)) i += 1;
    return `${part.prefix} ${assetTypeLabel(normalized)} ${i}`;
  }
  const label = assetTypeLabel(normalized);
  if (!existing.has(label)) return label;
  let i = 2;
  while (existing.has(`${label} ${i}`)) i += 1;
  return `${label} ${i}`;
}

function defaultFuelCapacityForAssetType(type) {
  const normalized = normalizeAssetType(type);
  const preset = modernPresetForType(normalized);
  if (preset?.fuelCapacity) return preset.fuelCapacity;
  if (['aircraft_carrier', 'amphibious_assault_ship'].includes(normalized)) return 16;
  if (['destroyer', 'cruiser', 'air_defence_destroyer', 'air_defence_frigate', 'amphibious_ship', 'replenishment_ship', 'auxiliary_ship'].includes(normalized)) return 14;
  if (['frigate', 'corvette', 'attack_submarine', 'ballistic_missile_submarine', 'submarine'].includes(normalized)) return 12;
  if (isCommercialAssetType(normalized)) return 10;
  if (['maritime_helicopter', 'isr_drone', 'boarding_team', 'port_support_unit', 'command_element'].includes(normalized)) return 8;
  return 10;
}

function defaultFuelForAssetType(type) {
  return 100;
}

function defaultReadinessForAssetType(type) {
  const normalized = normalizeAssetType(type);
  const preset = modernPresetForType(normalized);
  if (preset?.readiness != null) return clampPercent(preset.readiness, 100);
  if (isCommercialAssetType(normalized)) return 80;
  if (['boarding_team', 'port_support_unit', 'command_element'].includes(normalized)) return 95;
  return 90;
}

function defaultSensorProfileForAssetType(type) {
  const normalized = normalizeAssetType(type);
  const preset = modernPresetForType(normalized);
  if (preset?.sensorProfile) return clone(preset.sensorProfile);
  if (normalized === 'aircraft_carrier') return { radar: 22, visual: 11, inspection: 0.6, ew: 16 };
  if (['destroyer', 'cruiser', 'air_defence_destroyer', 'air_defence_frigate'].includes(normalized)) return { radar: 20, visual: 10, inspection: 0.7, ew: 14 };
  if (['frigate', 'corvette', 'patrol_vessel'].includes(normalized)) return { radar: 16, visual: 10, inspection: 0.8, ew: 10 };
  if (['attack_submarine', 'ballistic_missile_submarine', 'submarine'].includes(normalized)) return { radar: 6, visual: 5, inspection: 0.2, ew: 6 };
  if (isCommercialAssetType(normalized)) return { radar: 12, visual: 8, inspection: 0.5, ew: 4 };
  return { radar: 10, visual: 8, inspection: 0.5, ew: 6 };
}

function playerControllableAssets(cellId = getPlayerCell()) {
  return state.assets.filter(a => a.assignedCell === cellId && !isCommercialAssetType(a.type) && normalizeAssetAffiliation(a.affiliation) !== 'neutral');
}

function playerVisibleContacts(cellId = getPlayerCell(), maxRangeNm = 8) {
  const own = playerControllableAssets(cellId);
  if (!own.length) return [];
  return state.assets.filter(a => {
    if (a.assignedCell === cellId) return false;
    const target = assetLatLng(a, state.assets.findIndex(x => x.id === a.id));
    return own.some(src => {
      const origin = assetLatLng(src, state.assets.findIndex(x => x.id === src.id));
      return distanceNmBetween(origin[0], origin[1], target[0], target[1]) <= maxRangeNm;
    });
  });
}

function selectedPlayerContact() {
  const contacts = playerVisibleContacts();
  if (!contacts.length) return null;
  const found = contacts.find(a => a.id === playerSelectedContactId);
  if (found) return found;
  playerSelectedContactId = contacts[0].id;
  return contacts[0];
}

function selectPlayerContact(assetId) {
  const contact = playerVisibleContacts().find(a => a.id === assetId);
  if (!contact) return;
  playerSelectedContactId = assetId;
  renderPlayerPage();
}

function isFriendlyVisualUnit(asset) {
  return ['friend','assumed_friend'].includes(normalizeAssetAffiliation(asset?.affiliation)) && normalizeAssetRepresentation(asset?.representation) === 'unit';
}

function autoConfirmedName(asset) {
  const current = String(asset?.name || '').trim();
  if (current && !/^(unknown contact|track|new asset)/i.test(current)) return current;
  return `Confirmed ${assetTypeLabel(asset?.type)}`;
}


function inspectionStrength(asset) {
  const type = normalizeAssetType(asset?.type);
  if (type === 'boarding_team') return 4;
  if (type === 'patrol_vessel') return 3;
  if (type === 'frigate' || type === 'corvette') return 2;
  if (type === 'auxiliary_ship' || type === 'amphibious_ship') return 1;
  return 0;
}

function readinessModifier(asset) {
  const r = clampPercent(asset?.readiness, 100);
  if (r >= 85) return 1;
  if (r <= 50) return -1;
  return 0;
}

function targetDifficulty(asset) {
  const aff = normalizeAssetAffiliation(asset?.affiliation);
  let diff = 0;
  if (aff === 'hostile') diff += 4;
  else if (aff === 'suspect') diff += 2;
  else if (aff === 'unknown') diff += 1;
  if (isCommercialAssetType(asset?.type)) diff -= 1;
  if (normalizeAssetRepresentation(asset?.representation) === 'track') diff += 1;
  return diff;
}

function difficultyThreshold(level) {
  return ({ easy: 10, moderate: 13, hard: 16, severe: 19 })[level] || 13;
}

function randomInt(min, max) {
  const low = Math.ceil(min);
  const high = Math.floor(max);
  return Math.floor(Math.random() * (high - low + 1)) + low;
}

function generateContactName(asset) {
  const typeLabel = assetTypeLabel(asset?.type);
  const aff = normalizeAssetAffiliation(asset?.affiliation);
  if (isCommercialAssetType(asset?.type)) {
    const existing = state.assets.filter(a => a.id !== asset.id).map(a => a.name);
    return autoNameForAssetType(asset.type, existing);
  }
  if (aff === 'hostile') return `Hostile ${typeLabel}`;
  if (aff === 'suspect') return `Suspect ${typeLabel}`;
  if (aff === 'friend' || aff === 'assumed_friend') return `Friendly ${typeLabel}`;
  if (aff === 'neutral') return `Neutral ${typeLabel}`;
  return `Confirmed ${typeLabel}`;
}

function outcomeForBoardingSuccess(target, totalScore) {
  const aff = normalizeAssetAffiliation(target?.affiliation);
  const q = normalizeTrackQuality(target?.trackQuality);
  const qualityBonus = ({ q1: 2, q2: 1, q3: 0, q4: -1, q5: -2 })[q] || 0;
  const roll = randomInt(1, 6);
  const score = totalScore + qualityBonus + roll;
  if (aff === 'hostile') return 'Hostile act / resistance';
  if (aff === 'friend' || aff === 'assumed_friend') return 'Friendly confirmed';
  if (aff === 'suspect') {
    if (score >= 18) return 'Contraband suspected';
    if (score >= 14) return 'Deceptive documentation';
    return 'Needs follow-up';
  }
  if (aff === 'unknown') {
    if (isCommercialAssetType(target?.type) && score >= 14) return 'Cleared / compliant';
    if (score >= 16) return 'Friendly confirmed';
    return 'Needs follow-up';
  }
  if (aff === 'neutral') {
    if (isCommercialAssetType(target?.type) || score >= 12) return 'Cleared / compliant';
    return 'Needs follow-up';
  }
  return 'Needs follow-up';
}

function applyBoardingOutcome(target, outcome) {
  if (!target) return;
  if (outcome === 'Friendly confirmed') {
    target.affiliation = 'friend';
    target.representation = 'unit';
    target.trackQuality = 'q1';
    target.name = generateContactName(target);
  } else if (outcome === 'Cleared / compliant') {
    target.affiliation = 'neutral';
    target.representation = 'unit';
    target.trackQuality = 'q1';
    target.name = generateContactName(target);
  } else if (outcome === 'Contraband suspected') {
    target.affiliation = 'suspect';
    target.representation = 'unit';
    target.trackQuality = 'q1';
    target.name = generateContactName(target);
  } else if (outcome === 'Deceptive documentation') {
    target.affiliation = 'suspect';
    target.representation = 'unit';
    target.trackQuality = 'q2';
    target.name = generateContactName(target);
  } else if (outcome === 'Hostile act / resistance') {
    target.affiliation = 'hostile';
    target.representation = 'unit';
    target.trackQuality = 'q1';
    target.name = generateContactName(target);
  } else if (outcome === 'Needs follow-up') {
    target.representation = 'unit';
    target.trackQuality = target.trackQuality === 'q5' ? 'q4' : target.trackQuality;
  }
}

function boardingDistanceNm(inspector, target) {
  if (!inspector || !target) return Infinity;
  const iIdx = state.assets.findIndex(a => a.id === inspector.id);
  const tIdx = state.assets.findIndex(a => a.id === target.id);
  const [ilat, ilon] = assetLatLng(inspector, iIdx);
  const [tlat, tlon] = assetLatLng(target, tIdx);
  return distanceNmBetween(ilat, ilon, tlat, tlon);
}

function applyBoardingMovementHold(inspector, target) {
  [inspector, target].forEach(asset => {
    if (!asset) return;
    asset.speed = 0;
    asset.boardingHoldUntilTurn = Math.max(Number(asset.boardingHoldUntilTurn || 0), Number(state.scenario.turn || 1));
  });
}

function releaseExpiredBoardingHolds() {
  const currentTurn = Number(state.scenario.turn || 1);
  state.assets.forEach(asset => {
    if (Number(asset.boardingHoldUntilTurn || 0) < currentTurn) asset.boardingHoldUntilTurn = 0;
  });
}

function requestPlayerBoarding() {
  const inspector = selectedPlayerAsset();
  const target = selectedPlayerContact();
  if (!inspector || !target) return;
  if (inspector.id === target.id) {
    alert('Select another vessel as the boarding target.');
    return;
  }
  const distanceNm = boardingDistanceNm(inspector, target);
  if (distanceNm > 2) {
    alert(`Boarding is only available within 2.0 nm. Current distance: ${distanceNm.toFixed(2)} nm.`);
    return;
  }
  const duplicatePending = (state.boardingRequests || []).some(r => r.status === 'pending' && r.inspectorAssetId === inspector.id && r.targetAssetId === target.id);
  if (duplicatePending) {
    alert('A boarding request for this pair is already pending.');
    return;
  }
  const rationale = String(document.getElementById('playerBoardingRationale')?.value || '').trim();
  applyBoardingMovementHold(inspector, target);
  const req = {
    id: `BRD-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,5)}`,
    time: state.scenario.timeLabel || 'H+0',
    turn: state.scenario.turn || 1,
    cellId: getPlayerCell(),
    inspectorAssetId: inspector.id,
    targetAssetId: target.id,
    rationale,
    distanceNm: Number(distanceNm.toFixed(2)),
    holdUntilTurn: Number(state.scenario.turn || 1),
    status: 'pending',
    envDifficulty: 'moderate',
    facilitatorModifier: 0,
    adjudication: null
  };
  state.boardingRequests.push(req);
  const msg = `${getPlayerCell()} requested boarding: ${inspector.name} -> ${target.name} at ${distanceNm.toFixed(2)} nm. Both vessels set to 0 kt for next turn.${rationale ? ` | rationale: ${rationale}` : ''}`;
  state.actionLogByCell[getPlayerCell()].push({ time: req.time, text: msg });
  state.timeline.push({ time: req.time, text: msg });
  saveState();
  renderPlayerPage();
}

function adjudicateBoardingRequest(requestId) {
  const req = (state.boardingRequests || []).find(r => r.id === requestId);
  if (!req || req.status !== 'pending') return;
  const inspector = state.assets.find(a => a.id === req.inspectorAssetId);
  const target = state.assets.find(a => a.id === req.targetAssetId);
  if (!inspector || !target) return;
  const envDifficulty = String(document.getElementById(`boardingDiff-${requestId}`)?.value || req.envDifficulty || 'moderate');
  const facilitatorModifier = Number(document.getElementById(`boardingFacMod-${requestId}`)?.value || req.facilitatorModifier || 0);
  const note = String(document.getElementById(`boardingFacNote-${requestId}`)?.value || '').trim();
  const roll = randomInt(1, 20);
  const platform = inspectionStrength(inspector);
  const ready = readinessModifier(inspector);
  const targetPen = targetDifficulty(target);
  const total = roll + platform + ready + facilitatorModifier - targetPen;
  const threshold = difficultyThreshold(envDifficulty);
  const success = total >= threshold;
  const execution = !success ? 'Boarding failed / incomplete' : (total >= threshold + 5 ? 'Successful boarding' : 'Partial boarding success');
  const outcome = success ? outcomeForBoardingSuccess(target, total) : 'Boarding failed / incomplete';
  if (success) applyBoardingOutcome(target, outcome);
  req.status = success ? 'adjudicated-success' : 'adjudicated-failed';
  req.envDifficulty = envDifficulty;
  req.facilitatorModifier = facilitatorModifier;
  req.adjudication = { roll, platform, ready, targetPenalty: targetPen, threshold, total, execution, outcome, note, time: state.scenario.timeLabel || 'H+0' };
  const cellName = state.session.cells.find(c => c.id === req.cellId)?.name || req.cellId;
  const facText = `${cellName} boarding adjudication: ${inspector.name} -> ${target.name} | d20 ${roll} + platform ${platform} + readiness ${ready} + fac ${facilitatorModifier} - target ${targetPen} = ${total} vs ${threshold} | ${execution}${success ? ` | outcome: ${outcome}` : ''}${note ? ` | note: ${note}` : ''}`;
  state.timeline.push({ time: state.scenario.timeLabel || 'H+0', text: facText });
  state.playerFeedByCell[req.cellId].push({ time: state.scenario.timeLabel || 'H+0', text: facText });
  state.releasedInjects.push({ id: req.id, title: 'Boarding adjudication', situation: facText, text: facText, time: state.scenario.timeLabel || 'H+0' });
  saveState();
  renderAll();
}

function runVisualConfirmation() {
  const friendlies = state.assets.filter(isFriendlyVisualUnit);
  const changes = [];
  state.assets.forEach((asset, idx) => {
    if (normalizeAssetRepresentation(asset.representation) !== 'track') return;
    const origin = assetLatLng(asset, idx);
    let seenBy = null;
    friendlies.forEach((f, fidx) => {
      if (seenBy) return;
      const fl = assetLatLng(f, state.assets.findIndex(a => a.id === f.id));
      const d = distanceNmBetween(origin[0], origin[1], fl[0], fl[1]);
      if (d <= 8) seenBy = { asset: f, distanceNm: d };
    });
    if (seenBy) {
      asset.representation = 'unit';
      asset.trackQuality = 'q1';
      asset.name = autoConfirmedName(asset);
      changes.push(`${asset.name} auto-confirmed within ${seenBy.distanceNm.toFixed(1)} nm of ${seenBy.asset.name}`);
    }
  });
  return changes;
}

function appendWaypoint(asset, latlng) {
  if (!asset || !latlng) return null;
  if (!Array.isArray(asset.waypoints)) asset.waypoints = [];
  const index = asset.waypoints.length + 1;
  const wp = { lat: Number(latlng.lat.toFixed(6)), lon: Number(latlng.lng.toFixed(6)), label: `WP${index}` };
  asset.waypoints.push(wp);
  return wp;
}

function undoLastWaypointForAsset(asset) {
  if (!asset || !Array.isArray(asset.waypoints) || !asset.waypoints.length) return null;
  return asset.waypoints.pop();
}

function midpointLatLng(a, b) {
  return [(Number(a[0]) + Number(b[0])) / 2, (Number(a[1]) + Number(b[1])) / 2];
}

function waypointLabelIcon(text) {
  return L.divIcon({ className: 'distance-label-icon', html: `<div class="distance-label">${text}</div>`, iconSize: [60, 18], iconAnchor: [30, 9] });
}

function waypointPointIcon(label) {
  return L.divIcon({ className: 'waypoint-div-icon', html: `<div class="waypoint-pin">${label}</div>`, iconSize: [30, 30], iconAnchor: [15, 15] });
}

function renderWaypointGuide(targetMap, layerArr, asset, origin, editable, saveCb) {
  const wpQueue = Array.isArray(asset?.waypoints) ? asset.waypoints : [];
  const points = [origin].concat(wpQueue.map(w => [normalizeCoord(w.lat), normalizeCoord(w.lon)]).filter(w => w[0] != null && w[1] != null));
  if (points.length > 1) {
    const line = L.polyline(points, { color: '#f59e0b', weight: 3, opacity: 0.9, dashArray: '6 6' }).addTo(targetMap);
    layerArr.push(line);
    for (let i = 0; i < points.length - 1; i += 1) {
      const legNm = distanceNmBetween(points[i][0], points[i][1], points[i+1][0], points[i+1][1]);
      const mid = midpointLatLng(points[i], points[i+1]);
      const distMarker = L.marker(mid, { icon: waypointLabelIcon(`${legNm.toFixed(1)} nm`), interactive: false, keyboard: false }).addTo(targetMap);
      layerArr.push(distMarker);
    }
  }
  wpQueue.forEach((wp, i) => {
    if (normalizeCoord(wp.lat) == null || normalizeCoord(wp.lon) == null) return;
    const marker = L.marker([normalizeCoord(wp.lat), normalizeCoord(wp.lon)], { draggable: false, icon: waypointPointIcon(wp.label || `WP${i+1}`) }).addTo(targetMap);
    marker.bindTooltip(`${wp.label || `WP${i+1}`} · ${normalizeCoord(wp.lat).toFixed(4)}, ${normalizeCoord(wp.lon).toFixed(4)} · double-click to drag`, { permanent: false });
    if (editable) {
      marker.on('dblclick', () => { if (marker.dragging) marker.dragging.enable(); });
      marker.on('dragend', e => {
        const pos = e.target.getLatLng();
        asset.waypoints[i] = Object.assign({}, asset.waypoints[i], { lat: Number(pos.lat.toFixed(6)), lon: Number(pos.lng.toFixed(6)) });
        if (marker.dragging) marker.dragging.disable();
        saveCb && saveCb(asset, i);
      });
    }
    layerArr.push(marker);
  });
}

function parseWaypointText(text) {
  return String(text || '').split(/\r?\n/).map(line => line.trim()).filter(Boolean).map(line => {
    const parts = line.split(',');
    if (parts.length < 2) return null;
    const lat = normalizeCoord(parts[0]);
    const lon = normalizeCoord(parts[1]);
    const label = parts.slice(2).join(',').trim();
    if (lat == null || lon == null) return null;
    return { lat, lon, label };
  }).filter(Boolean);
}

function formatWaypointText(waypoints) {
  return (Array.isArray(waypoints) ? waypoints : []).map(w => `${normalizeCoord(w.lat)},${normalizeCoord(w.lon)}${w.label ? ',' + w.label : ''}`).join('\n');
}

function waypointSummary(asset) {
  const count = Array.isArray(asset?.waypoints) ? asset.waypoints.length : 0;
  if (!count) return 'No waypoints';
  const next = asset.waypoints[0];
  return `${count} WP${count === 1 ? '' : 's'}${next ? ` · next ${next.lat?.toFixed?.(3) || next.lat}, ${next.lon?.toFixed?.(3) || next.lon}` : ''}`;
}

function selectedAsset() {
  return state.assets.find(a => a.id === state.selectedAssetId) || null;
}

function selectedPlayerAsset() {
  const cellId = getPlayerCell();
  const myAssets = playerControllableAssets(cellId);
  if (!myAssets.length) return null;
  const found = myAssets.find(a => a.id === playerSelectedAssetId);
  if (found) return found;
  playerSelectedAssetId = myAssets[0].id;
  return myAssets[0];
}

function appendWaypointToPlayerAsset(latlng) {
  const asset = selectedPlayerAsset();
  if (!asset) {
    updatePlayerWaypointUi('Select one of your controllable assigned assets first.');
    return;
  }
  const wp = appendWaypoint(asset, latlng);
  saveState();
  updatePlayerWaypointUi(`Added ${wp.label} to ${asset.name} at ${wp.lat.toFixed(4)}, ${wp.lon.toFixed(4)}.`);
  renderPlayerPage();
}

function clearPlayerSelectedWaypoints() {
  const asset = selectedPlayerAsset();
  if (!asset) return;
  asset.waypoints = [];
  saveState();
  updatePlayerWaypointUi(`Cleared waypoints for ${asset.name}.`);
  renderPlayerPage();
}

function selectPlayerAsset(assetId) {
  const cellId = getPlayerCell();
  const asset = state.assets.find(a => a.id === assetId && a.assignedCell === cellId);
  if (!asset) return;
  playerSelectedAssetId = assetId;
  updatePlayerWaypointUi(`Selected ${asset.name}.`);
  renderPlayerPage();
}

function updatePlayerWaypointUi(msg) {
  const el = document.getElementById('playerWaypointStatus');
  if (!el) return;
  const asset = selectedPlayerAsset();
  const modeText = playerMapMode === 'add-waypoint' ? 'Waypoint mode is ON.' : 'Waypoint mode is OFF.';
  const assetText = asset ? ` Selected asset: ${asset.name}.` : ' Select one of your assigned assets.';
  const cursorText = playerLastHoveredLatLng ? ` Cursor ${playerLastHoveredLatLng.lat.toFixed(4)}, ${playerLastHoveredLatLng.lng.toFixed(4)}.` : '';
  el.textContent = msg || (modeText + assetText + cursorText);
}

function waypointOrderSummary(waypoints) {
  const queue = Array.isArray(waypoints) ? waypoints : [];
  if (!queue.length) return 'no waypoints';
  const preview = queue.slice(0, 3).map((wp, idx) => {
    const label = wp.label || `WP${idx + 1}`;
    const lat = Number(wp.lat).toFixed(3);
    const lon = Number(wp.lon).toFixed(3);
    return `${label} ${lat}, ${lon}`;
  }).join(' · ');
  return `${queue.length} waypoint${queue.length === 1 ? '' : 's'}: ${preview}${queue.length > 3 ? ' · …' : ''}`;
}

function savePlayerAssetOrders() {
  const asset = selectedPlayerAsset();
  if (!asset) return;
  const headingEl = document.getElementById('playerAssetHeading');
  const speedEl = document.getElementById('playerAssetSpeed');
  const waypointsEl = document.getElementById('playerAssetWaypoints');
  asset.heading = normalizeHeading(headingEl?.value || asset.heading);
  asset.speed = normalizeSpeed(speedEl?.value || asset.speed);
  asset.waypoints = parseWaypointText(waypointsEl?.value || '');
  const summary = `${getPlayerCell()} saved orders for ${asset.name}: heading ${normalizeHeading(asset.heading)}°, speed ${normalizeSpeed(asset.speed)} kt, ${waypointOrderSummary(asset.waypoints)}.`;
  state.actionLogByCell[getPlayerCell()].push({ time: state.scenario.timeLabel || 'H+0', text: summary });
  state.timeline.push({ time: state.scenario.timeLabel || 'H+0', text: summary });
  saveState();
  updatePlayerWaypointUi(`Saved orders for ${asset.name}.`);
  renderPlayerPage();
}

function undoLastPlayerWaypoint() {
  const asset = selectedPlayerAsset();
  const removed = undoLastWaypointForAsset(asset);
  if (!removed) return;
  saveState();
  updatePlayerWaypointUi(`Removed ${removed.label || 'last waypoint'} from ${asset.name}.`);
  renderPlayerPage();
}

function undoLastSelectedWaypoint() {
  const asset = selectedAsset();
  const removed = undoLastWaypointForAsset(asset);
  if (!removed) return;
  saveState();
  updateWaypointUi(`Removed ${removed.label || 'last waypoint'} from ${asset.name}.`);
  renderAll();
  initMaps(true);
}

function savePlayerContactClassification() {
  const contact = selectedPlayerContact();
  if (!contact) return;
  contact.affiliation = normalizeAssetAffiliation(document.getElementById('playerContactAffiliation')?.value || contact.affiliation);
  contact.representation = normalizeAssetRepresentation(document.getElementById('playerContactRepresentation')?.value || contact.representation);
  contact.trackQuality = normalizeTrackQuality(document.getElementById('playerContactTrackQuality')?.value || contact.trackQuality);
  const note = `${getPlayerCell()} reclassified ${contact.name} as ${assetAffiliationLabel(contact.affiliation)} / ${assetRepresentationLabel(contact.representation)}`;
  state.actionLogByCell[getPlayerCell()].push({ time: state.scenario.timeLabel || 'H+0', text: note });
  state.timeline.push({ time: state.scenario.timeLabel || 'H+0', text: note });
  saveState();
  renderPlayerPage();
}


function appendWaypointToSelectedAsset(latlng) {
  const asset = selectedAsset();
  if (!asset) {
    alert('Select an asset first, then use Add Waypoint Mode.');
    updateWaypointUi('Select an asset first, then click Add Waypoint Mode.');
    return;
  }
  const wp = appendWaypoint(asset, latlng);
  saveState();
  renderAll();
  initMaps(true);
  updateWaypointUi(`Added ${wp.label} at ${wp.lat.toFixed(4)}, ${wp.lon.toFixed(4)} for ${asset.name}.`);
}

function clearSelectedAssetWaypoints() {
  const asset = selectedAsset();
  if (!asset) return;
  asset.waypoints = [];
  saveState();
  updateWaypointUi(`Cleared waypoints for ${asset.name}.`);
  renderAll();
  initMaps(true);
}

function updateWaypointUi(message) {
  const el = document.getElementById('waypointStatus');
  if (!el) return;
  const asset = selectedAsset();
  const modeText = state.mapMode === 'add-waypoint' ? 'Waypoint mode is ON.' : 'Waypoint mode is OFF.';
  const assetText = asset ? ` Selected asset: ${asset.name}.` : ' Select an asset to add waypoints.';
  const hoverText = lastHoveredLatLng ? ` Cursor: ${lastHoveredLatLng.lat.toFixed(4)}, ${lastHoveredLatLng.lng.toFixed(4)}.` : '';
  el.textContent = `${message || modeText}${message ? '' : assetText}${hoverText}`;
}

function normalizeMapView(view) {
  if (!view || !Array.isArray(view.center) || view.center.length !== 2) return null;
  const lat = Number(view.center[0]);
  const lng = Number(view.center[1]);
  const zoom = Number(view.zoom);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || !Number.isFinite(zoom)) return null;
  return { center: [lat, lng], zoom };
}
function defaultMapView() {
  return { center: [54.8, 7.55], zoom: 8 };
}
function currentMapView(targetMap) {
  if (!targetMap) return normalizeMapView(state.scenario.lastMapView) || normalizeMapView(state.scenario.pinnedMapView) || defaultMapView();
  const c = targetMap.getCenter();
  return { center: [Number(c.lat.toFixed(5)), Number(c.lng.toFixed(5))], zoom: targetMap.getZoom() };
}
function getInitialMapView() {
  return normalizeMapView(state.scenario.pinnedMapView) || normalizeMapView(state.scenario.lastMapView) || defaultMapView();
}
function persistLastMapView(targetMap) {
  if (!targetMap || state.scenario.rememberLastMapView === false) return;
  state.scenario.lastMapView = currentMapView(targetMap);
  saveState();
  renderScenario();
}
function pinCurrentMapView() {
  if (!map) return;
  state.scenario.pinnedMapView = currentMapView(map);
  saveState();
  renderScenario();
}
function clearPinnedMapView() {
  state.scenario.pinnedMapView = null;
  saveState();
  renderScenario();
}
function centerMapOnSavedView() {
  if (!map) return;
  const view = getInitialMapView();
  map.setView(view.center, view.zoom);
}
function setupStateSyncPolling() {
  if (syncPollTimer) return;
  lastKnownSyncToken = state?.meta?.syncToken || null;
  syncPollTimer = window.setInterval(() => {
    try {
      const latest = loadState();
      const token = latest?.meta?.syncToken || null;
      if (!token || token === lastKnownSyncToken) return;
      lastKnownSyncToken = token;
      state = latest;
      ensureSessionMaps();
      syncPlayerClaimFromUrl();
      renderAll();
      initMaps(true);
    } catch (_) {}
  }, 1200);
}
function zoneStyle(kind) {
  if (kind === 'port' || kind === 'harbor') return { color: '#fde68a', fillColor: '#fde68a', fillOpacity: 0.10 };
  if (kind === 'info') return { color: '#c084fc', fillColor: '#c084fc', fillOpacity: 0.09 };
  if (kind === 'support') return { color: '#94a3b8', fillColor: '#94a3b8', fillOpacity: 0.07 };
  if (kind === 'bottleneck') return { color: '#f59e0b', fillColor: '#f59e0b', fillOpacity: 0.10 };
  return { color: '#38bdf8', fillColor: '#38bdf8', fillOpacity: 0.07 };
}
function slugify(s) { return (s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'item'; }
function uniqueId(base, existing) {
  let id = slugify(base);
  let i = 2;
  while (existing.includes(id)) {
    id = `${slugify(base)}-${i++}`;
  }
  return id;
}
function zoneIds() { return Object.keys(state.zones); }
function hasZones() { return zoneIds().length > 0; }

async function init() {
  try {
    const [injResp, tplResp] = await Promise.all([
      fetch('./data/injects.json').catch(() => null),
      fetch('./data/templates.json').catch(() => null)
    ]);
    injectLibrary = injResp && injResp.ok ? await injResp.json() : [];
    templates = tplResp && tplResp.ok ? await tplResp.json() : {};
  } catch (e) {
    injectLibrary = [];
    templates = {};
  }
  ensureSessionMaps();
  syncPlayerClaimFromUrl();
  bindEvents();
  setupStateSyncPolling();
  renderAll();
  initMaps(true);
}

function bindEvents() {
  const bindClick = (id, handler) => {
    const el = document.getElementById(id);
    if (el) el.onclick = handler;
  };
  const bindChange = (id, handler) => {
    const el = document.getElementById(id);
    if (el) el.onchange = handler;
  };

  bindClick('resetBtn', resetToBlankScenario);
  bindClick('generatePressureBtn', previewNextTurnMovement);
  bindClick('nextTurnBtn', advanceSimulationTurn);
  bindClick('scenarioNextTurnBtn', advanceSimulationTurn);
  bindClick('mapNextTurnBtn', advanceSimulationTurn);
  bindClick('previousTurnBtn', restorePreviousTurn);
  bindClick('scenarioPreviousTurnBtn', restorePreviousTurn);
  bindClick('mapPreviousTurnBtn', restorePreviousTurn);
  bindClick('measureFacBtn', () => toggleMeasurementMode('facilitator'));
  bindClick('clearMeasureFacBtn', () => clearMeasurement('facilitator'));
  bindClick('measurePlayerBtn', () => toggleMeasurementMode('player'));
  bindClick('clearMeasurePlayerBtn', () => clearMeasurement('player'));
  bindClick('addModernAssetBtn', addModernAssetFromLibrary);
  bindChange('modernAssetLibrarySelect', renderModernAssetLibraryInfo);
  bindChange('overlaySelect', (e) => { state.scenario.overlayMode = e.target.value; saveState(); initMaps(true); });
  bindChange('turnDurationHoursInput', saveScenarioMeta);
  bindChange('turnDurationUnitSelect', saveScenarioMeta);
  bindClick('saveZonePropsBtn', saveSelectedZoneProps);
  bindClick('deleteZoneBtn', deleteSelectedZone);
  bindClick('resetZonesBtn', clearZones);
  bindClick('addCellBtn', () => addCellRow());
  bindClick('saveCellsBtn', saveCells);
  bindChange('templateSelect', applyTemplate);
  bindClick('savePackageBtn', saveExercisePackage);
  bindChange('loadPackageInput', loadExercisePackage);
  bindClick('newBlankScenarioBtn', resetToBlankScenario);
  bindClick('saveScenarioMetaBtn', saveScenarioMeta);
  bindChange('rememberLastMapView', (e) => { state.scenario.rememberLastMapView = !!e.target.checked; if (state.scenario.rememberLastMapView && map) state.scenario.lastMapView = currentMapView(map); saveState(); renderScenario(); });
  bindClick('pinMapViewBtn', pinCurrentMapView);
  bindClick('clearPinnedMapViewBtn', clearPinnedMapView);
  bindClick('centerSavedMapViewBtn', centerMapOnSavedView);
  bindClick('addZoneModeBtn', () => setMapMode(state.mapMode === 'add-zone' ? 'select' : 'add-zone'));
  bindClick('addWaypointModeBtn', () => setMapMode(state.mapMode === 'add-waypoint' ? 'select' : 'add-waypoint'));
  bindClick('clearWaypointsBtn', clearSelectedAssetWaypoints);
  const undoBtn = document.getElementById('undoWaypointBtn'); if (undoBtn) undoBtn.onclick = undoLastSelectedWaypoint;
  bindClick('addAssetBtn', addAsset);
  bindClick('duplicateAssetBtn', duplicateSelectedAsset);
  bindClick('autoPopulateCommercialBtn', autoPopulateCommercialTraffic);
  bindClick('saveAssetPropsBtn', saveSelectedAssetProps);
  bindClick('deleteAssetBtn', deleteSelectedAsset);
  bindClick('clearAssetsBtn', clearAssets);

  if (document.getElementById('playerCellSelect')) {
    document.getElementById('playerCellSelect').onchange = (e) => {
      const cellId = e.target.value;
      if (!cellId) return;
      if (!claimPlayerCell(cellId)) {
        alert('This cell is already locked, or this browser tab has already claimed a different cell.');
      }
      renderPlayerPage(); initMaps(true);
    };
    const playerSubmitBtn = document.getElementById('playerSubmitBtn');
    if (playerSubmitBtn) playerSubmitBtn.onclick = submitPlayerAction;
  }
  try {
    if ('BroadcastChannel' in window) {
      stateChannel = new BroadcastChannel(STATE_CHANNEL_NAME);
      stateChannel.onmessage = (event) => {
        if (event?.data?.type !== 'state-updated') return;
        try {
          state = loadState();
          lastKnownSyncToken = state?.meta?.syncToken || lastKnownSyncToken;
          ensureSessionMaps();
          syncPlayerClaimFromUrl();
          renderAll();
          initMaps(true);
        } catch (_) {}
      };
    }
  } catch (_) {}
  window.addEventListener('storage', (e) => {
    if (e.key !== STORAGE_KEY || !e.newValue) return;
    try {
      state = migrateState(JSON.parse(e.newValue));
      lastKnownSyncToken = state?.meta?.syncToken || lastKnownSyncToken;
      ensureSessionMaps();
      syncPlayerClaimFromUrl();
      renderAll();
      initMaps(true);
    } catch (_) {}
  });
  window.addEventListener('focus', () => {
    try {
      state = loadState();
      lastKnownSyncToken = state?.meta?.syncToken || lastKnownSyncToken;
      ensureSessionMaps();
      syncPlayerClaimFromUrl();
      renderAll();
      initMaps(true);
    } catch (_) {}
  });
}

function setMapMode(mode) {
  state.mapMode = mode;
  saveState();
  renderScenario();
  renderAssetEditor();
  renderFacilitatorMap();
  updateWaypointUi();
  renderModernAssetLibraryInfo();
}


function resetToBlankScenario() {
  state = clone(DEFAULT_STATE);
  lastHoveredLatLng = null;
  saveState();
  renderAll();
  initMaps(true);
}

function clearZones() {
  state.zones = {};
  state.selectedZoneId = '';
  state.assets = state.assets.map(a => Object.assign({}, a, { zone: '' }));
  saveState();
  renderAll();
  initMaps(true);
}

function clearAssets() {
  state.assets = [];
  state.selectedAssetId = '';
  saveState();
  renderAll();
  initMaps(true);
}

function buildPackage() {
  return clone({
    version: 16,
    scenario: state.scenario,
    zones: state.zones,
    selectedZoneId: state.selectedZoneId,
    selectedAssetId: state.selectedAssetId,
    mapMode: 'select',
    session: state.session,
    assets: state.assets,
    incidents: state.incidents,
    releasedInjects: state.releasedInjects,
    selectedActions: state.selectedActions,
    playerFeedByCell: state.playerFeedByCell,
    actionLogByCell: state.actionLogByCell,
    timeline: state.timeline,
    boardingRequests: state.boardingRequests
  });
}

function saveExercisePackage() {
  const filename = `${slugify(state.scenario.name || 'owge-scenario') || 'owge-scenario'}.json`;
  const blob = new Blob([JSON.stringify(buildPackage(), null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
}

function loadExercisePackage(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function () {
    try {
      state = migrateState(JSON.parse(reader.result));
      saveState();
      renderAll();
      initMaps(true);
    } catch (err) {
      alert('Invalid exercise/scenario package.');
    }
  };
  reader.readAsText(file);
}

function applyTemplate() {
  const key = document.getElementById('templateSelect').value;
  if (!key) return;
  if (key === '__blank__') {
    resetToBlankScenario();
    return;
  }
  if (!templates[key]) return;
  state.scenario = Object.assign(clone(DEFAULT_STATE.scenario), clone(templates[key].scenario || {}));
  state.zones = clone(templates[key].zones || {});
  state.assets = clone(templates[key].assets || []);
  state.selectedZoneId = Object.keys(state.zones)[0] || '';
  state.selectedAssetId = state.assets[0]?.id || '';
  saveState();
  renderAll();
  initMaps(true);
}

function saveScenarioMeta() {
  state.scenario.name = document.getElementById('scenarioNameInput').value.trim() || 'Untitled Scenario';
  state.scenario.overview = document.getElementById('scenarioOverviewInput').value.trim() || 'Facilitator-authored scenario.';
  state.scenario.currentSituation = document.getElementById('scenarioSituationInput').value.trim() || 'Facilitator-authored setup.';
  const overlaySelect = document.getElementById('overlaySelect');
  state.scenario.overlayMode = overlaySelect ? overlaySelect.value : (state.scenario.overlayMode || 'openseamap');
  const symbolStyleSelect = document.getElementById('symbolStyleSelect');
  state.scenario.symbolStyle = symbolStyleSelect ? symbolStyleSelect.value : (state.scenario.symbolStyle || 'ntds');
  const turnDurationInput = document.getElementById('turnDurationHoursInput');
  const turnDurationUnit = document.getElementById('turnDurationUnitSelect')?.value || (Number(state.scenario.turnDurationHours || 1) < 1 ? 'minutes' : 'hours');
  const rawTurnDuration = Number(turnDurationInput?.value || state.scenario.turnDurationHours || 1) || 1;
  const normalizedHours = turnDurationUnit === 'minutes' ? (rawTurnDuration / 60) : rawTurnDuration;
  state.scenario.turnDurationHours = Math.max(0.25, Math.min(24, normalizedHours));
  const rememberLast = document.getElementById('rememberLastMapView');
  state.scenario.rememberLastMapView = rememberLast ? !!rememberLast.checked : state.scenario.rememberLastMapView !== false;
  if (map && state.scenario.rememberLastMapView) state.scenario.lastMapView = currentMapView(map);
  saveState();
  renderScenario();
}

function addCellRow(cell) {
  const container = document.getElementById('cellsEditor');
  if (!container) return;
  const c = cell || { id: '', name: '', domain: 'maritime' };
  const row = document.createElement('div');
  row.className = 'card cell-row';
  row.innerHTML = '<div class="grid2"><div><label>Name</label><input class="cell-name" value="' + (c.name || '') + '"></div><div><label>Domain</label><select class="cell-domain">' + ['maritime', 'logistics', 'information', 'cyber', 'air', 'land', 'space'].map(d => '<option value="' + d + '" ' + (c.domain === d ? 'selected' : '') + '>' + d + '</option>').join('') + '</select></div></div><button class="secondary remove-cell-btn">Remove</button>';
  container.appendChild(row);
  row.querySelector('.remove-cell-btn').onclick = () => row.remove();
}

function saveCells() {
  const rows = Array.from(document.querySelectorAll('.cell-row'));
  const existingByName = Object.fromEntries((state.session.cells || []).map(c => [String(c.name || '').toLowerCase(), c]));
  const cells = rows.map((row, idx) => {
    const name = row.querySelector('.cell-name').value.trim() || ('Blue Cell ' + (idx + 1));
    const existing = existingByName[String(name).toLowerCase()];
    const fallback = defaultCellPosition(idx);
    return { id: uniqueId(name, []), name, domain: row.querySelector('.cell-domain').value, lat: existing?.lat ?? fallback[0], lon: existing?.lon ?? fallback[1] };
  });
  state.session.cells = cells.length ? cells : clone(DEFAULT_STATE.session.cells);
  ensureCellLocations();
  const oldAssets = clone(state.assets);
  state.playerFeedByCell = {};
  state.actionLogByCell = {};
  ensureSessionMaps();
  state.assets = oldAssets.map(a => Object.assign({}, a, { assignedCell: state.session.cells.find(c => c.id === a.assignedCell)?.id || state.session.cells[0].id }));
  saveState();
  renderAll();
}

function selectZone(zoneId) {
  state.selectedZoneId = zoneId;
  saveState();
  renderZoneEditor();
  renderFacilitatorMap();
}

function createZoneAt(latlng) {
  const id = uniqueId(`zone-${zoneIds().length + 1}`, zoneIds());
  state.zones[id] = {
    name: `Zone ${zoneIds().length + 1}`,
    center: [latlng.lat, latlng.lng],
    radius: 12000,
    kind: 'sea'
  };
  state.selectedZoneId = id;
  state.mapMode = 'select';
  saveState();
  renderAll();
  initMaps(true);
}

function saveSelectedZoneProps() {
  const currentId = state.selectedZoneId;
  if (!currentId || !state.zones[currentId]) return;
  const requestedId = slugify(document.getElementById('zoneId').value.trim()) || currentId;
  const name = document.getElementById('zoneName').value.trim() || state.zones[currentId].name;
  const radius = Math.max(1000, Number(document.getElementById('zoneRadius').value) || state.zones[currentId].radius || 12000);
  const kind = document.getElementById('zoneKind').value || 'sea';
  const updated = Object.assign({}, state.zones[currentId], { name, radius, kind });
  if (requestedId !== currentId) {
    if (state.zones[requestedId]) {
      alert('Zone id already exists.');
      return;
    }
    delete state.zones[currentId];
    state.zones[requestedId] = updated;
    state.assets = state.assets.map(a => Object.assign({}, a, { zone: a.zone === currentId ? requestedId : a.zone }));
    state.selectedZoneId = requestedId;
  } else {
    state.zones[currentId] = updated;
  }
  saveState();
  renderAll();
  initMaps(true);
}

function deleteSelectedZone() {
  const id = state.selectedZoneId;
  if (!id || !state.zones[id]) return;
  delete state.zones[id];
  state.assets = state.assets.map(a => Object.assign({}, a, { zone: a.zone === id ? '' : a.zone }));
  state.selectedZoneId = zoneIds()[0] || '';
  saveState();
  renderAll();
  initMaps(true);
}


function currentMapBounds() {
  if (!map) {
    const c = state.scenario?.pinnedMapView?.center || state.scenario?.lastMapView?.center || [54.8, 7.55];
    return { south: c[0] - 0.12, north: c[0] + 0.12, west: c[1] - 0.22, east: c[1] + 0.22 };
  }
  const b = map.getBounds();
  return { south: b.getSouth(), north: b.getNorth(), west: b.getWest(), east: b.getEast() };
}

function createAssetBase(type, overrides = {}) {
  const existingIds = state.assets.map(a => a.id);
  const existingNames = state.assets.map(a => a.name);
  const zone = overrides.zone != null ? overrides.zone : (state.selectedZoneId || zoneIds()[0] || '');
  const center = overrides.lat != null && overrides.lon != null
    ? [Number(overrides.lat), Number(overrides.lon)]
    : (zone && state.zones[zone] ? state.zones[zone].center : (map ? [map.getCenter().lat, map.getCenter().lng] : [54.8, 7.55]));
  const normalizedType = normalizeAssetType(type || overrides.type || 'patrol_vessel');
  return {
    id: uniqueId(`asset-${state.assets.length + 1}`, existingIds),
    name: autoNameForAssetType(normalizedType, existingNames),
    type: normalizedType,
    affiliation: normalizeAssetAffiliation(overrides.affiliation || (isCommercialAssetType(normalizedType) ? 'neutral' : 'friend')),
    representation: normalizeAssetRepresentation(overrides.representation || (isCommercialAssetType(normalizedType) ? 'track' : 'unit')),
    status: overrides.status || 'available',
    zone,
    fuel: overrides.fuel != null ? clampPercent(overrides.fuel, 100) : defaultFuelForAssetType(normalizedType),
    fuelCapacity: overrides.fuelCapacity != null ? Math.max(1, Number(overrides.fuelCapacity)) : defaultFuelCapacityForAssetType(normalizedType),
    readiness: overrides.readiness != null ? clampPercent(overrides.readiness, defaultReadinessForAssetType(normalizedType)) : defaultReadinessForAssetType(normalizedType),
    assignedCell: overrides.assignedCell != null ? overrides.assignedCell : (isCommercialAssetType(normalizedType) ? '' : (state.session.cells[0]?.id || '')),
    lat: Number(Number(center[0]).toFixed(6)),
    lon: Number(Number(center[1]).toFixed(6)),
    heading: normalizeHeading(overrides.heading ?? (Math.random() * 360)),
    speed: normalizeSpeed(overrides.speed ?? (isCommercialAssetType(normalizedType) ? randomWithin(8, 18) : 12)),
    trackQuality: normalizeTrackQuality(overrides.trackQuality || (isCommercialAssetType(normalizedType) ? 'q3' : 'q2')),
    roleTags: Array.isArray(overrides.roleTags) ? clone(overrides.roleTags) : clone(modernPresetForType(normalizedType)?.roleTags || []),
    faction: overrides.faction != null ? overrides.faction : (modernPresetForType(normalizedType)?.faction || ''),
    classNotes: overrides.classNotes != null ? overrides.classNotes : (modernPresetForType(normalizedType)?.notes || ''),
    sensorProfile: Object.assign({}, modernPresetForType(normalizedType)?.sensorProfile || defaultSensorProfileForAssetType(normalizedType), overrides.sensorProfile || {}),
    waypoints: Array.isArray(overrides.waypoints) ? clone(overrides.waypoints) : []
  };
}

function duplicateSelectedAsset() {
  const source = state.assets.find(a => a.id === state.selectedAssetId);
  if (!source) {
    alert('Select an asset to duplicate.');
    return;
  }
  const copy = createAssetBase(source.type, Object.assign({}, source, {
    lat: Number(source.lat || 0) + 0.015,
    lon: Number(source.lon || 0) + 0.02,
    waypoints: Array.isArray(source.waypoints) ? source.waypoints.map(w => Object.assign({}, w)) : []
  }));
  copy.name = isCommercialAssetType(source.type)
    ? autoNameForAssetType(source.type, state.assets.map(a => a.name))
    : `${source.name || 'Asset'} Copy`;
  state.assets.push(copy);
  state.selectedAssetId = copy.id;
  saveState();
  renderAll();
  initMaps(true);
  if (map && Number.isFinite(copy.lat) && Number.isFinite(copy.lon)) {
    map.panTo([copy.lat, copy.lon]);
  }
  alert(`Duplicated asset: ${copy.name}`);
}

function autoPopulateCommercialTraffic() {
  const bounds = currentMapBounds();
  const count = Math.max(1, Math.min(40, Number(prompt('How many commercial vessels should OWGE add?', '12')) || 12));
  const pool = COMMERCIAL_ASSET_TYPES;
  const created = [];
  for (let i = 0; i < count; i += 1) {
    const type = pool[i % pool.length];
    const lat = randomWithin(bounds.south, bounds.north);
    const lon = randomWithin(bounds.west, bounds.east);
    const asset = createAssetBase(type, {
      lat, lon,
      zone: hasZones() ? nearestZone(lat, lon) : '',
      affiliation: Math.random() < 0.7 ? 'neutral' : (Math.random() < 0.5 ? 'unknown' : 'suspect'),
      representation: Math.random() < 0.75 ? 'track' : 'unit',
      heading: randomWithin(0, 359.9),
      speed: randomWithin(type === 'pilot_boat' || type === 'tug_workboat' ? 6 : 10, type === 'container_ship' || type === 'lng_carrier' || type === 'tanker' ? 19 : 16),
      trackQuality: ['q2','q3','q4'][Math.floor(Math.random()*3)]
    });
    state.assets.push(asset);
    created.push(asset);
  }
  state.selectedAssetId = created[created.length - 1]?.id || state.selectedAssetId || '';
  saveState();
  renderAll();
  initMaps(true);
  if (map && created.length) {
    const ll = created.map(a => [a.lat, a.lon]);
    map.fitBounds(ll, { padding: [32, 32], maxZoom: Math.max(8, map.getZoom()) });
  }
  alert(`Added ${created.length} commercial vessel${created.length === 1 ? '' : 's'} to the current map view.`);
}

function addModernAssetFromLibrary() {
  const select = document.getElementById('modernAssetLibrarySelect');
  if (!select?.value) {
    alert('Choose a modern naval class to add first.');
    return;
  }
  const preset = NAVAL_CLASS_LIBRARY.find(item => item.value === select.value);
  if (!preset) return;
  const asset = createAssetBase(preset.baseType || preset.value, {
    affiliation: preset.affiliation,
    assignedCell: preset.assignedCell || '',
    speed: preset.speed,
    readiness: preset.readiness,
    fuel: preset.fuel,
    fuelCapacity: preset.fuelCapacity,
    heading: preset.heading,
    sensorProfile: clone(preset.sensorProfile || {}),
    roleTags: clone(preset.roleTags || []),
    faction: preset.faction || '',
    classNotes: preset.notes || ''
  });
  asset.name = preset.label;
  asset.type = preset.value;
  asset.representation = isCommercialAssetType(asset.type) ? 'track' : 'unit';
  state.assets.push(asset);
  state.selectedAssetId = asset.id;
  saveState();
  renderAll();
  initMaps(true);
}

function onSelectedAssetTypeChanged() {
  const asset = state.assets.find(a => a.id === state.selectedAssetId);
  const typeEl = document.getElementById('assetType');
  const nameEl = document.getElementById('assetName');
  const fuelEl = document.getElementById('assetFuel');
  const readinessEl = document.getElementById('assetReadiness');
  if (!typeEl || !nameEl) return;
  const type = normalizeAssetType(typeEl.value);
  if (asset) asset.type = type;
  if (shouldAutoRenameAsset(nameEl.value)) {
    const taken = state.assets.filter(a => a.id !== state.selectedAssetId).map(a => a.name);
    nameEl.value = autoNameForAssetType(type, taken);
  }
  if (fuelEl && !String(fuelEl.value || '').trim()) fuelEl.value = defaultFuelForAssetType(type);
  if (readinessEl && !String(readinessEl.value || '').trim()) readinessEl.value = defaultReadinessForAssetType(type);
  if (asset) {
    const preset = modernPresetForType(type);
    asset.fuelCapacity = preset?.fuelCapacity || defaultFuelCapacityForAssetType(type);
    asset.roleTags = clone(preset?.roleTags || []);
    asset.faction = preset?.faction || asset.faction || '';
    asset.classNotes = preset?.notes || asset.classNotes || '';
    asset.sensorProfile = Object.assign({}, preset?.sensorProfile || defaultSensorProfileForAssetType(type));
  }
  renderModernAssetLibraryInfo();
}

function addAsset() {
  const asset = createAssetBase('patrol_vessel', {
    affiliation: 'friend',
    representation: 'unit',
    heading: 90,
    speed: 12,
    trackQuality: 'q2'
  });
  state.assets.push(asset);
  state.selectedAssetId = asset.id;
  saveState();
  renderAll();
  initMaps(true);
}

function selectAsset(assetId) {
  state.selectedAssetId = assetId;
  saveState();
  renderAssetEditor();
  renderAssets();
  renderFacilitatorMap();
}

function saveSelectedAssetProps() {
  const asset = state.assets.find(a => a.id === state.selectedAssetId);
  if (!asset) return;
  const requestedId = slugify(document.getElementById('assetId').value.trim()) || asset.id;
  if (requestedId !== asset.id && state.assets.some(a => a.id === requestedId)) {
    alert('Asset id already exists.');
    return;
  }
  asset.id = requestedId;
  asset.name = document.getElementById('assetName').value.trim() || asset.name;
  asset.type = normalizeAssetType(document.getElementById('assetType').value);
  asset.affiliation = normalizeAssetAffiliation(document.getElementById('assetAffiliation').value);
  asset.representation = normalizeAssetRepresentation(document.getElementById('assetRepresentation').value);
  asset.status = document.getElementById('assetStatus').value;
  asset.zone = document.getElementById('assetZone').value;
  asset.fuel = clampPercent(document.getElementById('assetFuel').value, defaultFuelForAssetType(asset.type));
  asset.readiness = clampPercent(document.getElementById('assetReadiness').value, defaultReadinessForAssetType(asset.type));
  asset.fuelCapacity = fuelCapacityForAsset(asset);
  asset.sensorProfile = Object.assign({}, defaultSensorProfileForAssetType(asset.type), asset.sensorProfile || {});
  asset.assignedCell = document.getElementById('assetAssignedCell').value;
  asset.trackQuality = normalizeTrackQuality(document.getElementById('assetTrackQuality').value);
  asset.heading = normalizeHeading(document.getElementById('assetHeading').value);
  asset.speed = normalizeSpeed(document.getElementById('assetSpeed').value);
  asset.lat = normalizeCoord(document.getElementById('assetLat').value);
  asset.lon = normalizeCoord(document.getElementById('assetLon').value);
  asset.waypoints = parseWaypointText(document.getElementById('assetWaypoints')?.value || '');
  state.selectedAssetId = asset.id;
  saveState();
  renderAll();
  initMaps(true);
}

function deleteSelectedAsset() {
  const id = state.selectedAssetId;
  if (!id) return;
  state.assets = state.assets.filter(a => a.id !== id);
  state.selectedAssetId = state.assets[0]?.id || '';
  saveState();
  renderAll();
  initMaps(true);
}

function nearestZone(lat, lon) {
  const ids = zoneIds();
  if (!ids.length) return '';
  let best = ids[0];
  let score = Infinity;
  ids.forEach(key => {
    const c = state.zones[key].center;
    const s = Math.pow(lat - c[0], 2) + Math.pow(lon - c[1], 2);
    if (s < score) {
      score = s;
      best = key;
    }
  });
  return best;
}

function assetDoctrineAbbrev(asset) {
  const map = {
    frigate: 'FFG',
    corvette: 'COR',
    patrol_vessel: 'OPV',
    submarine: 'SUB',
    amphibious_ship: 'AMPH',
    landing_craft: 'LC',
    auxiliary_ship: 'AUX',
    mine_warfare_vessel: 'MCM',
    maritime_helicopter: 'HELO',
    isr_drone: 'ISR',
    boarding_team: 'VBSS',
    port_support_unit: 'PORT',
    command_element: 'C2',
    container_ship: 'CONT',
    bulk_carrier: 'BULK',
    tanker: 'TNKR',
    lng_carrier: 'LNG',
    ro_ro_ferry: 'RORO',
    passenger_ferry: 'FERY',
    fishing_vessel: 'FISH',
    tug_workboat: 'TUG',
    dredger: 'DRDG',
    pilot_boat: 'PILOT',
    research_survey_vessel: 'SURV'
  };
  return map[normalizeAssetType(asset.type)] || 'UNIT';
}

function assetDoctrineProfile(asset) {
  const type = normalizeAssetType(asset.type);
  const map = {
    frigate: { short: 'FFG', code: 'ESC', role: 'Escort combatant' },
    corvette: { short: 'COR', code: 'LIT', role: 'Littoral combatant' },
    patrol_vessel: { short: 'OPV', code: 'PAT', role: 'Patrol' },
    submarine: { short: 'SSK', code: 'SUB', role: 'Subsurface' },
    amphibious_ship: { short: 'AMP', code: 'AMP', role: 'Amphibious' },
    landing_craft: { short: 'LC', code: 'LND', role: 'Landing craft' },
    auxiliary_ship: { short: 'AUX', code: 'LOG', role: 'Support / logistics' },
    mine_warfare_vessel: { short: 'MCM', code: 'MIW', role: 'Mine warfare' },
    maritime_helicopter: { short: 'HEL', code: 'AIR', role: 'Maritime helicopter' },
    isr_drone: { short: 'UAV', code: 'ISR', role: 'ISR drone' },
    boarding_team: { short: 'VBSS', code: 'BDT', role: 'Boarding team' },
    port_support_unit: { short: 'PORT', code: 'SUP', role: 'Port support' },
    command_element: { short: 'C2', code: 'CMD', role: 'Command' },
    container_ship: { short: 'CONT', code: 'COM', role: 'Container shipping' },
    bulk_carrier: { short: 'BULK', code: 'COM', role: 'Bulk carrier' },
    tanker: { short: 'TNKR', code: 'COM', role: 'Tanker' },
    lng_carrier: { short: 'LNG', code: 'COM', role: 'Gas carrier' },
    ro_ro_ferry: { short: 'RORO', code: 'COM', role: 'Ro-Ro ferry' },
    passenger_ferry: { short: 'FERY', code: 'COM', role: 'Passenger ferry' },
    fishing_vessel: { short: 'FISH', code: 'COM', role: 'Fishing vessel' },
    tug_workboat: { short: 'TUG', code: 'COM', role: 'Tug / workboat' },
    dredger: { short: 'DRDG', code: 'COM', role: 'Dredger' },
    pilot_boat: { short: 'PILOT', code: 'COM', role: 'Pilot boat' },
    research_survey_vessel: { short: 'SURV', code: 'COM', role: 'Research / survey' }
  };
  return map[type] || { short: 'UNIT', code: 'GEN', role: 'General' };
}


function assetDoctrineAffiliationCode(asset) {
  const aff = normalizeAssetAffiliation(asset.affiliation);
  if (aff === 'hostile') return 'H';
  if (aff === 'neutral') return 'N';
  if (aff === 'unknown') return 'U';
  if (aff === 'suspect') return 'S';
  if (aff === 'assumed_friend') return 'A';
  return 'F';
}

function assetDoctrineAffiliationMeta(asset) {
  const aff = normalizeAssetAffiliation(asset.affiliation);
  const map = {
    friend: {
      code: 'F',
      frame: '#60a5fa',
      fill: 'rgba(96,165,250,.08)',
      text: '#dbeafe',
      accent: '#bfdbfe',
      dash: '0'
    },
    assumed_friend: {
      code: 'A',
      frame: '#38bdf8',
      fill: 'rgba(56,189,248,.06)',
      text: '#e0f2fe',
      accent: '#7dd3fc',
      dash: '3 2'
    },
    neutral: {
      code: 'N',
      frame: '#34d399',
      fill: 'rgba(52,211,153,.07)',
      text: '#dcfce7',
      accent: '#86efac',
      dash: '0'
    },
    hostile: {
      code: 'H',
      frame: '#f87171',
      fill: 'rgba(248,113,113,.07)',
      text: '#fee2e2',
      accent: '#fca5a5',
      dash: '0'
    },
    suspect: {
      code: 'S',
      frame: '#fb923c',
      fill: 'rgba(251,146,60,.06)',
      text: '#ffedd5',
      accent: '#fdba74',
      dash: '2 2'
    },
    unknown: {
      code: 'U',
      frame: '#fbbf24',
      fill: 'rgba(251,191,36,.07)',
      text: '#fef3c7',
      accent: '#fde68a',
      dash: '5 3'
    }
  };
  return map[aff] || map.friend;
}

function assetDoctrineDomain(asset) {
  const type = normalizeAssetType(asset.type);
  if (type === 'submarine') return 'subsurface';
  if (type === 'maritime_helicopter' || type === 'isr_drone') return 'air';
  if (type === 'boarding_team' || type === 'port_support_unit' || type === 'command_element') return 'ground';
  return 'surface';
}

function assetDoctrineSidc(asset) {
  const domain = assetDoctrineDomain(asset);
  const aff = assetDoctrineAffiliationCode(asset);
  if (domain === 'subsurface') return `S${aff}U-------`;
  if (domain === 'air') return `S${aff}A-------`;
  if (domain === 'ground') return `S${aff}G-------`;
  return `S${aff}S-------`;
}

function assetDoctrineFrame(asset) {
  const domain = assetDoctrineDomain(asset);
  const meta = assetDoctrineAffiliationMeta(asset);
  if (domain === 'subsurface') return { color: meta.frame, fill: meta.fill, dash: meta.dash, path: 'M6 17 Q22 4 38 17 Q22 30 6 17 Z' };
  if (domain === 'air') return { color: meta.frame, fill: meta.fill, dash: meta.dash, path: 'M22 5 L39 17 L22 29 L5 17 Z' };
  if (domain === 'ground') return { color: meta.frame, fill: meta.fill, dash: meta.dash, path: 'M5 7 H39 V27 H5 Z' };
  return { color: meta.frame, fill: meta.fill, dash: meta.dash, path: 'M5 17 Q5 5 22 5 H39 Q39 17 39 17 Q39 29 22 29 H5 Q5 17 5 17 Z' };
}

function assetNtdsPalette(asset) {
  const aff = normalizeAssetAffiliation(asset.affiliation);
  if (aff === 'hostile') return { stroke: '#fecaca', fill: '#991b1b', chip: '#7f1d1d', text: '#fee2e2' };
  if (aff === 'neutral') return { stroke: '#bbf7d0', fill: '#166534', chip: '#14532d', text: '#dcfce7' };
  if (aff === 'unknown') return { stroke: '#fde68a', fill: '#a16207', chip: '#854d0e', text: '#fef3c7' };
  if (aff === 'suspect') return { stroke: '#fed7aa', fill: '#9a3412', chip: '#7c2d12', text: '#ffedd5' };
  if (aff === 'assumed_friend') return { stroke: '#c7d2fe', fill: '#4338ca', chip: '#312e81', text: '#e0e7ff' };
  return { stroke: '#bfdbfe', fill: '#1d4ed8', chip: '#1e3a8a', text: '#dbeafe' };
}

function assetNtdsGeometry(asset) {
  const domain = assetDoctrineDomain(asset);
  if (domain === 'subsurface') {
    return {
      path: 'M8 23 C12 14, 22 10, 34 10 C46 10, 56 14, 60 23 C56 32, 46 36, 34 36 C22 36, 12 32, 8 23 Z',
      accent: 'M18 23 H50',
      accent2: 'M24 18 H44'
    };
  }
  if (domain === 'air') {
    return {
      path: 'M34 8 L60 23 L34 38 L8 23 Z',
      accent: 'M18 23 H50',
      accent2: 'M34 13 V33'
    };
  }
  if (domain === 'ground') {
    return {
      path: 'M10 10 H58 V36 H10 Z',
      accent: 'M18 23 H50',
      accent2: 'M22 16 H46'
    };
  }
  return {
    path: 'M6 24 L18 12 H50 L62 24 L50 36 H18 Z',
    accent: 'M16 24 H52',
    accent2: 'M24 18 H44'
  };
}

function buildNtdsSvg(asset, selected) {
  const profile = assetDoctrineProfile(asset);
  const palette = assetNtdsPalette(asset);
  const geo = assetNtdsGeometry(asset);
  const aff = assetDoctrineAffiliationCode(asset);
  const representation = normalizeAssetRepresentation(asset.representation);
  const outline = selected ? '#f59e0b' : '#020617';
  const mainStrokeWidth = representation === 'track' ? 2.2 : 3.2;
  const dash = representation === 'track' ? '5 3' : '0';
  const fill = representation === 'track' ? 'rgba(2,6,23,0.10)' : palette.fill;
  const label = representation === 'track' ? 'TRK' : profile.short;
  const qualityText = trackQualityShort(asset.trackQuality);
  return `
    <svg width="76" height="58" viewBox="0 0 68 46" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="${geo.path}" fill="${fill}" stroke="${outline}" stroke-width="${mainStrokeWidth}" stroke-linejoin="round" stroke-dasharray="${dash}" />
      <path d="${geo.path}" fill="none" stroke="${palette.stroke}" stroke-width="1.5" stroke-linejoin="round" opacity=".95" stroke-dasharray="${dash}" />
      <path d="${geo.accent}" fill="none" stroke="${palette.stroke}" stroke-width="1.8" stroke-linecap="round" opacity=".9" />
      <path d="${geo.accent2}" fill="none" stroke="${palette.stroke}" stroke-width="1.3" stroke-linecap="round" opacity=".7" />
      <text x="34" y="27" text-anchor="middle" dominant-baseline="middle" font-size="${representation === 'track' ? '8.4' : '9.6'}" font-weight="800" fill="#f8fafc" letter-spacing=".4">${label}</text>
      <rect x="52" y="3" rx="5" ry="5" width="12" height="10" fill="#020617" opacity=".82"></rect>
      <text x="58" y="10.2" text-anchor="middle" font-size="6.2" font-weight="800" fill="${palette.stroke}">${aff}</text>
      <rect x="22" y="33" rx="6" ry="6" width="24" height="10" fill="#020617" opacity=".86" stroke="${palette.stroke}" stroke-width="1"></rect>
      <text x="34" y="40.2" text-anchor="middle" font-size="6.3" font-weight="800" fill="${palette.stroke}">${qualityText}</text>
    </svg>`;
}


function currentSymbolStyle() {
  return String(state?.scenario?.symbolStyle || 'ntds').toLowerCase();
}

function assetMinimalShape(asset) {
  const domain = assetDoctrineDomain(asset);
  if (domain === 'subsurface') return 'M8 24 C12 16, 22 12, 34 12 C46 12, 56 16, 60 24 C56 32, 46 36, 34 36 C22 36, 12 32, 8 24 Z';
  if (domain === 'air') return 'M34 8 L60 24 L34 40 L8 24 Z';
  if (domain === 'ground') return 'M10 10 H58 V38 H10 Z';
  return 'M8 22 L18 10 H50 L60 22 L50 34 H18 Z';
}

function buildMinimalSvg(asset, selected) {
  const palette = assetNtdsPalette(asset);
  const representation = normalizeAssetRepresentation(asset.representation);
  const stroke = selected ? '#f59e0b' : palette.stroke;
  const fill = representation === 'track' ? 'rgba(15,23,42,.04)' : palette.fill;
  const dash = representation === 'track' ? '5 3' : assetDoctrineAffiliationMeta(asset).dash;
  const label = representation === 'track' ? 'TRK' : assetDoctrineProfile(asset).short;
  const path = assetMinimalShape(asset);
  return `
    <svg width="64" height="48" viewBox="0 0 68 46" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="${path}" fill="${fill}" stroke="${stroke}" stroke-width="2.5" stroke-linejoin="round" stroke-dasharray="${dash}" />
      <text x="34" y="27" text-anchor="middle" dominant-baseline="middle" font-size="9" font-weight="800" fill="#f8fafc">${label}</text>
    </svg>`;
}

function commercialTypePalette(asset) {
  const type = normalizeAssetType(asset.type);
  const palettes = {
    container_ship: { stroke: '#22c55e', fill: '#052e16', accent: '#4ade80', label: 'CONT' },
    bulk_carrier: { stroke: '#84cc16', fill: '#1a2e05', accent: '#bef264', label: 'BULK' },
    tanker: { stroke: '#ef4444', fill: '#3b0a0a', accent: '#f87171', label: 'TNKR' },
    lng_carrier: { stroke: '#f97316', fill: '#3a1406', accent: '#fb923c', label: 'LNG' },
    ro_ro_ferry: { stroke: '#38bdf8', fill: '#082f49', accent: '#7dd3fc', label: 'RORO' },
    passenger_ferry: { stroke: '#3b82f6', fill: '#172554', accent: '#93c5fd', label: 'FERY' },
    fishing_vessel: { stroke: '#f59e0b', fill: '#3b2405', accent: '#fbbf24', label: 'FISH' },
    tug_workboat: { stroke: '#14b8a6', fill: '#042f2e', accent: '#5eead4', label: 'TUG' },
    dredger: { stroke: '#a78bfa', fill: '#2e1065', accent: '#c4b5fd', label: 'DRDG' },
    pilot_boat: { stroke: '#eab308', fill: '#3f2b05', accent: '#fde047', label: 'PLT' },
    research_survey_vessel: { stroke: '#06b6d4', fill: '#083344', accent: '#67e8f9', label: 'SURV' }
  };
  return palettes[type] || { stroke: '#64748b', fill: '#0f172a', accent: '#cbd5e1', label: 'SHIP' };
}

function commercialHullPath(type) {
  if (type === 'tug_workboat' || type === 'pilot_boat') return 'M10 27 L18 18 H36 L46 22 L58 22 L58 28 L12 32 Z';
  if (type === 'fishing_vessel') return 'M9 28 L18 18 H32 L42 21 L57 21 L57 29 L12 33 Z';
  if (type === 'passenger_ferry' || type === 'ro_ro_ferry') return 'M8 28 L16 16 H50 L60 21 L60 29 L12 33 Z';
  if (type === 'tanker' || type === 'lng_carrier') return 'M7 28 L15 19 H52 L61 23 L61 29 L11 33 Z';
  return 'M7 28 L17 18 H49 L61 24 L61 29 L11 33 Z';
}

function commercialBridgePath(type) {
  if (type === 'tanker' || type === 'lng_carrier') return 'M42 15 H52 V22 H42 Z';
  if (type === 'passenger_ferry' || type === 'ro_ro_ferry') return 'M20 13 H42 V20 H20 Z';
  if (type === 'tug_workboat' || type === 'pilot_boat') return 'M25 15 H37 V22 H25 Z';
  if (type === 'fishing_vessel') return 'M19 15 H30 V21 H19 Z';
  return 'M34 15 H48 V22 H34 Z';
}

function commercialDeckMarks(type) {
  if (type === 'container_ship') return '<path d="M22 20 H48 M22 24 H48" fill="none" stroke-width="1.5" stroke-linecap="round" opacity=".9" />';
  if (type === 'bulk_carrier') return '<path d="M20 22 H50" fill="none" stroke-width="1.7" stroke-linecap="round" opacity=".9" />';
  if (type === 'tanker' || type === 'lng_carrier') return '<path d="M18 23 H52" fill="none" stroke-width="1.5" stroke-linecap="round" opacity=".9" /><circle cx="24" cy="23" r="1.3" /><circle cx="32" cy="23" r="1.3" /><circle cx="40" cy="23" r="1.3" /><circle cx="48" cy="23" r="1.3" />';
  if (type === 'passenger_ferry' || type === 'ro_ro_ferry') return '<path d="M18 20 H48 M18 24 H48" fill="none" stroke-width="1.3" stroke-linecap="round" opacity=".9" />';
  if (type === 'fishing_vessel') return '<path d="M27 12 L35 22" fill="none" stroke-width="1.5" stroke-linecap="round" opacity=".9" /><path d="M35 22 L43 13" fill="none" stroke-width="1.5" stroke-linecap="round" opacity=".9" />';
  if (type === 'research_survey_vessel') return '<circle cx="23" cy="23" r="2.2" /><path d="M31 23 H46" fill="none" stroke-width="1.5" stroke-linecap="round" opacity=".9" />';
  if (type === 'dredger') return '<path d="M22 18 L16 26" fill="none" stroke-width="1.6" stroke-linecap="round" opacity=".9" /><path d="M45 18 L51 26" fill="none" stroke-width="1.6" stroke-linecap="round" opacity=".9" />';
  return '<path d="M20 23 H48" fill="none" stroke-width="1.5" stroke-linecap="round" opacity=".9" />';
}

function buildCommercialSvg(asset, selected) {
  const representation = normalizeAssetRepresentation(asset.representation);
  const type = normalizeAssetType(asset.type);
  const palette = commercialTypePalette(asset);
  const stroke = selected ? '#f59e0b' : palette.stroke;
  const fill = representation === 'track' ? 'rgba(15,23,42,.04)' : palette.fill;
  const dash = representation === 'track' ? '4 3' : '0';
  const label = representation === 'track' ? 'TRK' : palette.label;
  return `
    <svg width="72" height="50" viewBox="0 0 68 46" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="${commercialHullPath(type)}" fill="${fill}" stroke="${stroke}" stroke-width="2.3" stroke-linejoin="round" stroke-dasharray="${dash}" />
      <path d="${commercialBridgePath(type)}" fill="${representation === 'track' ? 'rgba(15,23,42,.02)' : fill}" stroke="${stroke}" stroke-width="1.8" stroke-linejoin="round" stroke-dasharray="${dash}" />
      <g stroke="${selected ? '#fef3c7' : palette.accent}" fill="${selected ? '#fef3c7' : palette.accent}">${commercialDeckMarks(type)}</g>
      <text x="34" y="39.5" text-anchor="middle" font-size="7.2" font-weight="800" fill="${selected ? '#fef3c7' : palette.accent}" letter-spacing=".5">${label}</text>
    </svg>`;
}

function app6Glyph(asset) {
  const type = normalizeAssetType(asset.type);
  const profile = assetDoctrineProfile(asset);
  if (type === 'submarine') return '<path d="M14 18 C18 14, 26 13, 30 18 C26 23, 18 22, 14 18 Z" fill="none" stroke-width="1.8" stroke-linejoin="round" />';
  if (type === 'maritime_helicopter') return '<circle cx="22" cy="18" r="4.8" fill="none" stroke-width="1.7" /><path d="M14 18 H30 M22 10 V26" fill="none" stroke-width="1.5" stroke-linecap="round" />';
  if (type === 'isr_drone') return '<path d="M10 18 H34 M22 12 V24" fill="none" stroke-width="1.5" stroke-linecap="round" /><path d="M14 15 L18 18 L14 21 M30 15 L26 18 L30 21" fill="none" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />';
  if (type === 'boarding_team') return '<path d="M12 12 L32 24 M32 12 L12 24" fill="none" stroke-width="1.8" stroke-linecap="round" />';
  if (type === 'command_element') return '<path d="M22 11 V25 M15 18 H29" fill="none" stroke-width="1.8" stroke-linecap="round" />';
  if (isCommercialAssetType(type)) return '<path d="M8 20 L13 14 H28 L35 19 L35 21 L10 24 Z" fill="none" stroke-width="1.7" stroke-linejoin="round" /><path d="M22 14 V10" fill="none" stroke-width="1.5" stroke-linecap="round" />';
  return `<text x="22" y="20.5" text-anchor="middle" dominant-baseline="middle" font-size="8.5" font-weight="800" letter-spacing=".3">${profile.short.slice(0, 3)}</text>`;
}

function buildApp6Svg(asset, selected) {
  const frame = assetDoctrineFrame(asset);
  const meta = assetDoctrineAffiliationMeta(asset);
  const representation = normalizeAssetRepresentation(asset.representation);
  const dash = representation === 'track' ? '5 3' : frame.dash;
  const glyphStroke = selected ? '#f59e0b' : meta.frame;
  const interiorFill = representation === 'track' ? 'rgba(15,23,42,.02)' : frame.fill;
  const label = representation === 'track' ? 'TRK' : assetDoctrineProfile(asset).short;
  const qualityText = trackQualityShort(asset.trackQuality);
  const statusBand = representation === 'track' ? `<path d="M8 29 H36" fill="none" stroke="${glyphStroke}" stroke-width="1.4" stroke-dasharray="3 2" stroke-linecap="round" opacity=".85" />` : '';
  return `
    <svg width="70" height="54" viewBox="0 0 44 34" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="${frame.path}" fill="${interiorFill}" stroke="${selected ? '#f59e0b' : frame.color}" stroke-width="2.5" stroke-linejoin="round" stroke-dasharray="${dash}" />
      <g transform="translate(0 0)" stroke="${glyphStroke}" fill="${glyphStroke}">${app6Glyph(asset)}</g>
      ${statusBand}
      <rect x="31" y="1.5" rx="4" ry="4" width="10" height="8" fill="#020617" opacity=".88" stroke="${selected ? '#f59e0b' : meta.frame}" stroke-width=".9"></rect>
      <text x="36" y="7.2" text-anchor="middle" font-size="5.6" font-weight="800" fill="${selected ? '#fef3c7' : meta.text}">${meta.code}</text>
      <text x="22" y="31.2" text-anchor="middle" font-size="6.2" font-weight="800" fill="${selected ? '#f59e0b' : meta.frame}" letter-spacing=".25">${label}</text>
      <text x="4.5" y="7.5" text-anchor="start" font-size="4.8" font-weight="800" fill="${selected ? '#f59e0b' : meta.frame}">${qualityText}</text>
    </svg>`;
}

function assetIcon(asset) {
  const selected = state.selectedAssetId === asset.id;
  const profile = assetDoctrineProfile(asset);
  const palette = assetNtdsPalette(asset);
  const representation = normalizeAssetRepresentation(asset.representation);
  const styleMode = currentSymbolStyle();
  let svg = buildNtdsSvg(asset, selected);
  let className = 'ntds-div-icon';
  if (styleMode === 'app6' || styleMode === 'app-6' || styleMode === 'app6_nato') {
    svg = buildApp6Svg(asset, selected);
    className = 'app6-div-icon';
  } else if (styleMode === 'minimal') {
    svg = buildMinimalSvg(asset, selected);
    className = 'minimal-div-icon';
  } else if (styleMode === 'commercial') {
    svg = buildCommercialSvg(asset, selected);
    className = 'commercial-div-icon';
  }
  const html = `<div class="ntds-marker-wrap ntds-${representation} symbol-${styleMode}"><div class="ntds-symbol-shell">${svg}</div><div class="ntds-asset-name" style="border-color:${palette.stroke}; background:${palette.chip}; color:${palette.text};">${asset.name}</div><div class="ntds-asset-meta">${assetRepresentationLabel(representation)} · ${profile.role} · ${assetAffiliationLabel(asset.affiliation)} · ${trackQualityShort(asset.trackQuality)}</div></div>`;
  return L.divIcon({ className, html, iconSize: [118, 92], iconAnchor: [59, 24], popupAnchor: [0, -24] });
}

function assetLatLng(asset, idx) {
  const explicitLat = normalizeCoord(asset?.lat);
  const explicitLon = normalizeCoord(asset?.lon);
  if (explicitLat != null && explicitLon != null) return [explicitLat, explicitLon];
  if (asset.zone && state.zones[asset.zone]) return zoneOffsetLatLng(asset.zone, idx + 1);
  return [54.8 + (idx % 3) * 0.04, 7.2 + (idx % 4) * 0.06];
}

function distanceNmBetween(lat1, lon1, lat2, lon2) {
  const meanLat = ((lat1 + lat2) / 2) * Math.PI / 180;
  const dLatNm = (lat2 - lat1) * 60;
  const dLonNm = (lon2 - lon1) * 60 * Math.cos(meanLat);
  return Math.sqrt(dLatNm * dLatNm + dLonNm * dLonNm);
}

function bearingBetween(lat1, lon1, lat2, lon2) {
  const dLon = (lon2 - lon1) * Math.cos(((lat1 + lat2) / 2) * Math.PI / 180);
  const dLat = (lat2 - lat1);
  const angle = Math.atan2(dLon, dLat) * 180 / Math.PI;
  return normalizeHeading(angle);
}

function courseVectorLatLngs(asset, idx) {
  const origin = assetLatLng(asset, idx);
  const waypoint = Array.isArray(asset.waypoints) && asset.waypoints.length ? asset.waypoints[0] : null;
  const heading = waypoint ? bearingBetween(origin[0], origin[1], waypoint.lat, waypoint.lon) : normalizeHeading(asset.heading);
  const speed = Math.max(0, normalizeSpeed(asset.speed));
  const distanceNm = waypoint ? Math.max(1.2, Math.min(12, distanceNmBetween(origin[0], origin[1], waypoint.lat, waypoint.lon))) : Math.max(1.2, Math.min(12, speed * 0.22 + (normalizeAssetRepresentation(asset.representation) === 'track' ? 1.2 : 0)));
  return [origin, destinationLatLon(origin[0], origin[1], heading, distanceNm)];
}

function destinationLatLon(lat, lon, heading, distanceNm) {
  const radians = normalizeHeading(heading) * Math.PI / 180;
  const dLat = (distanceNm * Math.cos(radians)) / 60;
  const lonScale = Math.cos(lat * Math.PI / 180) || 0.00001;
  const dLon = (distanceNm * Math.sin(radians)) / (60 * lonScale);
  return [lat + dLat, lon + dLon];
}

function projectMovement(asset, origin, distanceNm) {
  let remaining = Math.max(0, Number(distanceNm || 0));
  let current = [origin[0], origin[1]];
  let heading = normalizeHeading(asset.heading);
  let consumedWaypoints = 0;
  const queue = Array.isArray(asset.waypoints) ? asset.waypoints.map(w => ({ lat: normalizeCoord(w.lat), lon: normalizeCoord(w.lon), label: String(w.label || '') })).filter(w => w.lat != null && w.lon != null) : [];
  while (remaining > 0 && queue.length) {
    const wp = queue[0];
    const legDistance = distanceNmBetween(current[0], current[1], wp.lat, wp.lon);
    heading = bearingBetween(current[0], current[1], wp.lat, wp.lon);
    if (legDistance <= remaining + 0.0001) {
      current = [wp.lat, wp.lon];
      remaining -= legDistance;
      queue.shift();
      consumedWaypoints += 1;
    } else {
      current = destinationLatLon(current[0], current[1], heading, remaining);
      remaining = 0;
    }
  }
  if (remaining > 0) {
    current = destinationLatLon(current[0], current[1], heading, remaining);
  }
  if (queue.length) heading = bearingBetween(current[0], current[1], queue[0].lat, queue[0].lon);
  return { destination: current, heading, remainingWaypoints: queue, consumedWaypoints };
}

function advanceTimeLabel(currentLabel, hours) {
  const match = /^H([+-])(\d+(?:\.\d+)?)$/.exec(String(currentLabel || 'H+0').trim());
  let val = 0;
  if (match) val = (match[1] === '-' ? -1 : 1) * Number(match[2] || 0);
  val += hours;
  const sign = val >= 0 ? '+' : '-';
  const abs = Math.abs(val);
  const rounded = Math.round(abs * 100) / 100;
  return `H${sign}${Number.isInteger(rounded) ? rounded.toFixed(0) : rounded}`;
}

function movementDistanceNm(asset, hours) {
  return Math.max(0, normalizeSpeed(asset.speed)) * Math.max(0, Number(hours || 0));
}

function lerp(a, b, t) {
  return a + (b - a) * Math.max(0, Math.min(1, Number(t || 0)));
}

function fuelBurnRatePerHour(speed) {
  const s = Math.max(0, Number(speed || 0));
  if (s <= 0) return 0.04;
  if (s <= 10) return 0.10;
  if (s <= 18) return 0.10 + ((s - 10) / 8) * 0.04;
  if (s <= 24) return 0.14 + ((s - 18) / 6) * 0.08;
  if (s <= 30) return 0.22 + ((s - 24) / 6) * 0.08;
  return Math.min(0.45, 0.30 + ((s - 30) * 0.02));
}

function fuelProfileLabel(speed) {
  const s = Math.max(0, Number(speed || 0));
  if (s <= 0.1) return 'idle';
  if (s < 10) return 'slow / inefficient';
  if (s <= 18) return s === 18 ? 'cruise optimum' : 'economical';
  if (s <= 24) return 'fast cruise';
  if (s <= 30) return 'high speed / inefficient';
  return 'overstress';
}

function fuelPlanForTurn(asset, hours) {
  const requestedHours = Math.max(0, Number(hours || 0));
  const availableFuel = clampPercent(asset?.fuel, 100);
  const speed = Math.max(0, normalizeSpeed(asset?.speed));
  const burnRateUnits = fuelBurnRatePerHour(speed);
  const capacity = fuelCapacityForAsset(asset);
  const burnRate = capacity > 0 ? (burnRateUnits / capacity) * 100 : burnRateUnits;
  const maxHoursByFuel = burnRate > 0 ? (availableFuel / burnRate) : requestedHours;
  const effectiveHours = Math.max(0, Math.min(requestedHours, maxHoursByFuel));
  const fuelUsed = Math.min(availableFuel, burnRate * effectiveHours);
  const fuelRemaining = Math.max(0, availableFuel - fuelUsed);
  const limitedByFuel = effectiveHours + 1e-6 < requestedHours;
  return { requestedHours, effectiveHours, burnRate, fuelUsed, fuelRemaining, limitedByFuel, profile: fuelProfileLabel(speed), capacity };
}

function movementPreviewRows() {
  const previousLabel = state.scenario.timeLabel || 'H+0';
  const hours = Math.max(0.25, Math.min(24, Number(state.scenario.turnDurationHours || 1) || 1));
  return state.assets.map((asset, idx) => {
    const origin = assetLatLng(asset, idx);
    const holdActive = Number(asset.boardingHoldUntilTurn || 0) >= Number(state.scenario.turn || 1);
    const simAsset = holdActive ? Object.assign({}, asset, { speed: 0 }) : asset;
    const fuelPlan = fuelPlanForTurn(simAsset, hours);
    const distanceNm = movementDistanceNm(simAsset, fuelPlan.effectiveHours);
    const movement = distanceNm > 0 ? projectMovement(simAsset, origin, distanceNm) : { destination: origin, heading: normalizeHeading(asset.heading), remainingWaypoints: Array.isArray(asset.waypoints) ? clone(asset.waypoints) : [], consumedWaypoints: 0 };
    const destination = movement.destination;
    return { asset, origin, destination, distanceNm, zone: hasZones() ? nearestZone(destination[0], destination[1]) : asset.zone || '', movement, fuelPlan, holdActive };
  });
}

function previewNextTurnMovement() {
  const rows = movementPreviewRows();
  if (!rows.length) {
    alert('No assets available to preview. Add one or more assets first.');
    return;
  }
  const previousLabel = state.scenario.timeLabel || 'H+0';
  const hours = Math.max(0.25, Math.min(24, Number(state.scenario.turnDurationHours || 1) || 1));
  const lines = rows.slice(0, 10).map(r => `${r.asset.name}: ${r.distanceNm.toFixed(1)} nm ${r.movement.consumedWaypoints ? `via ${r.movement.consumedWaypoints} WP` : `on ${normalizeHeading(r.movement.heading)}°`} to ${r.destination[0].toFixed(4)}, ${r.destination[1].toFixed(4)}${r.zone ? ` (${prettyZone(r.zone)})` : ''}${r.movement.remainingWaypoints[0] ? ` · next ${r.movement.remainingWaypoints[0].label || 'WP'}` : ''} · fuel ${r.fuelPlan.fuelUsed.toFixed(1)}% used / ${r.fuelPlan.fuelRemaining.toFixed(1)}% left @ ${r.fuelPlan.burnRate.toFixed(1)}%/h${r.fuelPlan.limitedByFuel ? ' · fuel-limited' : ''}`);
  alert(`Movement preview for next turn (${hours}h):\n\n${lines.join('\n')}${rows.length > 10 ? `\n...and ${rows.length - 10} more asset(s)` : ''}`);
}

function formatTurnDuration(hours) {
  const val = Math.max(0.25, Math.min(24, Number(hours || 1) || 1));
  if (val < 1) return `${Math.round(val * 60)} min / turn`;
  const rounded = Math.round(val * 100) / 100;
  return `${Number.isInteger(rounded) ? rounded.toFixed(0) : rounded} h / turn`;
}

function pushTurnSnapshot() {
  const snapshot = clone({
    scenario: state.scenario,
    assets: state.assets,
    zones: state.zones,
    selectedAssetId: state.selectedAssetId,
    selectedZoneId: state.selectedZoneId,
    timeline: state.timeline,
    releasedInjects: state.releasedInjects,
    playerFeedByCell: state.playerFeedByCell,
    actionLogByCell: state.actionLogByCell,
    boardingRequests: state.boardingRequests
  });
  state.turnHistory = Array.isArray(state.turnHistory) ? state.turnHistory : [];
  state.turnHistory.push(snapshot);
  if (state.turnHistory.length > 12) state.turnHistory = state.turnHistory.slice(-12);
  state.turnFuture = [];
}

function restorePreviousTurn() {
  const previousLabel = state.scenario.timeLabel || 'H+0';
  state.turnHistory = Array.isArray(state.turnHistory) ? state.turnHistory : [];
  if (!state.turnHistory.length) {
    alert('No previous resolved turn snapshot is available yet.');
    return;
  }
  const current = clone({
    scenario: state.scenario,
    assets: state.assets,
    zones: state.zones,
    selectedAssetId: state.selectedAssetId,
    selectedZoneId: state.selectedZoneId,
    timeline: state.timeline,
    releasedInjects: state.releasedInjects,
    playerFeedByCell: state.playerFeedByCell,
    actionLogByCell: state.actionLogByCell,
    boardingRequests: state.boardingRequests
  });
  state.turnFuture = Array.isArray(state.turnFuture) ? state.turnFuture : [];
  state.turnFuture.push(current);
  const snapshot = state.turnHistory.pop();
  state.scenario = Object.assign(state.scenario, snapshot.scenario || {});
  state.assets = clone(snapshot.assets || []);
  state.zones = clone(snapshot.zones || {});
  state.selectedAssetId = snapshot.selectedAssetId || state.assets[0]?.id || '';
  state.selectedZoneId = snapshot.selectedZoneId || Object.keys(state.zones)[0] || '';
  state.timeline = clone(snapshot.timeline || []);
  state.releasedInjects = clone(snapshot.releasedInjects || []);
  state.playerFeedByCell = clone(snapshot.playerFeedByCell || {});
  state.actionLogByCell = clone(snapshot.actionLogByCell || {});
  state.boardingRequests = clone(snapshot.boardingRequests || []);
  ensureSessionMaps();
  saveState();
  maybeSendRoutineStatusUpdates(previousLabel, state.scenario.timeLabel || previousLabel);
  renderAll();
  initMaps(true);
}

function advanceSimulationTurn() {
  releaseExpiredBoardingHolds();
  const rows = movementPreviewRows();
  if (!rows.length) {
    alert('No assets available to move. Add one or more assets first.');
    return;
  }
  const previousLabel = state.scenario.timeLabel || 'H+0';
  const hours = Math.max(0.25, Math.min(24, Number(state.scenario.turnDurationHours || 1) || 1));
  pushTurnSnapshot();
  const moved = [];
  const updates = new Map();
  rows.forEach(r => {
    const updated = Object.assign({}, r.asset, {
      lat: Number(r.destination[0].toFixed(6)),
      lon: Number(r.destination[1].toFixed(6)),
      heading: normalizeHeading(r.movement.heading),
      waypoints: r.movement.remainingWaypoints,
      fuel: Number(r.fuelPlan.fuelRemaining.toFixed(1))
    });
    if (r.zone) updated.zone = r.zone;
    updates.set(updated.id, updated);
    moved.push(`${updated.name} ${r.distanceNm.toFixed(1)} nm to ${r.destination[0].toFixed(3)}, ${r.destination[1].toFixed(3)}${r.holdActive ? ' · boarding hold / 0 kt' : ''}${r.movement.consumedWaypoints ? ` via ${r.movement.consumedWaypoints} WP` : ''} · fuel ${r.fuelPlan.fuelUsed.toFixed(1)}% used / ${r.fuelPlan.fuelRemaining.toFixed(1)}% left${r.fuelPlan.limitedByFuel ? ' · fuel-limited' : ''}`);
  });
  state.assets = state.assets.map(a => updates.get(a.id) || a);
  state.scenario.turn = Number(state.scenario.turn || 1) + 1;
  state.scenario.timeLabel = advanceTimeLabel(state.scenario.timeLabel, hours);
  const visualConfirms = runVisualConfirmation();
  state.timeline.push({
    time: state.scenario.timeLabel,
    text: `Resolved movement for ${rows.length} asset(s) over ${hours} hour(s). ${moved.slice(0,3).join('; ')}${moved.length > 3 ? '; ...' : ''}${visualConfirms.length ? ` · ${visualConfirms.slice(0,2).join('; ')}` : ''}`
  });
  if (visualConfirms.length) state.releasedInjects = visualConfirms.map((t, i) => ({ id: `AUTO-CONF-${i+1}`, title: 'Automatic visual confirmation', situation: t }));
  saveState();
  maybeSendRoutineStatusUpdates(previousLabel, state.scenario.timeLabel || previousLabel);
  renderAll();
  initMaps(true);
}


function trackQualityStyle(asset) {
  const q = normalizeTrackQuality(asset.trackQuality);
  const map = {
    q1: { opacity: 0.95, weight: 3.2, dashArray: null },
    q2: { opacity: 0.85, weight: 2.8, dashArray: '8 4' },
    q3: { opacity: 0.72, weight: 2.4, dashArray: '6 5' },
    q4: { opacity: 0.6, weight: 2.1, dashArray: '4 6' },
    q5: { opacity: 0.45, weight: 1.8, dashArray: '2 7' }
  };
  return map[q] || map.q2;
}

function measurementStateFor(target) {
  return target === 'player' ? playerMeasure : facilitatorMeasure;
}

function measurementLabel(start, end) {
  const nm = distanceNmBetween(start.lat, start.lng, end.lat, end.lng);
  return `${nm.toFixed(2)} nm`;
}

function measurementStatusText(target) {
  const st = measurementStateFor(target);
  if (st.start && st.end) return `${measurementLabel(st.start, st.end)} · measured`;
  if (st.start) return 'Click an end point on the map';
  if (st.active) return 'Click a start point on the map';
  return 'Off';
}

function toggleMeasurementMode(target) {
  const st = measurementStateFor(target);
  if (st.active) {
    setMeasurementActive(target, false);
  } else {
    clearMeasurement(target);
    setMeasurementActive(target, true);
  }
}

function clearMeasurement(target) {
  const st = measurementStateFor(target);
  const activeMap = target === 'player' ? playerMap : map;
  if (st.line && activeMap) activeMap.removeLayer(st.line);
  if (st.tooltip && activeMap) activeMap.removeLayer(st.tooltip);
  st.line = null;
  st.tooltip = null;
  st.start = null;
  st.end = null;
  updateMeasurementControl(target);
}

function setMeasurementActive(target, active) {
  const st = measurementStateFor(target);
  st.active = !!active;
  if (!st.active) {
    clearMeasurement(target);
    return;
  }
  updateMeasurementControl(target);
}

function updateMeasurementOverlay(target) {
  const st = measurementStateFor(target);
  const activeMap = target === 'player' ? playerMap : map;
  if (!activeMap || !st.start || !st.end) return;
  if (st.line) activeMap.removeLayer(st.line);
  if (st.tooltip) activeMap.removeLayer(st.tooltip);
  st.line = L.polyline([[st.start.lat, st.start.lng], [st.end.lat, st.end.lng]], {
    color: '#f59e0b',
    weight: 3,
    opacity: 0.95,
    dashArray: '8 6'
  }).addTo(activeMap);
  const mid = L.latLng((st.start.lat + st.end.lat) / 2, (st.start.lng + st.end.lng) / 2);
  st.tooltip = L.marker(mid, {
    interactive: false,
    icon: L.divIcon({
      className: 'measure-label',
      html: `<div>${measurementLabel(st.start, st.end)}</div>`,
      iconSize: [96, 28],
      iconAnchor: [48, 14]
    })
  }).addTo(activeMap);
}

function updateMeasurementControl(target) {
  const st = measurementStateFor(target);
  const button = document.getElementById(target === 'player' ? 'measurePlayerBtn' : 'measureFacBtn');
  const clearBtn = document.getElementById(target === 'player' ? 'clearMeasurePlayerBtn' : 'clearMeasureFacBtn');
  const status = document.getElementById(target === 'player' ? 'measurePlayerStatus' : 'measureFacStatus');
  if (button) button.textContent = st.active ? 'Cancel Measure' : 'Measure';
  if (button) button.className = st.active ? 'secondary active-tool-btn' : 'secondary';
  if (clearBtn) clearBtn.disabled = !(st.start || st.end || st.line || st.tooltip);
  if (status) status.textContent = measurementStatusText(target);
}


function handleMeasurementClick(target, latlng) {
  const st = measurementStateFor(target);
  if (!st.active) return false;
  if (!st.start) {
    st.start = latlng;
    st.end = null;
    updateMeasurementControl(target);
    return true;
  }
  st.end = latlng;
  st.active = false;
  updateMeasurementOverlay(target);
  updateMeasurementControl(target);
  return true;
}

function handleMeasurementMove(target, latlng) {
  const st = measurementStateFor(target);
  if (!st.active || !st.start) return;
  updateMeasurementControl(target);
}

function clearLayers(arr, target) {
  if (!target) return;
  arr.forEach(l => target.removeLayer(l));
  arr.length = 0;
}

function zoneOffsetLatLng(zoneId, index) {
  const ids = zoneIds();
  const fallback = ids[0] ? state.zones[ids[0]].center : [54.8, 7.55];
  const center = state.zones[zoneId]?.center || fallback;
  const row = index % 3;
  const col = Math.floor(index / 3) % 3;
  return [center[0] + (row - 1) * 0.03, center[1] + (col - 1) * 0.04];
}

function initMaps(force) {
  const facEl = document.getElementById('map');
  const playEl = document.getElementById('playerMap');
  if (force && map) { map.remove(); map = null; }
  if (force && playerMap) { playerMap.remove(); playerMap = null; }
  if (facEl) {
    const initialView = getInitialMapView();
    map = L.map('map').setView(initialView.center, initialView.zoom);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 12, attribution: '&copy; OpenStreetMap contributors' }).addTo(map);
    seaLayer = L.tileLayer('https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png', { maxZoom: 12, attribution: '&copy; OpenSeaMap contributors' });
    if ((state.scenario.overlayMode || 'openseamap') === 'openseamap') seaLayer.addTo(map);
    map.on('click', e => {
      if (handleMeasurementClick('facilitator', e.latlng)) return;
      if (state.mapMode === 'add-zone') {
        createZoneAt(e.latlng);
        return;
      }
      if (state.mapMode === 'add-waypoint') {
        appendWaypointToSelectedAsset(e.latlng);
      }
    });
    map.on('mousemove', e => {
      lastHoveredLatLng = e.latlng;
      handleMeasurementMove('facilitator', e.latlng);
      if (state.mapMode === 'add-waypoint') updateWaypointUi();
    });
    map.on('moveend', () => persistLastMapView(map));
    renderFacilitatorMap();
  }
  if (playEl) {
    const playerInitialView = getInitialMapView();
    playerMap = L.map('playerMap').setView(playerInitialView.center, playerInitialView.zoom);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 12, attribution: '&copy; OpenStreetMap contributors' }).addTo(playerMap);
    playerSeaLayer = L.tileLayer('https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png', { maxZoom: 12, attribution: '&copy; OpenSeaMap contributors' });
    if ((state.scenario.overlayMode || 'openseamap') === 'openseamap') playerSeaLayer.addTo(playerMap);
    playerMap.on('click', e => {
      if (handleMeasurementClick('player', e.latlng)) return;
      if (playerMapMode === 'add-waypoint') appendWaypointToPlayerAsset(e.latlng);
    });
    playerMap.on('mousemove', e => {
      playerLastHoveredLatLng = e.latlng;
      handleMeasurementMove('player', e.latlng);
      if (playerMapMode === 'add-waypoint') updatePlayerWaypointUi();
    });
    renderPlayerMap();
  }
}

function renderFacilitatorMap() {
  if (!map) return;
  clearLayers(zoneLayers, map);
  clearLayers(zoneCenterLayers, map);
  clearLayers(assetLayers, map);
  clearLayers(waypointGuideLayers, map);
  zoneIds().forEach(key => {
    const z = state.zones[key];
    const st = zoneStyle(z.kind);
    const selected = key === state.selectedZoneId;
    const circle = L.circle(z.center, {
      radius: z.radius,
      color: selected ? '#f59e0b' : st.color,
      fillColor: st.fillColor,
      fillOpacity: st.fillOpacity,
      weight: selected ? 3 : 2
    }).addTo(map);
    circle.on('click', (ev) => {
      L.DomEvent.stopPropagation(ev);
      selectZone(key);
    });
    circle.bindTooltip(`${z.name} (${key})`);
    zoneLayers.push(circle);

    const center = L.marker(z.center, { draggable: true, opacity: 0.9 }).addTo(map);
    center.on('click', (ev) => {
      L.DomEvent.stopPropagation(ev);
      selectZone(key);
    });
    center.on('drag', (e) => {
      state.zones[key].center = [e.latlng.lat, e.latlng.lng];
      saveState();
      renderZoneEditor();
      renderFacilitatorMap();
    });
    zoneCenterLayers.push(center);
  });

  // Cell map badges intentionally hidden on the facilitator map.
  // Cells are managed from the Scenario tab and still keep their stored map positions,
  // but their floating name pills are not rendered on the battlespace.

  const selected = selectedAsset();
  if (selected) {
    const assetOrigin = assetLatLng(selected, state.assets.findIndex(a => a.id === selected.id));
    renderWaypointGuide(map, waypointGuideLayers, selected, assetOrigin, true, () => { saveState(); renderAll(); initMaps(true); updateWaypointUi(`Updated waypoint for ${selected.name}.`); });
  }

  state.assets.forEach((a, idx) => {
    const ll = assetLatLng(a, idx);
    const vector = courseVectorLatLngs(a, idx);
    const palette = assetNtdsPalette(a);
    const vectorStyle = trackQualityStyle(a);
    const vectorLine = L.polyline(vector, {
      color: palette.stroke,
      weight: vectorStyle.weight,
      opacity: vectorStyle.opacity,
      dashArray: vectorStyle.dashArray,
      lineCap: 'round'
    }).addTo(map);
    assetLayers.push(vectorLine);
    const marker = L.marker(ll, { icon: assetIcon(a), draggable: true, title: a.name }).addTo(map);
    marker.bindPopup('<strong>' + a.name + '</strong><br>Display: ' + assetRepresentationLabel(a.representation) + '<br>Type: ' + assetTypeLabel(a.type) + '<br>Affiliation: ' + assetAffiliationLabel(a.affiliation) + '<br>Track quality: ' + trackQualityLabel(a.trackQuality) + '<br>Heading: ' + normalizeHeading(a.heading) + '&deg;<br>Speed: ' + normalizeSpeed(a.speed) + ' kt<br>Fuel: ' + fuelPercentLabel(a) + ' (' + fuelCapacityForAsset(a).toFixed(0) + 'u cap)<br>Readiness: ' + readinessPercentLabel(a) + '<br>Waypoints: ' + waypointSummary(a) + '<br>Zone: ' + prettyZone(a.zone) + '<br>Group: ' + assetOwningGroupLabel(a));
    marker.on('click', (ev) => { if (ev?.originalEvent) L.DomEvent.stopPropagation(ev.originalEvent); selectAsset(a.id); });
    marker.on('dragend', e => {
      const p = e.target.getLatLng();
      a.lat = Number(p.lat.toFixed(6));
      a.lon = Number(p.lng.toFixed(6));
      if (hasZones()) a.zone = nearestZone(p.lat, p.lng);
      saveState();
      renderAll();
      initMaps(true);
      updateWaypointUi(`Moved ${a.name} to ${a.lat.toFixed(4)}, ${a.lon.toFixed(4)}.`);
    });
    assetLayers.push(marker);
  });
}

function renderPlayerMap() {
  if (!playerMap) return;
  clearLayers(playerZoneLayers, playerMap);
  clearLayers(playerAssetLayers, playerMap);
  const cellId = getPlayerCell();
  zoneIds().forEach(key => {
    const z = state.zones[key];
    const st = zoneStyle(z.kind);
    const circle = L.circle(z.center, { radius: z.radius, color: st.color, fillColor: st.fillColor, fillOpacity: st.fillOpacity, weight: 2 }).addTo(playerMap);
    circle.bindTooltip(z.name);
    playerZoneLayers.push(circle);
  });
  const selected = selectedPlayerAsset();
  if (selected) {
    const idx = state.assets.findIndex(a => a.id === selected.id);
    const assetOrigin = assetLatLng(selected, idx);
    renderWaypointGuide(playerMap, playerAssetLayers, selected, assetOrigin, true, () => { saveState(); renderPlayerPage(); updatePlayerWaypointUi(`Updated waypoint for ${selected.name}.`); });
  }
  state.assets.forEach((a, idx) => {
    const ll = assetLatLng(a, idx);
    const vector = courseVectorLatLngs(a, idx);
    const palette = assetNtdsPalette(a);
    const vectorStyle = trackQualityStyle(a);
    const vectorLine = L.polyline(vector, {
      color: palette.stroke,
      weight: vectorStyle.weight,
      opacity: Math.max(0.35, vectorStyle.opacity - 0.1),
      dashArray: vectorStyle.dashArray,
      lineCap: 'round'
    }).addTo(playerMap);
    playerAssetLayers.push(vectorLine);
    const isOwn = a.assignedCell === cellId;
    const canControl = isOwn && !isCommercialAssetType(a.type) && normalizeAssetAffiliation(a.affiliation) !== 'neutral';
    const marker = L.marker(ll, { icon: assetIcon(a), title: a.name, draggable: canControl }).addTo(playerMap);
    marker.bindPopup('<strong>' + a.name + '</strong><br>Display: ' + assetRepresentationLabel(a.representation) + '<br>Type: ' + assetTypeLabel(a.type) + '<br>Affiliation: ' + assetAffiliationLabel(a.affiliation) + '<br>Track quality: ' + trackQualityLabel(a.trackQuality) + '<br>Heading: ' + normalizeHeading(a.heading) + '&deg;<br>Speed: ' + normalizeSpeed(a.speed) + ' kt<br>Fuel: ' + fuelPercentLabel(a) + ' (' + fuelCapacityForAsset(a).toFixed(0) + 'u cap)<br>Readiness: ' + readinessPercentLabel(a) + '<br>Waypoints: ' + waypointSummary(a) + '<br>Zone: ' + prettyZone(a.zone) + '<br>Group: ' + assetOwningGroupLabel(a));
    if (canControl) {
      marker.on('click', () => selectPlayerAsset(a.id));
      marker.on('dragend', e => {
        const p = e.target.getLatLng();
        a.lat = Number(p.lat.toFixed(6));
        a.lon = Number(p.lng.toFixed(6));
        if (hasZones()) a.zone = nearestZone(p.lat, p.lng);
        saveState();
        updatePlayerWaypointUi(`Moved ${a.name} to ${a.lat.toFixed(4)}, ${a.lon.toFixed(4)}.`);
        renderPlayerPage();
      });
    }
    playerAssetLayers.push(marker);
  });
}

function renderGlobalStatusBadge() {
  const nodes = Array.from(document.querySelectorAll('#turnCounterBadge'));
  if (!nodes.length) return;
  const turn = Number(state?.scenario?.turn || 1);
  const timeLabel = state?.scenario?.timeLabel || 'H+0';
  const duration = Number(state?.scenario?.turnDurationHours || 1);
  nodes.forEach(node => {
    node.innerHTML = `<div class="turn-badge-turn">Turn ${turn}</div><div class="turn-badge-time">${timeLabel}</div><div class="turn-badge-meta">${formatTurnDuration(duration)}</div>`;
  });
}

function renderScenario() {
  const el = document.getElementById('scenarioPanel');
  if (!el) return;
  const pinned = normalizeMapView(state.scenario.pinnedMapView);
  const remembered = normalizeMapView(state.scenario.lastMapView);
  el.innerHTML = `
    <div><strong>${state.scenario.name}</strong></div>
    <div class="small" style="margin-top:6px">${state.scenario.overview}</div>
    <div class="row" style="margin-top:10px">
      <span class="tag">Zones: ${zoneIds().length}</span>
      <span class="tag">Assets: ${state.assets.length}</span>
      <span class="tag">Map mode: ${state.mapMode === 'add-zone' ? 'Add zone on map click' : state.mapMode === 'add-waypoint' ? 'Add waypoint on map click' : 'Select/edit'}</span>
      <span class="tag">Overlay: ${(state.scenario.overlayMode || 'openseamap') === 'openseamap' ? 'OSM + OpenSeaMap' : 'OSM only'}</span>
      <span class="tag">Remember view: ${state.scenario.rememberLastMapView === false ? 'Off' : 'On'}</span>
      <span class="tag">Pinned view: ${pinned ? 'Set' : 'Not set'}</span>
      <span class="tag">Turn: ${state.scenario.turn || 1}</span>
      <span class="tag">Duration: ${formatTurnDuration(state.scenario.turnDurationHours || 1)}</span>
    </div>
    <p><strong>Current situation</strong><br>${state.scenario.currentSituation}</p>
    <p class="small"><strong>Turn clock</strong><br>${state.scenario.timeLabel || 'H+0'} · each turn advances assets by heading/speed for ${formatTurnDuration(state.scenario.turnDurationHours || 1).replace(' / turn','')}. Fuel burn is speed-based, with 18 kt as the most efficient cruise band.</p>
    <p class="small"><strong>Map start view</strong><br>${pinned ? `Pinned at ${pinned.center[0].toFixed(2)}, ${pinned.center[1].toFixed(2)} / zoom ${pinned.zoom}` : 'No pinned view saved.'}${remembered ? `<br>Last remembered view ${remembered.center[0].toFixed(2)}, ${remembered.center[1].toFixed(2)} / zoom ${remembered.zoom}` : ''}</p>
  `;
  renderGlobalStatusBadge();
  const title = document.querySelector('header h1');
  if (title) title.textContent = 'Open War Game Engine v17';
  const addZoneModeBtn = document.getElementById('addZoneModeBtn');
  if (addZoneModeBtn) {
    addZoneModeBtn.textContent = state.mapMode === 'add-zone' ? 'Exit Add Zone Mode' : 'Add Zone Mode';
    addZoneModeBtn.className = state.mapMode === 'add-zone' ? 'warn' : '';
  }
  const addWaypointModeBtn = document.getElementById('addWaypointModeBtn');
  if (addWaypointModeBtn) {
    addWaypointModeBtn.textContent = state.mapMode === 'add-waypoint' ? 'Exit Waypoint Mode' : 'Add Waypoint Mode';
    addWaypointModeBtn.className = state.mapMode === 'add-waypoint' ? 'warn' : 'secondary';
  }
  updateWaypointUi();
  const scenarioNameInput = document.getElementById('scenarioNameInput');
  if (scenarioNameInput) scenarioNameInput.value = state.scenario.name || '';
  const scenarioOverviewInput = document.getElementById('scenarioOverviewInput');
  if (scenarioOverviewInput) scenarioOverviewInput.value = state.scenario.overview || '';
  const scenarioSituationInput = document.getElementById('scenarioSituationInput');
  if (scenarioSituationInput) scenarioSituationInput.value = state.scenario.currentSituation || '';
  const overlaySelect = document.getElementById('overlaySelect');
  if (overlaySelect) overlaySelect.value = state.scenario.overlayMode || 'openseamap';
  const symbolStyleSelect = document.getElementById('symbolStyleSelect');
  if (symbolStyleSelect) symbolStyleSelect.value = state.scenario.symbolStyle || 'ntds';
  const rememberLastMapView = document.getElementById('rememberLastMapView');
  if (rememberLastMapView) rememberLastMapView.checked = state.scenario.rememberLastMapView !== false;
  const turnDurationHoursInput = document.getElementById('turnDurationHoursInput');
  const turnDurationUnitSelect = document.getElementById('turnDurationUnitSelect');
  const currentDurationHours = Number(state.scenario.turnDurationHours || 1);
  if (turnDurationUnitSelect) turnDurationUnitSelect.value = currentDurationHours < 1 ? 'minutes' : 'hours';
  if (turnDurationHoursInput) {
    if ((turnDurationUnitSelect?.value || 'hours') === 'minutes') turnDurationHoursInput.value = Math.round(currentDurationHours * 60);
    else turnDurationHoursInput.value = currentDurationHours;
  }
  updateMeasurementControl('facilitator');
  updateMeasurementControl('player');
}

function renderTemplates() {
  const sel = document.getElementById('templateSelect');
  if (!sel) return;
  const options = ['<option value="__blank__">Blank scenario</option>'].concat(Object.entries(templates).map(([key, tpl]) => `<option value="${key}">${tpl.scenario?.name || key}</option>`));
  sel.innerHTML = options.join('');
}

function renderCells() {
  ensureCellLocations();
  const container = document.getElementById('cellsEditor');
  if (!container) return;
  container.innerHTML = '';
  state.session.cells.forEach(addCellRow);
  const links = document.getElementById('playerLinks');
  if (links) {
    links.innerHTML = state.session.cells.map(c => `<div class="small"><a href="./player.html?cell=${encodeURIComponent(c.id)}" target="_blank">Open player view: ${c.name}</a></div>`).join('');
  }
}

function renderZoneEditor() {
  const id = state.selectedZoneId;
  const zone = id ? state.zones[id] : null;
  const zoneIdEl = document.getElementById('zoneId');
  const zoneNameEl = document.getElementById('zoneName');
  const zoneRadiusEl = document.getElementById('zoneRadius');
  const zoneKindEl = document.getElementById('zoneKind');
  if (zoneIdEl) zoneIdEl.value = id || '';
  if (zoneNameEl) zoneNameEl.value = zone?.name || '';
  if (zoneRadiusEl) zoneRadiusEl.value = zone?.radius || '';
  if (zoneKindEl) zoneKindEl.value = zone?.kind || 'sea';
  const list = document.getElementById('zoneList');
  if (list) {
    list.innerHTML = zoneIds().length
      ? zoneIds().map(zoneId => `<div class="card ${zoneId === id ? 'zone-selected' : ''}"><strong>${state.zones[zoneId].name}</strong><div class="small">${zoneId} · ${state.zones[zoneId].kind} · ${Math.round((state.zones[zoneId].radius || 0) / 1000)} km</div><button class="secondary" onclick="selectZone('${zoneId}')">Select</button></div>`).join('')
      : '<div class="small">No zones yet. Click <strong>Add Zone Mode</strong> and then click on the map.</div>';
  }
}

function renderAssets() {
  const panel = document.getElementById('assetsPanel');
  if (!panel) return;
  bindAssetFilterControls();
  const filters = getAssetFilters();
  const visibleAssets = state.assets.filter(a => assetMatchesFilters(a, filters));
  const countEl = document.getElementById('assetFilterCount');
  if (countEl) countEl.textContent = `${visibleAssets.length} shown / ${state.assets.length} total`;
  if (!visibleAssets.length) {
    panel.innerHTML = '<div class="small">No assets match the current filter selection. Adjust the search, scope, affiliation, or representation filters.</div>';
    renderAssetEditor();
    return;
  }
  const sections = groupedAssetSections(visibleAssets);
  panel.innerHTML = sections.map(section => `
    <div class="asset-section">
      <div class="section-title">${section.title}</div>
      ${section.assets.map(a => `
        <div class="card asset ${a.id === state.selectedAssetId ? 'zone-selected' : ''}">
          <strong>${a.name}</strong>
          <div class="row" style="margin-top:6px">
            <span class="tag">${assetRepresentationLabel(a.representation)}</span>
            <span class="tag">${assetTypeLabel(a.type)}</span>
            <span class="tag">${assetAffiliationLabel(a.affiliation)}</span>
            <span class="tag">${trackQualityShort(a.trackQuality)}</span>
            <span class="tag">${a.status}</span>
            <span class="tag">${prettyZone(a.zone)}</span>
            <span class="tag">${normalizeHeading(a.heading)}° / ${normalizeSpeed(a.speed)} kt</span>
            <span class="${fuelTagClass(a)}">Fuel ${fuelPercentLabel(a)}</span><span class="${readinessTagClass(a)}">Ready ${readinessPercentLabel(a)}</span>
            <span class="tag">${waypointSummary(a)}</span>
            <span class="tag">${assetOwningGroupLabel(a)}</span>
            ${(roleTagsForAsset(a) || []).slice(0,3).map(tag => `<span class="tag">${tag}</span>`).join('')}
          </div>
          <button class="secondary" onclick="selectAsset('${a.id}')">Select</button>
        </div>`).join('')}
    </div>`).join('');
  renderAssetEditor();
}


function renderAssetEditor() {
  const asset = state.assets.find(a => a.id === state.selectedAssetId) || null;
  const assetId = document.getElementById('assetId');
  const assetName = document.getElementById('assetName');
  const assetType = document.getElementById('assetType');
  const assetAffiliation = document.getElementById('assetAffiliation');
  const assetRepresentation = document.getElementById('assetRepresentation');
  const assetStatus = document.getElementById('assetStatus');
  const assetZone = document.getElementById('assetZone');
  const assetFuel = document.getElementById('assetFuel');
  const assetReadiness = document.getElementById('assetReadiness');
  const assetAssignedCell = document.getElementById('assetAssignedCell');
  const assetTrackQuality = document.getElementById('assetTrackQuality');
  const assetHeading = document.getElementById('assetHeading');
  const assetSpeed = document.getElementById('assetSpeed');
  const assetLat = document.getElementById('assetLat');
  const assetLon = document.getElementById('assetLon');
  const assetWaypoints = document.getElementById('assetWaypoints');
  if (!assetZone || !assetAssignedCell) return;
  assetZone.innerHTML = ['<option value="">Unplaced</option>'].concat(zoneIds().map(id => `<option value="${id}">${state.zones[id].name}</option>`)).join('');
  assetAssignedCell.innerHTML = ['<option value="">Unassigned / Commercial</option>'].concat(state.session.cells.map(c => `<option value="${c.id}">${c.name}</option>`)).join('');
  if (assetType) assetType.innerHTML = ASSET_TYPE_OPTIONS.map(o => `<option value="${o.value}">${o.label}</option>`).join('');
  if (assetAffiliation) assetAffiliation.innerHTML = ASSET_AFFILIATION_OPTIONS.map(o => `<option value="${o.value}">${o.label}</option>`).join('');
  if (assetRepresentation) assetRepresentation.innerHTML = ASSET_REPRESENTATION_OPTIONS.map(o => `<option value="${o.value}">${o.label}</option>`).join('');
  if (assetTrackQuality) assetTrackQuality.innerHTML = TRACK_QUALITY_OPTIONS.map(o => `<option value="${o.value}">${o.label}</option>`).join('');
  if (assetId) assetId.value = asset?.id || '';
  if (assetName) assetName.value = asset?.name || '';
  if (assetType) assetType.value = normalizeAssetType(asset?.type || 'patrol_vessel');
  if (assetAffiliation) assetAffiliation.value = normalizeAssetAffiliation(asset?.affiliation || 'friend');
  if (assetRepresentation) assetRepresentation.value = normalizeAssetRepresentation(asset?.representation || 'unit');
  if (assetStatus) assetStatus.value = asset?.status || 'available';
  if (assetZone) assetZone.value = asset?.zone || '';
  if (assetFuel) { assetFuel.value = clampPercent(asset?.fuel, defaultFuelForAssetType(asset?.type)); assetFuel.placeholder = 'Fuel (%)'; assetFuel.title = `Fuel remaining in percent; 100% equals ${fuelCapacityForAsset(asset || { type: assetType?.value })} endurance units for this class`; }
  if (assetReadiness) { assetReadiness.value = clampPercent(asset?.readiness, defaultReadinessForAssetType(asset?.type)); assetReadiness.placeholder = 'Readiness (%)'; assetReadiness.title = 'Operational readiness percentage'; }
  if (assetAssignedCell) assetAssignedCell.value = asset?.assignedCell || state.session.cells[0]?.id || '';
  if (assetTrackQuality) assetTrackQuality.value = normalizeTrackQuality(asset?.trackQuality || 'q2');
  if (assetHeading) assetHeading.value = normalizeHeading(asset?.heading ?? 90);
  if (assetSpeed) assetSpeed.value = normalizeSpeed(asset?.speed ?? 12);
  if (assetLat) assetLat.value = asset?.lat ?? '';
  if (assetLon) assetLon.value = asset?.lon ?? '';
  if (assetWaypoints) assetWaypoints.value = formatWaypointText(asset?.waypoints || []);
  updateWaypointUi();
  renderModernAssetLibraryInfo();
}


function renderInjects() {
  const el = document.getElementById('injectsPanel');
  if (!el) return;
  const allActions = state.session.cells.flatMap(c => (state.actionLogByCell[c.id] || []).map(item => Object.assign({ cell: c.name, cellId: c.id }, item)));
  const injectOptions = Array.isArray(injectLibrary) ? injectLibrary.slice(0, 12) : [];
  const pending = (state.boardingRequests || []).filter(r => r.status === 'pending');
  const resolved = (state.boardingRequests || []).filter(r => r.status !== 'pending');
  const boardingHtml = pending.length ? pending.slice().reverse().map(r => {
    const inspector = state.assets.find(a => a.id === r.inspectorAssetId);
    const target = state.assets.find(a => a.id === r.targetAssetId);
    return `<div class="timeline-item"><strong>${r.time}</strong> · ${(state.session.cells.find(c => c.id === r.cellId)?.name || r.cellId)}<br><strong>${inspector?.name || 'Missing inspector'}</strong> → <strong>${target?.name || 'Missing target'}</strong><br>${r.rationale || '<span class="small">No player rationale supplied.</span>'}<div class="grid2" style="margin-top:8px"><label>Environment<select id="boardingDiff-${r.id}"><option value="easy">Easy</option><option value="moderate" selected>Moderate</option><option value="hard">Hard</option><option value="severe">Severe</option></select></label><label>Facilitator modifier<select id="boardingFacMod-${r.id}">${[-3,-2,-1,0,1,2,3].map(v => `<option value="${v}" ${v===0?'selected':''}>${v>=0?'+':''}${v}</option>`).join('')}</select></label></div><textarea id="boardingFacNote-${r.id}" placeholder="Optional facilitator note / justification" style="margin-top:8px"></textarea><div class="row" style="margin-top:8px"><button onclick="adjudicateBoardingRequest('${r.id}')">Adjudicate Boarding</button></div></div>`;
  }).join('') : '<div class="small">No pending boarding requests.</div>';
  const resolvedHtml = resolved.length ? resolved.slice().reverse().slice(0,8).map(r => `<div class="timeline-item"><strong>${r.time || 'H+0'}</strong> · ${(state.session.cells.find(c => c.id === r.cellId)?.name || r.cellId)}<br>${r.adjudication?.execution || r.status}${r.adjudication?.outcome ? ` · ${r.adjudication.outcome}` : ''}</div>`).join('') : '<div class="small">No adjudicated boardings yet.</div>';
  el.innerHTML = `
    <div class="card"><strong>Player input to facilitator</strong>${allActions.length ? allActions.slice().reverse().map(a => `<div class="timeline-item"><strong>${a.time}</strong> · ${a.cell}<br>${a.text}</div>`).join('') : '<div class="small">No player input yet.</div>'}</div>
    <div class="card"><strong>Pending boarding requests</strong>${boardingHtml}</div>
    <div class="card"><strong>Boarding outcomes</strong>${resolvedHtml}</div>
    <div class="card"><strong>Facilitator inject release</strong><div class="row" style="margin-top:8px"><select id="facInjectSelect"><option value="">Select inject</option>${injectOptions.map(i => `<option value="${i.id}">${i.id} · ${i.title}</option>`).join('')}</select><select id="facInjectCell"><option value="all">All cells</option>${state.session.cells.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}</select><button onclick="releaseSelectedInject()">Release Inject</button></div><textarea id="facCustomUpdate" placeholder="Custom facilitator update to a cell or to all cells" style="margin-top:10px"></textarea><div class="row" style="margin-top:8px"><select id="facCustomCell"><option value="all">All cells</option>${state.session.cells.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}</select><button class="secondary" onclick="sendFacilitatorUpdate()">Send Update</button></div></div>
    <div class="card"><strong>Player status updates</strong><div class="small" style="margin-top:6px">Players receive an initial status update at H-0 when they lock a cell. Routine updates are sent every configured number of hours.</div><div class="row" style="margin-top:8px"><label style="max-width:160px">Routine interval (hours)<input id="statusUpdateIntervalInput" type="number" min="1" max="24" step="1" value="${Math.max(1, Math.min(24, Number(state.scenario.statusUpdateIntervalHours || 6) || 6))}"></label><button class="secondary" onclick="saveStatusUpdateInterval()">Apply interval</button></div><div class="row" style="margin-top:8px"><select id="facStatusCell"><option value="all">All cells</option>${state.session.cells.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}</select><button class="secondary" onclick="sendManualStatusUpdate()">Send Status Update</button></div></div>
    <div class="card"><strong>Recent inject/output</strong>${(state.releasedInjects || []).length ? state.releasedInjects.slice().reverse().map(i => `<div class="timeline-item"><strong>${i.title || i.id}</strong><br>${i.situation || i.text || ''}</div>`).join('') : '<div class="small">No released injects yet.</div>'}</div>`;
}

function releaseSelectedInject() {
  const id = document.getElementById('facInjectSelect')?.value;
  if (!id) return;
  const cellId = document.getElementById('facInjectCell')?.value || 'all';
  const inject = (injectLibrary || []).find(i => i.id === id);
  if (!inject) return;
  state.releasedInjects.push(Object.assign({ time: state.scenario.timeLabel || 'H+0' }, inject));
  const targets = cellId === 'all' ? state.session.cells.map(c => c.id) : [cellId];
  targets.forEach(cid => state.playerFeedByCell[cid].push({ time: state.scenario.timeLabel || 'H+0', text: `${inject.id}: ${inject.title} — ${inject.situation}` }));
  saveState(); renderAll();
}

function sendFacilitatorUpdate() {
  const text = String(document.getElementById('facCustomUpdate')?.value || '').trim();
  if (!text) return;
  const cellId = document.getElementById('facCustomCell')?.value || 'all';
  const targets = cellId === 'all' ? state.session.cells.map(c => c.id) : [cellId];
  targets.forEach(cid => state.playerFeedByCell[cid].push({ time: state.scenario.timeLabel || 'H+0', text }));
  state.timeline.push({ time: state.scenario.timeLabel || 'H+0', text: `Facilitator update sent to ${cellId === 'all' ? 'all cells' : cellId}: ${text}` });
  saveState(); renderAll();
}

function saveStatusUpdateInterval() {
  const raw = Number(document.getElementById('statusUpdateIntervalInput')?.value || 6);
  state.scenario.statusUpdateIntervalHours = Math.max(1, Math.min(24, raw || 6));
  saveState();
  renderAll();
}

function sendManualStatusUpdate() {
  const cellId = document.getElementById('facStatusCell')?.value || 'all';
  const targets = cellId === 'all' ? state.session.cells.map(c => c.id) : [cellId];
  targets.forEach(cid => pushStatusUpdateToCell(cid, 'Facilitator-requested status update'));
  saveState();
  renderAll();
}

function renderTimeline() {
  const el = document.getElementById('timelinePanel');
  if (!el) return;
  if (!state.timeline.length) {
    el.innerHTML = `<div class="small">No movement turns resolved yet. Set heading/speed or add waypoints on an asset and click <strong>Resolve Turn</strong> to advance it automatically on the chart; fuel will tick down based on speed.</div>`;
    return;
  }
  el.innerHTML = state.timeline.slice().reverse().map(item => `<div class="timeline-item"><strong>${item.time || 'H+0'}</strong><br>${item.text}</div>`).join('');
}

function submitPlayerAction() {
  const cellId = getPlayerCell();
  const text = (document.getElementById('playerAction')?.value || document.getElementById('playerActionText')?.value || '').trim();
  if (!text) return;
  const item = { time: state.scenario.timeLabel || 'H+0', text };
  state.actionLogByCell[cellId].push(item);
  saveState();
  const actionEl = document.getElementById('playerAction') || document.getElementById('playerActionText'); if (actionEl) actionEl.value = '';
  renderPlayerPage();
}

function renderPlayerPage() {
  const sel = document.getElementById('playerCellSelect');
  if (!sel) return;
  renderPlayerCellSelector();
  const cellId = getPlayerCell();
  const cell = state.session.cells.find(c => c.id === cellId);
  if (!cellId || !cell) {
    const panel = document.getElementById('playerScenarioPanel');
    if (panel) panel.innerHTML = `<div class="small">Choose your cell once to lock it for this player session. After locking, the choice cannot be switched from this browser tab.</div>`;
    const assetsPanel = document.getElementById('playerAssetsPanel');
    if (assetsPanel) assetsPanel.innerHTML = '<div class="small">No cell selected yet.</div>';
    const editor = document.getElementById('playerAssetEditor');
    if (editor) editor.innerHTML = '<div class="small">Select and lock a cell first.</div>';
    const feed = document.getElementById('playerFeedPanel');
    if (feed) feed.innerHTML = '<div class="small">No cell selected yet.</div>';
    const log = document.getElementById('playerActionLog');
    if (log) log.innerHTML = '<div class="small">No cell selected yet.</div>';
    updatePlayerWaypointUi();
    updatePlayerNavLinks();
    initMaps(true);
    return;
  }
  const myAssets = state.assets.filter(a => a.assignedCell === cellId);
  const controllableAssets = playerControllableAssets(cellId);
  const visibleContacts = playerVisibleContacts(cellId, 8);
  const visualShips = visibleContacts.filter(a => ['container_ship','bulk_carrier','tanker','lng_carrier','ro_ro_ferry','passenger_ferry','fishing_vessel','tug_workboat','dredger','pilot_boat','research_survey_vessel'].includes(normalizeAssetType(a.type)) || normalizeAssetAffiliation(a.affiliation) === 'neutral');
  const otherContacts = visibleContacts.filter(a => !visualShips.includes(a));
  const playerScenarioPanel = document.getElementById('playerScenarioPanel');
  if (playerScenarioPanel) playerScenarioPanel.innerHTML = `<div><strong>${cell?.name || 'Blue Cell'}</strong></div><div class="small">${cell?.domain || ''}</div><div class="row" style="margin-top:10px"><span class="tag">Scenario: ${state.scenario.name}</span><span class="tag">Zones: ${zoneIds().length}</span><span class="tag">Assigned: ${myAssets.length}</span><span class="tag">Controllable: ${controllableAssets.length}</span><span class="tag">Visual ships: ${visualShips.length}</span><span class="tag">${state.scenario.timeLabel || 'H+0'}</span></div><p><strong>Current situation</strong><br>${state.scenario.currentSituation}</p><p class="small"><strong>Player view</strong><br>You can issue heading, speed, waypoint, and boarding/classification actions for your own controllable assets. Commercial traffic remains facilitator-controlled.</p><p class="small"><strong>Cell lock</strong><br>This player session is locked to <strong>${cell?.name || cellId}</strong> to prevent switching between cells during play.</p>`;
  if (!controllableAssets.find(a => a.id === playerSelectedAssetId)) playerSelectedAssetId = controllableAssets[0]?.id || '';
  if (!visibleContacts.find(a => a.id === playerSelectedContactId)) playerSelectedContactId = visibleContacts[0]?.id || '';
  const selected = selectedPlayerAsset();
  document.getElementById('playerAssetsPanel').innerHTML = `
    <div class="asset-section">
      <div class="section-title">Assigned Assets</div>
      ${myAssets.length ? myAssets.map(a => `<div class="card ${a.id === playerSelectedAssetId ? 'zone-selected' : ''}"><strong>${a.name}</strong><div class="row"><span class="tag">${assetRepresentationLabel(a.representation)}</span><span class="tag">${assetTypeLabel(a.type)}</span><span class="tag">${assetAffiliationLabel(a.affiliation)}</span><span class="tag">${trackQualityShort(a.trackQuality)}</span><span class="tag">${a.status}</span><span class="tag">${prettyZone(a.zone)}</span><span class="tag">${normalizeHeading(a.heading)}° / ${normalizeSpeed(a.speed)} kt</span><span class="tag">${waypointSummary(a)}</span><span class="${fuelTagClass(a)}">Fuel ${fuelPercentLabel(a)}</span><span class="${readinessTagClass(a)}">Ready ${readinessPercentLabel(a)}</span></div>${(!isCommercialAssetType(a.type) && normalizeAssetAffiliation(a.affiliation) !== 'neutral') ? `<button class="secondary player-select-btn" onclick="selectPlayerAsset('${a.id}')">Select</button>` : `<div class="small" style="margin-top:8px">Facilitator-controlled contact. Visible, but not movable from player view.</div>`}</div>`).join('') : '<div class="small">No assets assigned to this cell yet.</div>'}
    </div>`;
  const visualPanel = document.getElementById('playerVisualContactsPanel');
  if (visualPanel) visualPanel.innerHTML = `
    <div class="asset-section">
      <div class="section-title">Ships within visual range (8 nm)</div>
      ${(visualShips.length ? visualShips.map(a => `<div class="card ${a.id === playerSelectedContactId ? 'zone-selected' : ''}"><strong>${a.name}</strong><div class="row"><span class="tag">${assetRepresentationLabel(a.representation)}</span><span class="tag">${assetTypeLabel(a.type)}</span><span class="tag">${assetAffiliationLabel(a.affiliation)}</span><span class="tag">${prettyZone(a.zone)}</span><span class="tag">${normalizeHeading(a.heading)}° / ${normalizeSpeed(a.speed)} kt</span></div><button class="secondary player-select-btn" onclick="selectPlayerContact('${a.id}')">Select Contact</button></div>`).join('') : '<div class="small">No ships within visual range right now.</div>')}
    </div>
    <div class="asset-section" style="margin-top:10px">
      <div class="section-title">Other visual contacts</div>
      ${(otherContacts.length ? otherContacts.map(a => `<div class="card ${a.id === playerSelectedContactId ? 'zone-selected' : ''}"><strong>${a.name}</strong><div class="row"><span class="tag">${assetRepresentationLabel(a.representation)}</span><span class="tag">${assetTypeLabel(a.type)}</span><span class="tag">${assetAffiliationLabel(a.affiliation)}</span><span class="tag">${trackQualityShort(a.trackQuality)}</span><span class="tag">${prettyZone(a.zone)}</span></div><button class="secondary player-select-btn" onclick="selectPlayerContact('${a.id}')">Classify</button></div>`).join('') : '<div class="small">No additional visual contacts.</div>')}
    </div>`;
  const editor = document.getElementById('playerAssetEditor');
  const selectedContact = selectedPlayerContact();
  if (editor) {
    const headingOptions = Array.from({ length: 36 }, (_, i) => i * 10).map(v => `<option value="${v}" ${Math.round(normalizeHeading(selected?.heading || 0) / 10) * 10 === v ? 'selected' : ''}>${v}°</option>`).join('');
    const speedBands = [0, 5, 10, 12, 15, 18, 20, 24, 28, 32, 36, 40];
    const speedOptions = speedBands.map(v => `<option value="${v}" ${Number(normalizeSpeed(selected?.speed || 0)).toFixed(1) === Number(v).toFixed(1) ? 'selected' : ''}>${v} kt</option>`).join('');
    const ownEditor = selected ? `<div class="card"><strong>${selected.name}</strong><div class="compact-grid" style="margin-top:8px"><label>Heading<select id="playerAssetHeading">${headingOptions}</select></label><label>Speed (kt)<select id="playerAssetSpeed">${speedOptions}</select></label></div><textarea id="playerAssetWaypoints" style="display:none">${escapeHtml(formatWaypointText(selected.waypoints || []))}</textarea><div class="small" style="margin-top:10px">Waypoints stay active but are hidden here. Use Add Waypoint Mode on the map, then save orders.</div><div class="row" style="margin-top:10px"><button onclick="savePlayerAssetOrders()">Save Orders</button><button class="secondary" onclick="playerMapMode = (playerMapMode === 'add-waypoint' ? 'select' : 'add-waypoint'); updatePlayerWaypointUi(); renderPlayerPage();">${playerMapMode === 'add-waypoint' ? 'Exit Waypoint Mode' : 'Add Waypoint Mode'}</button><button class="secondary" onclick="undoLastPlayerWaypoint()">Undo Last Waypoint</button><button class="secondary" onclick="clearPlayerSelectedWaypoints()">Clear Waypoints</button></div><div class="small" style="margin-top:8px">Only your own non-commercial assigned assets can receive heading, speed, and waypoint orders from this player view.</div></div>` : '<div class="small">Select one of your controllable assigned assets to set heading, speed, and waypoints.</div>';
    const boardingDistance = selected && selectedContact ? boardingDistanceNm(selected, selectedContact) : Infinity;
    const contactEditor = selectedContact ? `<div class="card" style="margin-top:10px"><strong>Contact classification: ${selectedContact.name}</strong><div class="small" style="margin-top:8px">Classification lets the player update how a visible contact is understood in-game: <strong>Affiliation</strong> changes friend/neutral/hostile judgement, <strong>Representation</strong> sets whether it is still a track or now a confirmed unit, and <strong>Track quality</strong> expresses confidence in the picture.</div><div class="compact-grid" style="margin-top:8px"><label>Affiliation<select id="playerContactAffiliation">${ASSET_AFFILIATION_OPTIONS.map(o => `<option value="${o.value}" ${o.value === normalizeAssetAffiliation(selectedContact.affiliation) ? 'selected' : ''}>${o.label}</option>`).join('')}</select></label><label>Representation<select id="playerContactRepresentation">${ASSET_REPRESENTATION_OPTIONS.map(o => `<option value="${o.value}" ${o.value === normalizeAssetRepresentation(selectedContact.representation) ? 'selected' : ''}>${o.label}</option>`).join('')}</select></label><label>Track quality<select id="playerContactTrackQuality">${TRACK_QUALITY_OPTIONS.map(o => `<option value="${o.value}" ${o.value === normalizeTrackQuality(selectedContact.trackQuality) ? 'selected' : ''}>${o.label}</option>`).join('')}</select></label><label>Name<input disabled value="${selectedContact.name}"></label></div><div class="row" style="margin-top:10px"><button onclick="savePlayerContactClassification()">Save Classification</button></div><label style="display:block;margin-top:10px">Boarding rationale<textarea id="playerBoardingRationale" placeholder="Why should this boarding have a better chance of success? Explain timing, support, geometry, behavior, or other justification."></textarea></label><div class="row" style="margin-top:10px"><button ${boardingDistance <= 2 ? '' : 'disabled'} onclick="requestPlayerBoarding()">Request Boarding</button><span class="tag">Distance: ${Number.isFinite(boardingDistance) ? boardingDistance.toFixed(2) : '--'} nm</span>${boardingDistance <= 2 ? '<span class="tag">Boarding window open</span>' : '<span class="tag">Need ≤ 2.00 nm</span>'}</div><div class="small" style="margin-top:8px">A boarding request can only be submitted within 2 nm. When submitted, both vessels are set to 0 kt for the next turn. Commercial vessels remain facilitator-controlled for heading, speed, and waypoint orders.</div></div>` : '<div class="small" style="margin-top:10px">Select a contact from Other Contacts to adjust affiliation/classification or request a boarding.</div>';
    editor.innerHTML = ownEditor + contactEditor;
  }
  updatePlayerWaypointUi();
  updatePlayerNavLinks();
  renderGlobalStatusBadge();
  const feed = state.playerFeedByCell[cellId] || [];
  const feedPanel = document.getElementById('playerFeedPanel');
  if (feedPanel) feedPanel.innerHTML = feed.length ? feed.slice().reverse().map(f => `<div class="timeline-item"><strong>${f.time}</strong><br>${f.text}</div>`).join('') : '<div class="small">No facilitator updates yet for this cell.</div>';
  const log = state.actionLogByCell[cellId] || [];
  const logPanel = document.getElementById('playerActionLog');
  if (logPanel) logPanel.innerHTML = log.length ? log.slice().reverse().map(a => `<div class="timeline-item"><strong>${a.time}</strong><br>${a.text}</div>`).join('') : '<div class="small">No submitted actions yet.</div>';
  initMaps(true);
}


function renderAll() {
  ensureSessionMaps();
  renderScenario();
  renderTemplates();
  renderCells();
  renderZoneEditor();
  renderAssets();
  bindAssetFilterControls();
  renderInjects();
  renderTimeline();
  renderModernAssetLibraryInfo();
  const legendLabel = document.getElementById('legendStyleLabel');
  if (legendLabel) legendLabel.textContent = '(' + (state.scenario.symbolStyle || 'ntds').toUpperCase().replace('APP6','APP-6') + ')';
  updateMeasurementControl('facilitator');
  updateMeasurementControl('player');
  renderPlayerPage();
  if (map) renderFacilitatorMap();
  if (playerMap) renderPlayerMap();
}

window.selectZone = selectZone;
window.selectAsset = selectAsset;
window.selectPlayerAsset = selectPlayerAsset;
window.selectPlayerContact = selectPlayerContact;
window.savePlayerAssetOrders = savePlayerAssetOrders;
window.savePlayerContactClassification = savePlayerContactClassification;
window.clearPlayerSelectedWaypoints = clearPlayerSelectedWaypoints;
window.undoLastPlayerWaypoint = undoLastPlayerWaypoint;
window.releaseSelectedInject = releaseSelectedInject;
window.sendFacilitatorUpdate = sendFacilitatorUpdate;
window.requestPlayerBoarding = requestPlayerBoarding;
window.adjudicateBoardingRequest = adjudicateBoardingRequest;
window.resetAssetFilters = resetAssetFilters;

init();
