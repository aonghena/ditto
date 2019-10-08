var request = require('request-promise');
var faceId = "";
var result = "";
var express= require('express');
var app = express();
var bodyParser = require('body-parser');
var urlencodedParser = bodyParser.urlencoded({ extended: false });
const fs = require('fs');

let rawdata = fs.readFileSync('billionaires.json');
let microsoftList = JSON.parse(rawdata);


app.listen(3000);

app.set('view engine', 'ejs');

app.use('/asset', express.static("asset"));

app.get('/', function(req, res){
    console.log(req.query);
    res.render('index', {qs: req.query});
});

//just outputs top face for now
app.post('/find', urlencodedParser,async function(req, res){
    var face = req.body.faceInput;
    var faceId = await detect(face, 'billion');
    console.log(faceId);
    if(faceId == ""){
        res.render('result', {qs: "", face: "https://i.imgur.com/HxFCozp.jpg", faceTo: "https://i.imgur.com/HxFCozp.jpg", faceName: "", confidenceLevel: ""});
    }else{
    var faceList = await find(faceId, 'billion');
    var topResult = faceList[0]['persistedFaceId'];
    var topResultConfidence = Math.ceil(faceList[0]['confidence'] * 100);
    console.log(topResult);
    console.log(faceList[0]);
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


async function detect(photo, faceList){ 
    return new Promise(function(resolve, reject){request({
        headers: {
            'token' : 'AVeJyhfQVU25HEDtzA5GQ7fkjDqs7d',
            'url' : photo
        },
        uri: 'http://157.245.127.122:6978/detect',
        method: 'GET'
      }, function (err, res, body) {
            console.log(body);
            try{
                result = JSON.parse(body);
                faceId = result.faceId;
                resolve(result.faceId);
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
