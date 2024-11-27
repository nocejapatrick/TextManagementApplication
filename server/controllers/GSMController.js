const serialportgsm = require('serialport-gsm')
const SMSMessage = require('../models/SMSMessage');
const SMSTransaction = require('../models/SMSTransaction');
const SMSTransactionMessage = require('../models/SMSTransactionMessage');
const SMSQuestionAnswer = require('../models/SMSQuestionAnswer');
const axios = require('axios');
const modem = serialportgsm.Modem()
const https = require('https');

const agent = new https.Agent({  
    rejectUnauthorized: false
  });

const questions = [
    {
        id: 1,
        message:[
            "Ang TESDA Central Office ay nagsasagawa ng maikling survey para sa mga nagtapos ng training anim na buwan mula ng nakumpleto nila ito upang\n",
            "suriin ang iyong employment status. Ang survey ay may 2 hanggang 3 tanong, at ang lahat ng sagot ay kumpidensyal ayon sa\n",
            "Data Privacy Act of 2012 (RA 10173). Mag-reply ng 1 para lumahok o 2 kung hindi makakapag-participate. Salamat!"
        ],
        answers:[
            "1","2"
        ],
        _1: 2,
        _2: 0 
    },
    {
        id: 2,
        message:[
            "6 months na mula ng nakatapos ka sa TESDA! May work ka na ba? Mag-reply ng 1 kung oo, 2 kung hindi."
        ],
        answers:[
            "1","2"
        ],
        _1: 3,
        _2: 4
    },
    {
        id: 3,
        message:[
            "Ang kasalukuyan mo bang trabaho ay may kaugnayan sa programang natapos mo sa TESDA? Mag-reply ng 1 kung oo, 2 kung hindi."
        ],
        answers:[
            "1","2"
        ],
        _1: 5,
        _2: 5
    },
    {
        id: 4,
        message:[
            "Anong dahilan kung bakit wala kang trabaho? \n Pumili lamang ng isa. I-reply ang bilang ng iyong napili",
            "1 Naghahanap ng trabaho pero hindi pa nakakahanap \n2 Naniniwala na walang available na trabaho",
            "3 Naghihintay ng resulta o naka-pending na aplikasyon \n4 Naghihintay na matawag muli sa dating trabaho",
            "5 May pansamantalang sakit o kapansanan \n6 May permanenteng kapansanan \n7 Masamang panahon\n 8 Masyado pang bata, matanda, o retirado",
            "9 Tungkulin sa bahay o pamilya \n10 Nag-aaral"
        ],
        answers: [
            "1","2","3","4","5","6","7","8","9","10"
        ],
        _1: 0,
        _2: 0,
        _3: 0,
        _4: 0,
        _5: 0,
        _6: 0,
        _7: 0,
        _8: 0,
        _9: 0,
        _10: 0
    },
    {
        id: 5,
        message:[
            "Magkano ang iyong buwanang kita?",
            "1 10000 and below\n2 10001 - 20000\n3 20001 - 30000",
            "4 30001 - 40000\n5 40001 - 50000\n6 50001 and above"
        ],
        answers: [
           "1","2","3","4","5","6"
        ],
        _1: 0,
        _2: 0,
        _3: 0,
        _4: 0,
        _5: 0,
        _6: 0,
    }
]

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

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
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

const returnLatestUnansweredQuestionId = (questions)=>{
    for(var i = 0; i < questions.length; i++){
        if(questions[i].answered == false){
            return questions[i].id;
        }
    }
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
        let currentQuestionId = smsTransaction.currentQuestionId;
        let currentQuestion = questions[questions.findIndex(x=>x.id== currentQuestionId)];
     
    


        if(!currentQuestion.answers.includes(message)){
            if(sender == smsTransaction.recipient){
                await sendMessage(smsTransaction.recipient,
                        "Invalid Reply. Kindly choose on the given list of answers"
                    );
                console.log( "Invalid Reply. Kindly choose on the given list of answers")
            }else{
                return;
            }
            console.log("Invalid Response");
        }else{
            console.log("SEnder "+sender);
            console.log("recipient "+ smsTransaction.recipient)
            if(sender != smsTransaction.recipient){
                console.log("wrong")
                return;
            }else{
                console.log("right")
                let concatReply = "_"+message;
                const smsQuestionAnswer = new SMSQuestionAnswer({smsTransactionId: smsTransaction._id, questionId: currentQuestion.id, answer: message});
                await smsQuestionAnswer.save();

                if(currentQuestion[concatReply] == 0){
                    const getSMSQuestionAnswers = await SMSQuestionAnswer.find({smsTransactionId: smsTransaction._id});
                    const sendSMSTransactionEnd = {
                        transactionId: smsTransaction._id,
                        messages: getSMSQuestionAnswers
                    };

                    const res = await axios.post('https://setg.tesda.gov.ph/api/sms', sendSMSTransactionEnd,
                    {
                        httpsAgent: agent
                    });
                    console.log(res);

                    await smsTransaction.updateOne({isOpen: false});
                    await sendMessage(smsTransaction.recipient,
                        "Thank you for the successfull survey"
                    );
                }else{
                    console.log("send messages again")
                    currentQuestionId = currentQuestion[concatReply];
                    currentQuestion = questions[questions.findIndex(x=>x.id== currentQuestionId)];
                    await smsTransaction.updateOne({currentQuestionId: currentQuestionId});
                    let messages  = currentQuestion.message;
                    for(var i = 0; i < messages.length; i++){
                        await sleep(2000);
                        await sendMessage(smsTransaction.recipient,
                            messages[i]
                        );
                    }
                  
                }
             
                console.log("Cool Response")
            }
        }
        console.log("SMS Transaction Message Saved")
    }
}

