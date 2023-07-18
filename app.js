var cron = require('node-cron')

cron.schedule('* * * * * * ',()=>{
    console.log("Hello , have good day!")
})