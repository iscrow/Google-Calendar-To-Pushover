// Paste this code in a script.google.com project, fill out the 2 variables below and click Edit/Current Project Triggers
// Click Add Trigger, fill the form as follows:
// Chose which function to run: mainProcessEvents
// Which runs at deployment: Head
// Select event source: Time-driven
// Select type of time based trigger: Minutes timer
// Select minute interval: Every minute (or however often you want to check and send due notifications)
// Failure notification settings: Notify me daily (or whatever you prefer here. It shouldn't fail often)

// The only configuration needed should be your pushover User Key and API Token

// Sign into pushover.net with your account, get your User Key from the first page and set it below:
var pushoverUser="000000000000000000000000000000";

// Sign into pushover.net, go to Your Applications (Create an Application/API Token), give it a name like
// GCal to Pushover, description if oyu like, skip the URL, an icon if you like. When it's created get the
// API Token/Key from there and set it below:
var pushoverToken="000000000000000000000000000000";



// Configuration done. Code below.

// This will cache our script properties so we don't blow past our read quota
var properties = null

function formatAMPM_(date) {
  var hours = date.getHours();
  var minutes = date.getMinutes();
  var ampm = hours >= 12 ? 'pm' : 'am';
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  minutes = minutes < 10 ? '0'+minutes : minutes;
  var strTime = hours + ':' + minutes + ' ' + ampm;
  return strTime;
}

// Calculates human readable time remaining: 1 hour 32 min
function timeRemainingNaive_(comparisonDate) {
  var timeparts = [
    {name: 'year', div: 31536000000, mod: 10000},
    {name: 'day', div: 86400000, mod: 365},
    {name: 'hour', div: 3600000, mod: 24},
    {name: 'minute', div: 60000, mod: 60},
    //{name: 'second', div: 1000, mod: 60}
  ];
  var
    i = 0,
    l = timeparts.length,
    calc,
    values = [],
    interval = comparisonDate.getTime() - new Date().getTime();
  
    // Ugly hack, but since we only show seconds if the time remaining is under 1 min, then the seconds remaining are not reported
    // Thus for a 5min ahead notification we get 4min remaining, for 10min we get 9. We add a second here to compensate for that.
    if (interval > 60000)
      interval += 60000
      
  while (i < l) {
    calc = Math.floor(interval / timeparts[i].div) % timeparts[i].mod;
    if (calc) {
      values.push(calc + ' ' + timeparts[i].name + (calc != 1 ? 's' : ''));
    }
    i += 1;
  }
  if (values.length === 0) { values.push(Math.round(interval/1000) + ' seconds'); }
  return values.join(', ');
}

// If event uses the default reminders, copy the default reminders as event reminders
function genOverrideReminders_(response, event) {
  //Logger.log('genOverrideReminders_: %s', event.summary)
  //Logger.log('genOverrideReminders_: %s', response.defaultReminders)
  if (event.reminders.useDefault) {
    for (defaultReminderIndex in response.defaultReminders) {
      defaultReminder = response.defaultReminders[defaultReminderIndex]
      if (typeof event.reminders.overrides === "undefined")
        event.reminders.overrides = [];
      //Logger.log(defaultReminder)
      if (typeof defaultReminder === "object")
        event.reminders.overrides.push(defaultReminder);
    }
  }
  return event;   
}

function getAllProperties_(keys) {
  if (properties == null) {
    var UserProperties = PropertiesService.getUserProperties();
    properties = UserProperties.getProperties()
  }
}

function getLastAlert_(event) {
  return new Date(properties[event.id] || null) 
}

function setLastAlert_(event) {
  var now = new Date()
  var UserProperties = PropertiesService.getUserProperties();
  UserProperties.setProperty(event.id, now)
  // Also set in our cached copy of the properties to save a re-read
  properties[event.id] = now
}

function deleteAllLastAlerts(event) {
  var UserProperties = PropertiesService.getUserProperties();
  UserProperties.deleteAllProperties()
  // Also wipe our cached properties copy
  properties = {}
}

// We give this function keys of visible future events and wipe anything not in the list
// thus cleaning up old events that have passed or have been removed
function deleteAllLastAlertsExcept_(keys) {
  var UserProperties = PropertiesService.getUserProperties();
  properties = UserProperties.getProperties()

  Object.keys(properties).forEach(function(key) {
    if (keys.indexOf(key) == -1)
      delete properties[key]
  })
  UserProperties.setProperties(properties, true)
}


