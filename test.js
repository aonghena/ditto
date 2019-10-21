var request = require('request-promise');
var result = "";
var express= require('express');
var app = express();
var bodyParser = require('body-parser');
var formidable = require('formidable');
var urlencodedParser = bodyParser.urlencoded({ extended: false });
const fs = require('fs');
let rawdata = fs.readFileSync('billionaires.json');
let microsoftList = JSON.parse(rawdata);
const path = require("path");
http = require('http'),
util = require('util');

app.listen(80);

app.set('view engine', 'ejs');

app.use('/asset', express.static("asset"));

app.get('/', function(req, res){
    res.render('index', {qs: req.query});
});

//Orient Bambino
//to get userinput image for output and azure upload
app.get("/:image", (req, res) => {
    console.log("test")
    res.sendFile(path.join(__dirname, "./uploads/" +req.params.image));
});

//captures user image from forum
async function getPhoto(req){
    return new Promise(function(resolve, reject){formidable.IncomingForm().parse(req)
        .on('fileBegin', async function(name, file){
            console.log(typeof file.name);
            if(file.name != ""){
                //change if runnning locally
                file.path = __dirname + "/uploads/" + file.name.toUpperCase()
                face = "http://157.245.127.122/" + file.name.toUpperCase() + " "
                ///
                face.trim()
                resolve(face);
            }else{
                resolve("fuck");
            }
        })
    })
}
//just outputs top face for now
app.post('/find', urlencodedParser,async function(req, res){
    var face  = await getPhoto(req)
    //if no photo
    if(face == "fuck"){
        console.log("caught")
        res.render('index', {qs: req.query});
        return
    }
    console.log(face)
    var faceId = await detect(face);
    //if not matches or API is down
    if(typeof faceId == 'undefined'){
        res.render('result', {qs: "", face: "https://i.imgur.com/hZ3Ngi6.jpg", faceTo: "https://i.imgur.com/hZ3Ngi6.jpg", faceName: "", confidenceLevel: ""});
    }else{
        var faceList = await find(faceId.faceId, 'billion');
        var topResult = faceList[0]['persistedFaceId'];
        var topResultConfidence = Math.ceil(faceList[0]['confidence'] * 100);
        var topImage = "";
        var topImageName = "";
        //This is used to search through json for url to use
        for (var i = 0; i < microsoftList.length; i++){
            if (microsoftList[i].persistedFaceId == topResult){
                topImage = microsoftList[i].image;
                topImageName = microsoftList[i].name;
            break;
            }
        }
        res.render('result', {qs: req.query, face: face, faceTo: topImage, faceName: topImageName, confidenceLevel: topResultConfidence});
}});

async function detect(photo){ 
    return new Promise(function(resolve, reject){request({
        headers: {
            'token' : 'AVeJyhfQVU25HEDtzA5GQ7fkjDqs7d',
            'url' : photo
        },
        uri: 'http://157.245.127.122:6978/detect',
        method: 'GET'
      }, function (err, res, body) {
            try{
                result = JSON.parse(body);
                resolve(result[0]);
            }catch(e){
                resolve("");
            }
        })
    })
}

async function find(faceId, faceList){
    return new Promise(function(resolve, reject){request({
        headers: {
            'token' : 'AVeJyhfQVU25HEDtzA5GQ7fkjDqs7d',
            'faceId' : faceId,
            'faceList': faceList
        },
        uri: 'http://157.245.127.122:6978/find',
        method: 'GET'
      }, function (err, response, body) {
            body = JSON.parse(body);
            resolve(body);
      })
      });
}