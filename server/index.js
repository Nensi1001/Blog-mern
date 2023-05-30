const express = require('express');
const app = express();
const cors = require('cors');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = require('./models/User');
const Post = require('./models/Post');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const multer = require('multer');
const uploadMiddleware = multer({ dest: 'uploads/' });
const fs = require('fs');
const path = require('path');
const secret = 'thisismysecretkey';

app.use(express.json());
app.use(cookieParser());
app.use('/uploads',express.static(__dirname + '/uploads'));
mongoose.connect('mongodb+srv://nensijogani:Varsha%4012@node.4gb4ju2.mongodb.net/blog')

app.use(cors({ credentials: true, origin: 'http://localhost:3000' }));
app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    try {
        const userData = await User.create({
            username,
            password: bcrypt.hash(password, 10)
        })
        res.json(userData);
    }
    catch (e) {
        res.status(400).json(e);
    }
})

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const userData = await User.findOne({ username });
    const isMatch = bcrypt.compare(password, userData.password);
    if (isMatch) {
        jwt.sign({ username, id: userData._id }, secret, {}, (err, token) => {
            if (err) throw err;
            res.cookie('token', token).json({
                id: userData._id,
                username
            });
        })
    }
    else {
        res.status(400).json("wrong credentials");
    }
})
app.get('/profile', (req, res) => {
    const { token } = req.cookies;
    jwt.verify(token, secret, {}, (err, info) => {
        if (err) throw err;
        res.json(info);
    });
    // res.json("ok")
});

app.post('/logout', (req, res) => {
    res.cookie('token', '').json('ok');
})

app.post('/post', uploadMiddleware.single('file'), async (req, res) => {
    const { originalname } = req.file;
    const parts = originalname.split('.');
    const ext = parts[parts.length - 1];
    const oldPath = req.file.path; // use the path property of req.file instead of the `path` variable
    const newPath = oldPath + '.' + ext;
    fs.renameSync(oldPath, newPath);

    const { token } = req.cookies;
    jwt.verify(token, secret, {}, async (err, info) => {
        if (err) throw err;
        const { title, summary, content } = req.body;
        const postDoc = await Post.create({
            title,
            summary,
            content,
            cover: newPath,
            author: info.id
        })
        res.json(postDoc);
    });
});

app.put('/post',uploadMiddleware.single('file'), async (req, res)=>{
    let newPath = null;
    if(req.file){
        const { originalname } = req.file;
        const parts = originalname.split('.');
        const ext = parts[parts.length - 1];
        const oldPath = req.file.path; // use the path property of req.file instead of the `path` variable
        const newPath = oldPath + '.' + ext;
        fs.renameSync(oldPath, newPath);
    }
    const { token } = req.cookies;
    jwt.verify(token, secret, {}, async (err, info) => {
        if (err) throw err;
        const { id,title, summary, content } = req.body;
        const postDoc = await Post.findById(id)
        const isAuthor = JSON.stringify(postDoc.author) === JSON.stringify(info.id);
        if(!isAuthor){
            return res.status(400).json('you are not the author');
        }
        await postDoc.updateOne({title,summary,content,
        cover:newPath ? newPath : postDoc.cover});
            res.json(postDoc);
    });
})

app.get('/post', async (req, res) => {
    res.json(await Post.find()
    .populate('author',['username'])
    .sort({createdAt: -1})
    .limit(20)
    );
});

app.get('/post/:id', async (req,res)=>{
    const {id} = req.params;
    const postDoc = await Post.findById(id).populate('author',['username']);
    res.json(postDoc);
})
app.listen(8000);