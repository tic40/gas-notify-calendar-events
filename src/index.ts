const properties = PropertiesService.getScriptProperties()
const SLACK_WEBHOOK_URL: string = properties.getProperty('SLACK_WEBHOOK_URL')
const SLACK_CHANNELS: string = properties.getProperty('SLACK_CHANNELS')
const SLACK_BOT_ICON_EMOJI: string =
  properties.getProperty('SLACK_BOT_ICON_EMOJI') || ':sunglasses:'
const SLACK_BOT_USERNAME: string =
  properties.getProperty('SLACK_BOT_USERNAME') || 'gas-notify-calendar-events'
const SLACK_BOT_ATTACHMENT_COLOR: string =
  properties.getProperty('SLACK_BOT_ATTACHMENT_COLOR') || '#7CB342'
const GOOGLE_CALENDAR_ID: string = properties.getProperty('GOOGLE_CALENDAR_ID')
const CALENDAR_TARGET_DAYS_RANGE: number =
  Number(properties.getProperty('CALENDAR_TARGET_DAYS_RANGE')) || 14

const isWeekend = (): boolean => {
  const day: number = new Date().getDay()
  return day === 0 || day === 6
}

const daysDiff = (date1: Date, date2: Date): number => {
  const msDiff: number = date2.getTime() - date1.getTime()
  return Math.floor(msDiff / (1000 * 60 * 60 * 24)) + 1
}

const convertDateToYYYYMMDD = (date: Date): string => {
  return [
    date.getFullYear(),
    ('00' + (date.getMonth() + 1)).slice(-2),
    ('00' + date.getDate()).slice(-2)
  ].join('-')
}

const formatGoogleCalendarEventMessage = (event: any): string => {
  const startDate = new Date(event.getStartTime())
  const endDate = new Date(event.getEndTime())
  const diff: number = daysDiff(new Date(), startDate)
  const additionalMessage = diff
    ? `${diff} ${diff === 1 ? 'day' : 'days'} left!`
    : `Today:fire:`
  return `${convertDateToYYYYMMDD(
    startDate
  )}: ${event.getTitle()} *${additionalMessage}*`
}

const postToSlack = (text: string): void => {
  for (const channel of SLACK_CHANNELS.split(',').map(c => c.trim())) {
    UrlFetchApp.fetch(SLACK_WEBHOOK_URL, {
      contentType: 'application/json',
      method: 'post',
      payload: JSON.stringify({
        attachments: [
          {
            color: SLACK_BOT_ATTACHMENT_COLOR,
            text
          }
        ],
        channel,
        icon_emoji: SLACK_BOT_ICON_EMOJI,
        link_names: 1,
        username: SLACK_BOT_USERNAME
      })
    })
  }
}

function notifyEventsToSlack(): void {
  if (isWeekend()) {
    return
  }
  const calendar: any = CalendarApp.getCalendarById(GOOGLE_CALENDAR_ID)

  const startTime = new Date()
  startTime.setHours(0, 0, 0, 0)
  const endTime = new Date()
  endTime.setDate(endTime.getDate() + CALENDAR_TARGET_DAYS_RANGE)
  const eventsTimeRange: any[] = calendar.getEvents(startTime, endTime)

  let eventMessage: string = ''
  if (!eventsTimeRange || eventsTimeRange.length === 0) {
    eventMessage = `No events within ${CALENDAR_TARGET_DAYS_RANGE} days!`
  } else {
    eventMessage = eventsTimeRange
      .map(event => formatGoogleCalendarEventMessage(event))
      .join('\n')
  }

  postToSlack(eventMessage)
}

function sendTestMessageToSlack(): void {
  postToSlack('This is a test message')
}

function test(): void {
  Logger.log('test')
}
