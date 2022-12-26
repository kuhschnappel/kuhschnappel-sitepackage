// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-gray; icon-glyph: magic;
// Licence: Robert Koch-Institut (RKI), dl-de/by-2-0
const locationApi = (location) => `https://services7.arcgis.com/mOBPykOjAyBO2ZKk/arcgis/rest/services/RKI_Landkreisdaten/FeatureServer/0/query?where=1%3D1&outFields=OBJECTID,cases7_per_100k,cases7_bl_per_100k,cases,GEN,county,BL&geometry=${location.longitude.toFixed(3)}%2C${location.latitude.toFixed(3)}&geometryType=esriGeometryPoint&inSR=4326&spatialRel=esriSpatialRelWithin&returnGeometry=false&outSR=4326&f=json`
const serverApi = (landkreisId) => `https://cdn.marcelrebmann.de/corona/?id=${landkreisId}`

const WIDGET_MODE = {
    INCIDENCE: "INCIDENCE",
    INFECTIONS: "INFECTIONS"
}

const INCIDENCE_CRITICAL = 50
const INCIDENCE_WARN = 35

const INZIDENZ_HEADER = `🦠 INZIDENZ`
const INFECTIONS_HEADER = `🦠 INFEKTIONEN`

const BUNDESLAENDER_SHORT = {
    'Baden-Württemberg': 'BW',
    'Bayern': 'BY',
    'Berlin': 'BE',
    'Brandenburg': 'BB',
    'Bremen': 'HB',
    'Hamburg': 'HH',
    'Hessen': 'HE',
    'Mecklenburg-Vorpommern': 'MV',
    'Niedersachsen': 'NI',
    'Nordrhein-Westfalen': 'NRW',
    'Rheinland-Pfalz': 'RP',
    'Saarland': 'SL',
    'Sachsen': 'SN',
    'Sachsen-Anhalt': 'ST',
    'Schleswig-Holstein': 'SH',
    'Thüringen': 'TH'
}

const isNumericValue = (number) => {
    return number || number === 0
}

const getIncidenceColor = (incidence) => {
    if (incidence >= INCIDENCE_CRITICAL) {
        return Color.red()
    } else if (incidence >= INCIDENCE_WARN) {
        return Color.orange()
    } else {
        return Color.green()
    }
}

const getInfectionTrend = (slope) => {
    if (slope > 0) {
        return "▲"
    } else if (slope === 0) {
        return "▶︎"
    } else if (slope < 0) {
        return "▼"
    } else {
        return "-"
    }
}

const getTrendColor = (slope) => {
    if (slope > 1) {
        return Color.red()
    } else if (slope > 0) {
        return Color.orange()
    } else if (slope < 0) {
        return Color.green()
    } else {
        return Color.gray()
    }
}

const generateLandkreisName = (data, customLandkreisName) => {
    if (customLandkreisName) {
        return customLandkreisName
    }
    return data.landkreis.county.match(/^SK \w+$/) ? `${data.landkreis.GEN} (Stadt)` : data.landkreis.GEN
}

const generateDataState = (data) => {

    if (!data.rki_updated) {
        return `Stand: ${(data.landkreis.last_update || "").substr(0, 10)}`
    }
    const date = new Date(data.rki_updated)
    const day = date.getDate()
    const month = date.getMonth() + 1
    const year = date.getFullYear()
    return `Stand: ${day < 10 ? '0' : ''}${day}.${month < 10 ? '0' : ''}${month}.${year}`
}

const generateFooter = (widget, incidence, predictedIncidenceSlope, labelText, isCentered) => {
    const footer = widget.addStack()
    footer.layoutHorizontally()
    footer.useDefaultPadding()
    footer.centerAlignContent()

    if (isCentered) {
        footer.addSpacer()
    }

    const incidenceLabel = footer.addText(isNumericValue(incidence) ? `${incidence.toFixed(1).replace(".", ",")}` : "-")
    incidenceLabel.font = Font.boldSystemFont(14)
    incidenceLabel.textColor = getIncidenceColor(incidence)

    const trendIconLabel = footer.addText(` ${getInfectionTrend(predictedIncidenceSlope)}`)
    trendIconLabel.font = Font.systemFont(12)
    trendIconLabel.textColor = getTrendColor(predictedIncidenceSlope)

    const label = footer.addText(labelText)
    label.font = Font.systemFont(14)
    label.textColor = Color.gray()

    if (isCentered) {
        footer.addSpacer()
    }
}

async function loadData(location) {
    const rkiData = await new Request(locationApi(location)).loadJSON()

    if (!rkiData || !rkiData.features || !rkiData.features.length) {
        return null
    }
    const locationId = rkiData.features[0].attributes.OBJECTID

    try {
        const apiData = await new Request(serverApi(locationId)).loadJSON()
        return apiData
    } catch {
        return {
            landkreis: {
                ...rkiData.features[0].attributes,
                cases7_per_100k_trend: {},
                cases7_bl_per_100k_trend: {}
            },
            country: {}
        }
    }
}

async function loadAbsoluteCases() {
    const data = await new Request(serverApi(1)).loadJSON()

    if (!data) {
        return null
    }
    return data
}

