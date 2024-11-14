const serialportgsm = require('serialport-gsm')
// const SMSMessage = require('./models/SMSMessage');
const modem = serialportgsm.Modem()

const options = {
    baudRate: 115200,
    dataBits: 8,
    stopBits: 1,
    parity: 'none',
    rtscts: false,
    xon: false,
    xoff: false,
    xany: false,
    autoDeleteOnReceive: true,
    enableConcatenation: true,
    incomingCallIndication: true,
    incomingSMSIndication: true,
    pin: '',
    customInitCommand: '',
    cnmiCommand: 'AT+CNMI=2,1,0,2,1',
    logger: console
}

const checkList = async ()=>{
    return await serialportgsm.list().then((res)=>{
        return res[0].path;
    });
}

const openConnection = async () => {
    let checklist = await checkList();
    modem.open(process.env.COM_PORT, options, {});
};

const closeConnection = async () => {
    modem.close()
};

const onOpen = async () =>{
    modem.on('open', data => {
        modem.initializeModem(async ()=>{
            // await sendMessage()
        });
    })
}

const sendMessage = async(number,message) => {
    try{
        modem.sendSMS(number, message, false, (res)=>{
            console.log(res)
        });
    }catch(error){
        return res.status(400).json({ msg: error});
    }
   
}

const onNewMessage = async() =>{
    modem.on('onNewMessage', (newMessage)=>{
        console.log(newMessage)
    })
    
}

const onMemoryFull = async() =>{
    modem.on('onMemoryFull', (result)=>{
        console.log(result)
    })
}

const onError = async() => {
    modem.on('error', result => console.log(result) )
}

const getSimInbox = async() =>{
    modem.getSimInbox((inbox)=>{
        console.log(inbox)
    });
}

const sendSMS = async (req, res) => {
    // res.send("Get All User");
    const number = req.body.number;
    const message = req.body.message;
    try{
        if(!number){
            return res.status(400).json({ msg: "Provide Number"});
        }
        if(!message){
            return res.status(400).json({ msg: "Provide Message"});
        }

        sendMessage(number,message);
        return res.status(200).json({recipient: number, message: message, msg: "Send Successfully"});
    }catch(error){
        return res.status(400).json({recipient: number, message: message, msg: error});
    }
  
};

const deleteAllMessageFromInbox = async ()=>{
    modem.deleteAllSimMessages((res)=>{
        console.log(res)
    })
}

// const smsMessage = new SMSMessage({recipient:"09354037946",sender:"09477704495", message:"A sample message"});
// smsMessage.save().then(()=>console.log("message saved"));


module.exports = {
    openConnection,
    onOpen,
    onError,
    onMemoryFull,
    onNewMessage,
    sendMessage,
    sendSMS,
    deleteAllMessageFromInbox
}