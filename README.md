# Google-Calendar-To-Pushover
I always miss important google calendar events. No more! This script.google.com code will look through your google calendar as often as you like and will send you pushover notifications. You will get a notification for each reminder time in each event and at the beginning of the actual event. 

## Setting up an Application/API Token in pushover.net:
Sign into pushover.net with your account, get your User Key from the first page.

Go to Your Applications (Create an Application/API Token), give it a name like
GCal to Pushover, description if oyu like, skip the URL, an icon if you like. When it's created get the
API Token/Key from there.

## Installation
Paste this code in a script.google.com project, fill out the 2 variables **pushoverUser** and **pushoverToken** at the top of the code file 

Save

**IMPORTANT**: Click Run / Run function  / mainProcessEvents. This will prompt google to ask you for authorization to run this code. Once outhorized it can run on a schedule.

Now configure a time based trigger

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
