# Google-Calendar-To-Pushover
I always miss important google calendar events. No more! This script.google.com code will look through your google calendar as often as you like and will send you pushover notifications. You will get a notification for each reminder time in each event and at the beginning of the actual event. 

## Installation
Paste this code in a script.google.com project, fill out the 2 variables **pushoverUser** and **pushoverToken** at the top of the code file 

Click Edit/Current Project Triggers

Click Add Trigger, fill the form as follows:
  - Chose which function to run: mainProcessEvents
  - Which runs at deployment: Head
  - Select event source: Time-driven
  - Select type of time based trigger: Minutes timer
  - Select minute interval: Every minute (or however often you want to check and send due notifications)
  - Failure notification settings: Notify me daily (or whatever you prefer here. It shouldn't fail often)
  - Save
  
 It should be working.
