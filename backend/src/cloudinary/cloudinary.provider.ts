import { v2 as cloudinary } from 'cloudinary';

export const CloudinaryProvider = {
    provide: 'CLOUDINARY',
    useFactory: () => {
        return cloudinary.config({
            cloud_name: 'dngx0t50o',
            api_key: '746148137783878',
            api_secret: 'feEncQu_X3fPPVJSVwdatxpLExM',
        });
    },
};
