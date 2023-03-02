const solarApi = (milliWatt) => `https://kuhschnappel.ddnss.de/api/solar/statistics`

const WIDGET_MODE = {
    MEASUREMENT: "MEASUREMENT",
}

const MEASUREMENT_HEADER = `☀️ `
const MEASUREMENT_HEADER_NIGHT = `🌝 `
const ICON_UHR = `🕐`


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

const refreshTime = (stateInfo) => {
    const date = new Date()
    stateInfo.text = "jjj"
    stateInfo.text = `${date.getSeconds()}`
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
    if (slope < 0) {
        return Color.red()
    } else if (slope === 0) {
        return Color.orange()
    } else {
        return Color.green()
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

    const date = new Date(data.wattHoursDateTime)
    const hours = date.getHours()
    const minutes = date.getMinutes()
    return ` ${hours < 10 ? '0' : ''}${hours}:${minutes < 10 ? '0' : ''}${minutes} Uhr`
}

// Line drawing function
DrawContext.prototype.drawLine = function (p_x1, p_y1, p_x2, p_y2, p_colourLine, p_intWidth)
{
	let pthLine = new Path();
	pthLine.move(new Point(p_x1, p_y1));
	pthLine.addLine(new Point(p_x2, p_y2));
	this.addPath(pthLine);
	this.setStrokeColor(p_colourLine);
	this.setLineWidth(p_intWidth);
	this.strokePath();
}

let stateInfo
const createMeasurementWidget = (widget, data) => {

    const powerData = data.watt

    const icon = data.isDay ? MEASUREMENT_HEADER : MEASUREMENT_HEADER_NIGHT

    const sunNowElevation =  data.sunNow ? `${data.sunNow.elevation.toFixed(0)}°` : false
    const sunPeakElevation =  data.sunPeak ? `${data.sunPeak.elevation.toFixed(0)}°` : false

    const sunInformation = (sunNowElevation && sunPeakElevation) ? ` ${sunNowElevation} (${sunPeakElevation})` : ``

    const header = widget.addText(`${icon} ${data.description}${sunInformation}`)

    header.font = Font.mediumSystemFont(10)
    header.textColor = Color.white()

    widget.addSpacer()

    const mainContent = widget.addStack()
    mainContent.layoutHorizontally()
    mainContent.useDefaultPadding()
    mainContent.centerAlignContent()


    const incidenceLabel = mainContent.addText(isNumericValue(powerData) ? `${powerData.toFixed(0).replace(".", ",")}` : "-")
    incidenceLabel.font = Font.boldSystemFont(24)
    incidenceLabel.textColor = getIncidenceColor(powerData)

    const casesLandkreisIncrease = isNumericValue(data.wattHours24HoursBefore) && isNumericValue(data.wattHoursToday) ? data.wattHoursToday - data.wattHours24HoursBefore : undefined

    const landkreisTrendIconLabel = mainContent.addText(` ${getInfectionTrend(casesLandkreisIncrease)}`)
    landkreisTrendIconLabel.font = Font.systemFont(14)
    landkreisTrendIconLabel.textColor = getTrendColor(casesLandkreisIncrease)

    if (isNumericValue(casesLandkreisIncrease)) {
      if (casesLandkreisIncrease < 0) {
        // verschlechtert
        const casesLandkreisLabel = mainContent.addText(` ${isNumericValue(casesLandkreisIncrease) ? `${casesLandkreisIncrease.toLocaleString()}` : "-"} Wh`)
        casesLandkreisLabel.font = Font.systemFont(10)
        casesLandkreisLabel.textColor = Color.gray()
      } else {
        // verbessert
        const casesLandkreisLabel = mainContent.addText(` ${isNumericValue(casesLandkreisIncrease) ? `+${casesLandkreisIncrease.toLocaleString()}` : "-"} Wh`)
        casesLandkreisLabel.font = Font.systemFont(10)
        casesLandkreisLabel.textColor = Color.gray()
      }
    }

    const landkreisNameLabel = widget.addText('Watt')
    landkreisNameLabel.minimumScaleFactor = 0.7
    landkreisNameLabel.textColor = Color.white()

    const max = data.wattHoursToday > data.wattHoursYesterday ? data.wattHoursToday : data.wattHoursYesterday
    const height = max / 50

    widget.addSpacer(5)

    const labelText = widget.addText(`Heute: ${data.wattHoursToday.toFixed(0).replace(".", ",")} Wh`)
    labelText.font = Font.systemFont(10)
    labelText.textColor = Color.green()

    widget.addSpacer(2)

    let dcRegion = new DrawContext();
    dcRegion.size = new Size(max, height);
    dcRegion.opaque = false;

    dcRegion.drawLine(0, height / 2, data.wattHoursToday, height / 2, Color.green(), height);
    widget.addImage(dcRegion.getImage())

    widget.addSpacer(2)

    let dcRegionVortag = new DrawContext();
    dcRegionVortag.size = new Size(max, height);
    dcRegionVortag.opaque = false;

    dcRegionVortag.drawLine(0, height / 2, data.wattHoursYesterday, height / 2, Color.gray(), height);
    widget.addImage(dcRegion.getImage())


    widget.addSpacer(2)

    const labelTextVortag = widget.addText(`Gestern: ${data.wattHoursYesterday.toFixed(0).replace(".", ",")} Wh`)
    labelTextVortag.font = Font.systemFont(10)
    labelTextVortag.textColor = Color.gray()

    widget.addSpacer(5)

    stateInfo = widget.addText(`${ICON_UHR} ${generateDataState(data)}`)

    stateInfo.font = Font.systemFont(9)
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
    widget.backgroundColor = Color.black()

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