const sendMessage = async(number,message) => {
    try{
        const newMessage = {
            transactionNumber: number,
            recipient: number,
            sender: process.env.CURRENT_SIMCARD_NUMBER,
            message: message,
            dateTimeSent: Date.now()
        }
        await savingTransactionMessage(newMessage);
        await modem.sendSMS(number, message, false, async (res)=>{
            if(res?.data?.message != null){
                console.log(res.data.message)
                console.log(res.data.recipient)
                console.log(res.status)
            }
       
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
         console.log(newMessage);
        savingTransactionMessage(message);
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

const numbersToSend = ['639285202609','639618590286',
    '639985339527',
    '639178811518',
    '639176519352',
    '639164865393',
    '639993600802',
    '639209483868',
    '639175696962',
    '639173239157',
];

const sendSMSTransaction = async()=>{
     for(var i = 0; i < numbersToSend.length;i++){
        for(var j = 0; j < 1;j++){
            await sleep(2000);
            for(var k = 0; k < questions[j].message.length; k++){
                await sleep(2000);
                console.log("Sending message"+questions[j].message[k]);
                sendMessage(numbersToSend[i],questions[j].message[k]);
            }
          
            console.log("Sending to:"+numbersToSend[i]);
        }
     }
}

    // sendSMSTransaction();

const deleteAllMessageFromInbox = async ()=>{
    modem.deleteAllSimMessages((res)=>{
        console.log(res)
    })
}

async function findMessage(){
    const smsTransaction = new SMSTransaction({recipient: "639173239157",isOpen:true, open_at: Date.now(), currentQuestionId: 1});
        smsTransaction.save().then(()=>console.log("transaction saved"));
        
    // const smsTransaction = await SMSTransaction.findOneAndUpdate(
    //     { _id: "673ea4e781dfcda80416a717", 'questions.id': 1},
    //     { '$set': {'questions.$.answered' : true, 'questions.$.sentOn': Date.now()}}
    // );
    // console.log(smsTransaction);

    // const smsMessage = await SMSMessage.findById('673c5d207265e661eab47dcd');
    // const smsTransaction = await SMSTransaction.findById('673c5e4c2cab02d2453891de');
    // const smsTransactionMessage = new SMSTransactionMessage({
    //     smstransaction: smsTransaction._id,
    //     smsmessage: smsMessage._id
    // });
    // smsTransactionMessage.save().then(()=>console.log("transaction message saved"));
    // const smsTransactionMessage = await SMSTransactionMessage.findById('673d41fa49d90d92d60dc70d')
    // .populate('smsmessage').populate('smstransaction');
    // console.log(smsTransactionMessage);
    // const smsTransactionMessage = await query3.findOne().populate('SMSMessage');
    // console.log(smsTransactionMessage);
}
 //findMessage();
const sample = async ()=>{
 
    try{
        const transaction = await SMSTransaction.findById('6746b4ca63babbdc391ef57e');
        console.log(transaction);
        // https://setg.tesda.gov.ph/api/sms
       
        const res = await axios.post('https://setg.tesda.gov.ph/api/sms', transaction,
          {
            httpsAgent: agent
          });
          console.log(res);
    }catch(error){
        console.log(error);
    }
   
}
//  sample();

const setSMSTransaction = async (req, res) => {
    console.log("SET")
    const number = req.body.recipient;
    try{
        const getSMSTransaction = await SMSTransaction.findOne({recipient: number, isOpen:true});
        if(getSMSTransaction){
            return res.status(400).json({recipient: number, message: "SMS Number has currently in a message transaction. Try again later."});
        }
        const smsTransaction = new SMSTransaction({recipient: number,isOpen:true, open_at: Date.now(), currentQuestionId: 1});
        smsTransaction.save();
        
        for(var j = 0; j < 1;j++){
            await sleep(2000);
            for(var k = 0; k < questions[j].message.length; k++){
                await sleep(2000);
                await sendMessage(number,questions[j].message[k]);
                
            }
        }

        return res.status(200).json({recipient: number, message: "SMS Transaction Saved", transactionId: smsTransaction._id});
    }catch(error){
        return res.status(400).json({recipient: number, message: "SMS Transaction Failed", msg: error});
    }
 
}

const sendSMSTransactionMessage = async (req, res) => {
    const number = req.body.number;
    try{
        
         return res.status(200).json({recipient: number, message: questions[j].message[k], msg: "Sent Successfully"});
    }catch(error){
        return res.status(400).json({recipient: number, message: "SMS Transaction Message Failed", msg: error});
    }
}



module.exports = {
    openConnection,
    onOpen,
    onError,
    onMemoryFull,
    onNewMessage,
    sendMessage,
    sendSMS,
    deleteAllMessageFromInbox,
    setSMSTransaction,
    sendSMSTransactionMessage
}