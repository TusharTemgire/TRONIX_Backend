const AWS = require('aws-sdk');
const multer = require('multer');
const multerS3 = require('multer-s3');
const path = require('path');

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

const s3 = new AWS.S3();

const createUploadMiddleware = (folder) => {
  return multer({
    storage: multerS3({
      s3: s3,
      bucket: process.env.AWS_S3_BUCKET,
      acl: 'public-read',
      metadata: (req, file, cb) => {
        cb(null, { fieldName: file.fieldname });
      },
      key: (req, file, cb) => {
        const fileName = `${folder}/${Date.now().toString()}-${file.originalname}`;
        cb(null, fileName);
      }
    }),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      const filetypes = /jpeg|jpg|png|gif|mp4|mov/;
      const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
      const mimetype = filetypes.test(file.mimetype);
      
      if (mimetype && extname) {
        return cb(null, true);
      } else {
        cb(new Error('Only images (jpeg, jpg, png, gif) and videos (mp4, mov) are allowed!'));
      }
    }
  });
};

const uploadPost = createUploadMiddleware('posts');
const uploadStory = createUploadMiddleware('stories');
const uploadMessage = createUploadMiddleware('messages');
const uploadAvatar = createUploadMiddleware('avatars');

module.exports = {
  s3,
  uploadPost,
  uploadStory,
  uploadMessage,
  uploadAvatar
};