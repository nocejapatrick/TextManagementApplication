var express = require('express');
const fileUpload = require('express-fileupload');
const fs = require('fs');
const XLSX = require('xlsx');
var router = express.Router();

const {
  sendMessage
} = require("../controllers/GSMController");

const uploadOpts = {
  useTempFiles : true,
  tempFileDir : '/tmp/'
}


/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Text Web Application' });
});

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

router.post('/upload-csv/send-email',fileUpload(uploadOpts),async (req, res, next)=>{
  try{
    const { file } = req.files
    if(file.mimetype !== 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'){
      return res.status(400).json({msg: 'File Invalid'});
      fs.unlinkSync(file.tempFilePath);
    }
    // await sendMessage();
    
    const workbook = XLSX.readFile(file.tempFilePath);
    const sheetName = workbook.SheetNames[0];
    const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
    

    for(let i = 0; i < data.length; i++){
      await sleep(3000);
      await sendMessage(data[i].contactNumber, "TESDA has sent an email to your account "+data[i].email);
      // console.log(data[i].contactNumber+" || "+"TESDA has send an email to your account "+data[i].email);
    }
    return res.status(200).json({msg: 'Successfully Sent'});

  }catch(error){
    console.log(error)
  }
  // return {files: req.files};
});

module.exports = router;