const createIncidenceWidget = (widget, data, customLandkreisName) => {
    const header = widget.addText(INZIDENZ_HEADER)
    header.font = Font.mediumSystemFont(13)

    widget.addSpacer()

    const mainContent = widget.addStack()
    mainContent.layoutHorizontally()
    mainContent.useDefaultPadding()
    mainContent.centerAlignContent()

    const incidenceLabel = mainContent.addText(isNumericValue(data.landkreis.cases7_per_100k) ? `${data.landkreis.cases7_per_100k.toFixed(1).replace(".", ",")}` : "-")
    incidenceLabel.font = Font.boldSystemFont(24)
    incidenceLabel.textColor = getIncidenceColor(data.landkreis.cases7_per_100k)

    const landkreisTrendIconLabel = mainContent.addText(` ${getInfectionTrend(data.landkreis.cases7_per_100k_trend.slope)}`)
    landkreisTrendIconLabel.font = Font.systemFont(14)
    landkreisTrendIconLabel.textColor = getTrendColor(data.landkreis.cases7_per_100k_trend.slope)

    const casesLandkreisIncrease = isNumericValue(data.landkreis.cases) && isNumericValue(data.landkreis.cases_previous_day) ? data.landkreis.cases - data.landkreis.cases_previous_day : undefined
    const casesLandkreisLabel = mainContent.addText(` (${isNumericValue(casesLandkreisIncrease) ? `+${casesLandkreisIncrease.toLocaleString()}` : "-"})`)
    casesLandkreisLabel.font = Font.systemFont(data.landkreis.cases7_per_100k >= 100 ? 10 : 14)
    casesLandkreisLabel.textColor = Color.gray()

    const landkreisNameLabel = widget.addText(generateLandkreisName(data, customLandkreisName))
    landkreisNameLabel.minimumScaleFactor = 0.7

    widget.addSpacer()

    generateFooter(widget, data.landkreis.cases7_bl_per_100k, data.landkreis.cases7_bl_per_100k_trend.slope, ` ${BUNDESLAENDER_SHORT[data.landkreis.BL]}`)

    const stateInfo = widget.addText(generateDataState(data))
    stateInfo.font = Font.systemFont(10)
    stateInfo.textColor = Color.gray()
}

const createInfectionsWidget = (widget, data) => {
    const countryData = data.country

    const headerLabel = widget.addText(INFECTIONS_HEADER)
    headerLabel.font = Font.mediumSystemFont(13)

    if (!countryData) {
        widget.addText("Keine Fallzahlen verfügbar.")
        return;
    }
    const infectionsDiff = countryData.new_cases - countryData.new_cases_previous_day

    widget.addSpacer()

    const newInfectionsStack = widget.addStack()
    newInfectionsStack.addSpacer()
    const label = newInfectionsStack.addText("NEUE GESTERN")
    label.font = Font.systemFont(14)
    label.textColor = Color.gray()
    newInfectionsStack.addSpacer()

    widget.addSpacer(1)

    const casesStack = widget.addStack()
    casesStack.addSpacer()
    const casesLabel = casesStack.addText(`${isNumericValue(countryData.new_cases) ? countryData.new_cases.toLocaleString() : "-"}`)
    casesLabel.font = Font.boldSystemFont(24)
    casesLabel.minimumScaleFactor = 0.8
    casesStack.addSpacer()

    const casesDifferenceStack = widget.addStack()
    casesDifferenceStack.addSpacer()

    const casesTrendIcon = casesDifferenceStack.addText(getInfectionTrend(countryData.new_cases - countryData.new_cases_previous_day))
    casesTrendIcon.font = Font.systemFont(14)
    casesTrendIcon.textColor = getTrendColor(infectionsDiff)

    const casesDiffLabel = casesDifferenceStack.addText(isNumericValue(infectionsDiff) ? ` (${infectionsDiff >= 0 ? '+' : ''}${infectionsDiff.toLocaleString()})` : "-")
    casesDiffLabel.font = Font.systemFont(14)
    casesDiffLabel.textColor = Color.gray()
    casesDifferenceStack.addSpacer()

    widget.addSpacer()

    const deTrendSlope = countryData.cases7_de_per_100k_trend ? countryData.cases7_de_per_100k_trend.slope : countryData.cases7_de_per_100k_trend
    generateFooter(widget, countryData.cases7_de_per_100k, deTrendSlope, " DE", true)

    const stateInfo = widget.addStack()
    stateInfo.addSpacer()
    const updateLabel = stateInfo.addText(generateDataState(data))
    updateLabel.font = Font.systemFont(10)
    updateLabel.textColor = Color.gray()
    stateInfo.addSpacer()
}

let widget = await createWidget()

if (!config.runsInWidget) {
    await widget.presentSmall()
}

Script.setWidget(widget)
Script.complete()

async function createWidget() {
    let location = {};
    let customLandkreisName;
    let widgetMode = WIDGET_MODE.INCIDENCE;

    const params = args.widgetParameter ? args.widgetParameter.split(",") : undefined

    if (!params) {
        Location.setAccuracyToThreeKilometers()
        location = await Location.current()
    }

    if (params && params[0] === "INF") {
        widgetMode = WIDGET_MODE.INFECTIONS
    }

    if (params && params[0] !== "INF") {
        location = {
            latitude: parseFloat(params[0]),
            longitude: parseFloat(params[1])
        }
        customLandkreisName = params[2]
    }

    const widget = new ListWidget()

    switch (widgetMode) {
        case WIDGET_MODE.INCIDENCE:
            const data = await loadData(location)

            if (!data) {
                widget.addText("Keine Ergebnisse für den aktuellen Ort gefunden.")
                return widget
            }
            createIncidenceWidget(widget, data, customLandkreisName);
            break;
        case WIDGET_MODE.INFECTIONS:
            const infectionData = await loadAbsoluteCases()

            if (!infectionData) {
                widget.addText("Fallzahlen konnten nicht geladen werden.")
                return widget
            }
            createInfectionsWidget(widget, infectionData)
            break;
        default:
            widget.addText("Keine Daten.")
            return widget
    }
    return widget
}