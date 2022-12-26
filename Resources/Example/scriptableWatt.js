const solarApi = (milliWatt) => `https://kuhschnappel.ddnss.de/solar`

const WIDGET_MODE = {
    MEASUREMENT: "MEASUREMENT",
}

const MEASUREMENT_HEADER = `☀️ Solar`

const INCIDENCE_POOR = 50
const INCIDENCE_GOOD = 300

const isNumericValue = (number) => {
    return number || number === 0
}

async function loadData() {

    try {
        const apiData = await new Request(solarApi()).loadJSON()
        return apiData
    } catch {
        return {
            mesurement: {
                watt: {}
            }
        }
    }
}

const getIncidenceColor = (powerData) => {
    if (powerData >= INCIDENCE_GOOD) {
        return Color.green()
    } else if (powerData >= INCIDENCE_POOR) {
        return Color.orange()
    } else {
        return Color.red()
    }
}

const generateDataState = (data) => {

    // if (!data.rki_updated) {
    //     return `Stand: ${(data.landkreis.last_update || "").substr(0, 10)}`
    // }
    // const date = new Date(data.rki_updated)
    const date = new Date()
    const hour = date.getHours()
    const minute = date.getMinutes()
    const day = date.getDate()
    const month = date.getMonth() + 1
    const year = date.getFullYear()
    return `${day < 10 ? '0' : ''}${day}.${month < 10 ? '0' : ''}${month}.${year} - ${hour < 10 ? '0' : ''}${hour}:${minute < 10 ? '0' : ''}${minute} Uhr`
}

const createMeasurementWidget = (widget, data) => {

    const powerData = data.power / 1000

    const header = widget.addText(MEASUREMENT_HEADER)
    header.font = Font.mediumSystemFont(13)

    widget.addSpacer()

    const mainContent = widget.addStack()
    mainContent.layoutHorizontally()
    mainContent.useDefaultPadding()
    mainContent.centerAlignContent()

    const incidenceLabel = mainContent.addText(isNumericValue(powerData) ? `${powerData.toFixed(2).replace(".", ",")}` : "-")
    incidenceLabel.font = Font.boldSystemFont(24)
    incidenceLabel.textColor = getIncidenceColor(powerData)

    const landkreisNameLabel = widget.addText('Watt')
    landkreisNameLabel.minimumScaleFactor = 0.7

    widget.addSpacer()

    const stateInfo = widget.addText(generateDataState(data))
    stateInfo.font = Font.systemFont(10)
    stateInfo.textColor = Color.gray()
}

let widget = await createWidget()

if (!config.runsInWidget) {
    await widget.presentSmall()
}

Script.setWidget(widget)
Script.complete()

async function createWidget() {
    let widgetMode = WIDGET_MODE.MEASUREMENT;

    const params = args.widgetParameter ? args.widgetParameter.split(",") : undefined

    if (!params) {
        widgetMode = WIDGET_MODE.MEASUREMENT
    }

    const widget = new ListWidget()

    switch (widgetMode) {
        case WIDGET_MODE.MEASUREMENT:
            const data = await loadData()
            //
            if (!data) {
                widget.addText("Keine Leistung abrufbar.")
                return widget
            }
            createMeasurementWidget(widget, data)

            break;
        default:
            widget.addText("Keine Daten.")
            return widget
    }
    return widget
}


