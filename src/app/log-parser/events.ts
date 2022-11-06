import fs from 'fs';

export async function getJSONData(path: string): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const fileStream = fs.createReadStream(path, {
      encoding: 'utf8',
      autoClose: true,
      start: 0,
    });
    let fullJSON = '';

    fileStream.on('data', (chunk: string) => {
      fullJSON = fullJSON.concat(chunk);
    });
    fileStream.on('end', () => {
      fileStream.close();
      resolve(fullJSON);
    });
    fileStream.on('error', (err) => {
      reject(err);
      fileStream.close();
    });
  });
}
