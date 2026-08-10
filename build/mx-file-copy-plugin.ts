import fs from 'node:fs';
import path from 'node:path';

export interface FileCopyConfig {
  from: string;
  to: string;
  isDelete?: boolean;
}

const dir = process.cwd();
export default function mxFileCopyPlugin(fileArr: FileCopyConfig[]) {
  return {
    name: 'mx-file-copy-plugin',
    writeBundle() {
      fileArr.forEach((file) => {
        const fromFlie = path.join(dir, file.from);
        const toFlie = path.join(dir, file.to);
        if (file.isDelete) {
          fs.access(fromFlie, fs.constants.F_OK, (err) => {
            if (!err) {
              fs.rename(fromFlie, toFlie, function (err) {
                if (err) throw err;
              });
            }
          });
        } else {
          const readStream = fs.createReadStream(fromFlie);
          const writeStream = fs.createWriteStream(toFlie);
          readStream.pipe(writeStream);
        }
      });
    },
  };
}
