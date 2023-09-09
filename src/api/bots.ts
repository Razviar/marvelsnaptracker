import {Request} from 'root/app/request';
import {Bots} from 'root/models/bots';

export async function getBots(): Promise<Bots> {
  const res = await Request.get('/snap/do.php?cmd=getbots', {
    url: 'https://static2.marvelsnap.pro/snap/do.php?cmd=getbots',
  });

  return res;
}
