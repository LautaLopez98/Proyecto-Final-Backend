import {fileURLToPath} from 'url';
import { dirname } from 'path';
import multer from 'multer';
import bcrypt from 'bcrypt';
import path from 'path';


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);



export default __dirname;


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        let folder = 'documents';
        if (file.fieldname === 'profile') {
            folder = 'profiles';
        } else if (file.fieldname === 'product') {
            folder = 'products';
        } else if (file.fieldname === 'thumbnail') {
            folder = '';
        }
        const basePath = path.join(__dirname, "public", "uploads");
        cb(null, path.join(basePath, folder));
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + "-" + file.originalname;
        cb(null, uniqueSuffix);
    }
});
export const upload = multer({ storage: storage });

const SECRET="CoderLauta"
export const generaHash=password=>bcrypt.hashSync(password, bcrypt.genSaltSync(10))
export const validatePassword=(password, passwordHash)=>bcrypt.compareSync(password, passwordHash)