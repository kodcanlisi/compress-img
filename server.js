// import express from 'express';
// import DB from './src/database';
// import multer from 'multer';
// import path from 'path';
// import fs from 'fs';
// import cors from 'cors';

const express = require('express');
const DB = require('./src/database');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();

app.use(cors())
const upload = multer({ dest: 'temp/' })
const { compress } = require("compress-images/promise");
const { PORT } = process.env;



app.use('/build',express.static(path.join(__dirname, 'build')));
app.use('/temp',express.static(path.join(__dirname, 'temp')));

app.listen(PORT, () => {
  console.log('server')
});


const MyFun = async ({ fileName = null, engineSetup = {} }) => {
  try{
    let INPUT_path_to_your_images = `temp/${fileName}`;
    let OUTPUT_path = "build/";
    console.log(engineSetup)
    const img = await compress({
      source: INPUT_path_to_your_images,
      destination: OUTPUT_path,
      enginesSetup:
        //jpg: { engine: "mozjpeg", command: ["-quality", "70"] },
        //png: { engine: "pngcrush", command:[]  },
        //svg: { engine: "svgo", command: false },
        //gif: {engine: 'gifsicle', command: ['--scale', ' 0.1']}
        engineSetup
  
    });
    const { err, statistic, completed } = img
    console.log("COMPRESSION FINISHED")
    return img;
  } catch(e){
    throw new Error(e)
  }
}

app.post('/data', upload.single('img'), async (req, res) => {
  if (!req.file)
    return res.send("dosya yok");
  const full_path = path.resolve("./temp", req.file.filename);
  let extArray = req.file.mimetype.split("/");
  let extension = extArray[extArray.length - 1];
  if (extension.match(/xml/)) {
    extension = "svg"
  }
  fs.renameSync(full_path, full_path + "." + extension);

  const result = await MyFun(req.file.filename + "." + extension);
  res.json(result);
})

app.post('/gif', upload.single('img'), async (req, res) => {
  console.log("GIF_REQUEST COMING", req.body);
  try {
    if (!req.file)
      return res.status(401).send({error:'Dosya Seçilmedi'});
    const full_path = path.resolve("./temp", req.file.filename);
    let extArray = req.file.mimetype.split("/");
    let extension = extArray[extArray.length - 1];
    if (extension.toString() !== 'gif') {
      return res.status(401).send({ error: 'IMAGE_NOT_GIF' });
    }

    //Rename image
    fs.renameSync(full_path, full_path+"."+extension);

    const GIF_ENGINE = { gif: { engine: 'gifsicle', command: ['--scale', ' 1'] } };
    const options = { fileName: req.file.filename + "." + extension, engineSetup: GIF_ENGINE };
    //Check scale is defined
    if(req.body.scale){
      if (Number(req.body.scale) <=1 && Number(req.body.scale) >=0) {
        GIF_ENGINE.gif.command[1] = Number(req.body.scale);
      }else{
        return res.status(401).send({error:'scale değeri 0-1 arasında bir değer olmalıdır'})
      }
    }

    const result = await MyFun(options);
    res.json(result);
  } catch (e) {
    res.send(e.message)
  }
});

app.post('/svg', upload.single('img'), async (req, res) => {
  console.log("GIF_REQUEST COMING", req.body);
  try {
    if (!req.file)
      return res.status(401).send({error:'Dosya Seçilmedi'});
    const full_path = path.resolve("./temp", req.file.filename);
    let extArray = req.file.mimetype.split("/");
    let extension = extArray[extArray.length - 1];

    // if (!extension.match(/xml/)) {
    //   return res.status(401).send({ error: 'IMAGE_NOT_SVG' });
    // }

    extension = "svg";
    //Rename image
    fs.renameSync(full_path, full_path+"."+extension);

    const SVG_ENGINE = { svg: { engine: 'svgo', command: [] } };
    const options = { fileName: req.file.filename + "." + extension, engineSetup: SVG_ENGINE };

    const result = await MyFun(options);
     res.json(result);
  } catch (e) {
    res.send(e.message)
  }
});

app.post('/png', upload.single('img'), async (req, res) => {
  console.log("PNG_REQUEST COMING", req.body);
  try {
    if (!req.file)
      return res.status(401).send({error:'Dosya Seçilmedi'});
    const full_path = path.resolve("./temp", req.file.filename);
    let extArray = req.file.mimetype.split("/");
    let extension = extArray[extArray.length - 1];

    if (extension.toString() !== 'png') {
      return res.status(401).send({ error: 'IMAGE_NOT_PNG' });
    }

    extension = "png";
    let defaultEngine = 'pngout';
    let isWebp = false;

    const PNG_ENGINE = { png: { engine: defaultEngine, command: [] } };

    //check the engine is written
    if(req.body.engine == 'pngcrush') {
      PNG_ENGINE.png.engine = 'pngcrush';
      PNG_ENGINE.png.command.push('-reduce');
      PNG_ENGINE.png.command.push('-brute');
    }

    if(req.body.engine == 'webp') {
      PNG_ENGINE.png.engine = 'webp';
      PNG_ENGINE.png.command.push('-q');
      PNG_ENGINE.png.command.push('70');

      if(req.body.quality >0 && req.body.quality <= 100) {
        PNG_ENGINE.png.command[1] = req.body.quality;
      }
      isWebp = true;
    }

    //Rename image
    fs.renameSync(full_path, full_path+"."+extension);
    const options = { fileName: req.file.filename + "." + extension, engineSetup: PNG_ENGINE };

    let result = await MyFun(options);
    if(isWebp && result.errors.length < 1) {
      fs.renameSync("./build/"+req.file.filename+"."+extension, "./build/"+req.file.filename+"."+"webp");
      result.statistics[0].path_out_new = 'build/'+req.file.filename+"."+"webp"
    }
     res.json(result);
  } catch (e) {
    res.send(e.message)
  }
});

app.post('/jpg', upload.single('img'), async (req, res) => {
  console.log("JPG_REQUEST COMING", req.body);
  try {
    if (!req.file)
      return res.status(401).send({error:'Dosya Seçilmedi'});
    const full_path = path.resolve("./temp", req.file.filename);
    let extArray = req.file.mimetype.split("/");
    let extension = extArray[extArray.length - 1];

    const isJpeg = extension.toString().toLowerCase() == "jpeg" || extension.toString().toLowerCase() == "jpg";
    if (isJpeg == false) {
      console.log(extension, extension == "jpeg")
      return res.status(401).send({ error: 'IMAGE_NOT_JPG' });
    }

    //Rename image
    fs.renameSync(full_path, full_path+"."+extension);

    const JPG_ENGINE = { jpg: { engine: 'mozjpeg', command: ["-quality", "60"]  } };
    const options = { fileName: req.file.filename + "." + extension, engineSetup: JPG_ENGINE };

    if(req.body.quality) {
      if(Number(req.body.quality) > 1 && Number(req.body.quality) < 100) {
        console.log("QUALITY")
        JPG_ENGINE.jpg.command[1] = req.body.quality;
      }
    }

    const result = await MyFun(options);
     res.json(result);
  } catch (e) {
    res.send(e.message)
  }
});

const db = DB(process.env.DB_NAME);
db.on('error', (error) => console.log(error));
db.once('open', () => console.log('Mongodb connected'));