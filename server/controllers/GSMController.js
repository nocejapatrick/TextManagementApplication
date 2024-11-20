const serialportgsm = require('serialport-gsm')
const SMSMessage = require('../models/SMSMessage');
const SMSTransaction = require('../models/SMSTransaction');
const SMSTransactionMessage = require('../models/SMSTransactionMessage');
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

const savingTransactionMessage = async(newMessage)=>{
    const { transactionNumber, recipient, sender, message, dateTimeSent } = newMessage;

    const smsTransaction = await SMSTransaction.findOne({recipient: transactionNumber, isOpen: true});

    const smsMessage = new SMSMessage({
        recipient: recipient,
        message: message,
        sender: sender,
        sendOn: dateTimeSent
    });
    await smsMessage.save()

    if(smsTransaction){
        const smsTransactionMessage = new SMSTransactionMessage({
            smstransaction: smsTransaction._id,
            smsmessage: smsMessage._id
        });
        await smsTransactionMessage.save();
        console.log("SMS Transaction Message Saved")
    }
}

const sendMessage = async(number,message) => {
    try{
        modem.sendSMS(number, message, false,  (res)=>{
            const newMessage = {
                transactionNumber: number,
                recipient: number,
                sender: process.env.CURRENT_SIMCARD_NUMBER,
                message: message,
                dateTimeSent: Date.now()
            }
            savingTransactionMessage(newMessage);
        });
    }catch(error){
        throw new Error(error)
    }
   
}

const onNewMessage = async() =>{
    modem.on('onNewMessage', async (newMessage)=>{
        const message = {
            transactionNumber: newMessage[0].sender,
            recipient: process.env.CURRENT_SIMCARD_NUMBER,
            sender: newMessage[0].sender,
            message: newMessage[0].message,
            dateTimeSent: new Date(newMessage[0].dateTimeSent)
        };
        savingTransactionMessage(message);
     

        // const smsMessage = new SMSMessage({
        //     recipient: process.env.CURRENT_SIMCARD_NUMBER,
        //     message: newMessage[0].message,
        //     sender: newMessage[0].sender,
        //     sendOn: new Date(newMessage[0].dateTimeSent)
        // });
        // smsMessage.save().then(()=>console.log("saved text")); 

        // console.log(response)
        // console.log(newMessage[0].sender);
        // console.log(newMessage[0].message);
        // console.log(new Date(newMessage[0].dateTimeSent));
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
// smsMessage.save().then(()=>console.log("message saved")).catch((e)=>{
//     console.log(e);
//     });

// const smsTransaction = new SMSTransaction({recipient:"09354037946", isOpen: true, open_at:  new Date("11/19/2024")});
// smsTransaction.save().then(()=>console.log("transaction saved"));


async function findMessage(){
    const smsMessage = await SMSMessage.findById('673c5d207265e661eab47dcd');
    const smsTransaction = await SMSTransaction.findById('673c5e4c2cab02d2453891de');
    const smsTransactionMessage = new SMSTransactionMessage({
        smstransaction: smsTransaction._id,
        smsmessage: smsMessage._id
    });
    smsTransactionMessage.save().then(()=>console.log("transaction message saved"));
    // const smsTransactionMessage = await SMSTransactionMessage.findById('673d41fa49d90d92d60dc70d')
    // .populate('smsmessage').populate('smstransaction');
    // console.log(smsTransactionMessage);
    // const smsTransactionMessage = await query3.findOne().populate('SMSMessage');
    // console.log(smsTransactionMessage);
}

async function saveReply(){

}



// findMessage();

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