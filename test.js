var request = require('request-promise');
var result = "";
var express= require('express');
var app = express();
var bodyParser = require('body-parser');
var formidable = require('formidable');
var urlencodedParser = bodyParser.urlencoded({ extended: false });
const fs = require('fs');
const path = require("path");
http = require('http'),
util = require('util');
const asyncBusboy = require('async-busboy')

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
async function getPhoto(req, rnd){
    return new Promise(function(resolve, reject){formidable.IncomingForm().parse(req)
        .on('fileBegin', async function(name, file){
            if(file.name != ""){
                //change if runnning locally
                file.path = __dirname + "/uploads/" + rnd + file.name
                face = "http://157.245.127.122/" + rnd + file.name
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
    var rnd = Math.random().toString(36).substring(2, 9) + Math.random().toString(36).substring(2, 9);
    let {fields} = await asyncBusboy(req)
    var face = await getPhoto(req,rnd)
    //if no photo
    if(face == "fuck"){
        console.log("caught")
        res.render('index', {qs: req.query});
        return
    }
    var faceId = await detect(face);
    //sometimes the API wants to act weird
    if (typeof faceId == "undefined"){
        console.log(faceId);
        //The space somehow fixes this
        faceId = await detect(face+" ")
        //Sometimes the API is stubborn AF and won't return cool stats
        if (typeof faceId == "undefined"){
            console.log(faceId);
            faceId = await detect1(face)
        }
    }
    //if not matches or API is down
    if(typeof faceId == 'undefined'){
        res.render('result', {qs: "", face: "https://i.imgur.com/hZ3Ngi6.jpg", faceTo: "https://i.imgur.com/hZ3Ngi6.jpg", faceName: "", confidenceLevel: "", userDetails: "", matchDetails: ""});
    }else{
        var faceList = await find(faceId.faceId, fields.list);
        var faceAttributes = faceId.faceAttributes;
        var topResult = faceList[0]['persistedFaceId'];
        var topResultConfidence = Math.ceil(faceList[0]['confidence'] * 100);
        var topImage = "";
        var topImageName = "";
        //This is used to search through json for url to use
        litList = JSON.parse(fs.readFileSync(fields.list+'.json'))
        for (var i = 0; i < litList.length; i++){
            if (litList[i].persistedFaceId == topResult){
                topImage = litList[i].image;
                topImageName = litList[i].name;
            break;
            }
        }
        var topImageDetect = await detect(topImage);
        var topImageAttributes = topImageDetect.faceAttributes;
        res.render('result', {qs: req.query, face: face, faceTo: topImage, faceName: topImageName, confidenceLevel: topResultConfidence, userDetails: faceAttributes, matchDetails: topImageAttributes});
}});


/**
 * Returns Full Face features when detect is called
 * @param {*} photo 
 */
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

/**
 * Returns no face features, but has a higher success rate with bad photos
 * @param {} photo 
 */
async function detect1(photo){ 
    return new Promise(function(resolve, reject){request({
        headers: {
            'token' : 'AVeJyhfQVU25HEDtzA5GQ7fkjDqs7d',
            'url' : photo
        },
        uri: 'http://157.245.127.122:6978/detect1',
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
