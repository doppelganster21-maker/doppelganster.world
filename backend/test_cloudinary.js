import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

(async () => {
  try {
    const res = await cloudinary.uploader.upload('https://upload.wikimedia.org/wikipedia/commons/4/47/PNG_transparency_demonstration_1.png', { folder: 'doppelganster_test' });
    console.log('Cloudinary test success:', res.secure_url);
  } catch (err) {
    console.error('Cloudinary test error:', err);
  }
})();