// Use the pushover API to send push notifications
function sendPushoverMessage_(event, when) {
  //setup the Pushover API call 
  var baseUrl = "https://api.pushover.net/1/messages.json";
  
  var humanStart = timeRemainingNaive_(when)
  var title = event.summary + " in " + humanStart + " at " + formatAMPM_(when)

  var location = event.location
  var message = event.description || ''
  
  //Logger.log('In sendPushoverMessage_')
  
  if (message)
    message+='<br><br>'
    
  if (location)
    message+='Location:<br><a href="https://maps.google.com/?q=' + location + '">' + location + '</a>'
    
  message = message || event.summary
   
  var parameters = {
    'token': pushoverToken, //paste your API Key between the single quotation marks 
    'user': pushoverUser, //paste your User Key between the single quotation marks 
    'title': title,
    'message': message,
    'html': 1,
    'url': event.htmlLink,
    'url_title': 'Show Event',
    'priority': '2',
    'retry': 30,
    'expire': 300
  }; 
  
  var options = {
    'method' : 'POST', 
    'payload' : parameters 
  }; 
  
  //Logger.log('Pushover sending: %s', parameters)
  
  //send the Pushover API call 
  var response = UrlFetchApp.fetch(baseUrl,options);
  if (response.getResponseCode() == 200)
    return true
  else
    return false
}

function notifyIfDue_(event) {
  var MINUTE_MS = 60000;
  var HOUR_MS = 60*MINUTE_MS;
  var DAY_MS = 24*HOUR_MS;
  var WEEK_MS = 7*DAY_MS;
  
  var when = event.start.dateTime;
  if (!when) {
    when = event.start.date;
  }
 
  var lastAlertDateTime = getLastAlert_(event)
  
  when = new Date(when)
  
  //Logger.log(timeRemainingNaive_(when))
  
  // Add a synthetic notification 1 minute before the actual event
  if (event.reminders.overrides)
    event.reminders.overrides.push({'method' : 'self', 'minutes' : 1})
  
  // Iterate overa all notifications  
  for (reminderIndex in event.reminders.overrides) {
    var reminder=event.reminders.overrides[reminderIndex]
    
    
    // Based on the notification compute for how many milliseconds ahead the notification is scheduled
    if (typeof reminder.minutes === "number")
      diff_ms = reminder.minutes * MINUTE_MS;
    else if (typeof reminder.hours === "number")
      diff_ms = reminder.hours * HOUR_MS;
    else if (typeof reminder.days === "number")
      diff_ms = reminder.days * DAY_MS;
    else if (typeof reminder.weeks === "number")
      diff_ms = reminder.weeks * WEEK_MS;
    
    var now = new Date()
    var alertDateTime = new Date(when.getTime() - diff_ms)
    
    //Logger.log('%s :: Alert analysis :: lastAlertDateTime: %s    alertDateTime: %s    now: %s    alertDateTime<=now: %s   alertDateTime > lastAlertDateTime: %s    (alertDateTime <= now && alertDateTime > lastAlertDateTime && when >= now): %s    when >= now: %s', event.summary, lastAlertDateTime, alertDateTime, now,  alertDateTime <= now, alertDateTime > lastAlertDateTime, (alertDateTime <= now && alertDateTime > lastAlertDateTime && when >= now), when >= now)
    //Logger.log(Date.parse(alertDateTime))
    //Logger.log(Date.parse(lastAlertDateTime))
    
    
    // If the notification time is now or has passed and it's for after the last time we notified, we need to notify again
    // This way if the script fails to run for some time, it will catch up on any missed notifications for events that have NOT passed
    if (alertDateTime <= now && alertDateTime > lastAlertDateTime && when >= now) {
      //Logger.log('Need to alert!')
      
      // Check if the notification succeeded and only then save the alert time
      if (sendPushoverMessage_(event, when)) {
        //Logger.log('Alert sent ok!!')
        setLastAlert_(event)
        lastAlertDateTime = getLastAlert_(event)
        // No need to keep processing notifications if a push notification was sent.
        break
      }
    }
  }
}

// Grab the next year of events from the calendar and process each
function mainProcessEvents() {
  var eventIDs = []
  var calendarId = 'primary';
  var now = new Date()
  var optionalArgs = {
    timeMin: now.toISOString(),
    timeMax: new Date(now.setMonth(now.getMonth()+12)).toISOString(),
    showDeleted: false,
    singleEvents: true,
    orderBy: 'startTime'
  };
  var response = Calendar.Events.list(calendarId, optionalArgs);
  var events = response.items;
  var defaultReminders = response.defaultReminders;
  
  // Read and cache all script properties
  getAllProperties_()
  
  if (events.length > 0) {
    for (i = 0; i < events.length; i++) {
      var event = events[i];
      
      eventIDs.push(event.id)
      event = genOverrideReminders_(response, event);
      notifyIfDue_(event)
      ////Logger.log(isDue(event));
    }
  } else {
    //Logger.log('No upcoming events found.');
  }

  deleteAllLastAlertsExcept_(eventIDs)
  //deleteAllLastAlerts_()
  delete response.items
  //Logger.log(response)
}
